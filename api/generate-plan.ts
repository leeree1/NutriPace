import { OpenAI } from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AiPlanSchema, DaySchema, TrainingDaySchema } from "../src/types/plan";
import type { DayPlan, NutriPlan, ShoppingCategory } from "../src/types/plan";
import { buildExclusions, exclusionsPrompt, findViolations } from "./_exclusions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vercel: generowanie trwa kilkanaście sekund, domyślny limit bywa za krótki
export const config = { maxDuration: 120 };

// Powtórka części planu ma sens tylko, jeśli pierwsza próba skończyła się dość wcześnie
// (limit funkcji to maxDuration = 120 s, a jeden dzień trwa ok. 10-15 s).
const RETRY_DEADLINE_MS = 60_000;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

// Buduje listę zakupów ze WSZYSTKICH składników wszystkich posiłków
function buildShoppingList(days: DayPlan[]): { list: ShoppingCategory[]; totalCost: number } {
  const merged = new Map<
    string,
    { name: string; unit: string; amount: number; price: number; category: string }
  >();

  for (const day of days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients ?? []) {
        let unit = ing.unit.trim().toLowerCase();
        let amount = Number(ing.amount) || 0;

        // Ujednolicenie jednostek, żeby 0,2 kg i 150 g dało się zsumować
        if (unit === "kg") { unit = "g"; amount *= 1000; }
        if (unit === "l") { unit = "ml"; amount *= 1000; }

        const name = ing.name.trim().toLowerCase();
        const key = `${name}|${unit}`;
        const price = Number(ing.estimatedPricePln) || 0;

        const existing = merged.get(key);
        if (existing) {
          existing.amount += amount;
          existing.price += price;
        } else {
          merged.set(key, {
            name,
            unit,
            amount,
            price,
            category: ing.category?.trim() || "Inne",
          });
        }
      }
    }
  }

  const byCategory = new Map<string, ShoppingCategory["items"]>();
  let totalCost = 0;

  for (const item of merged.values()) {
    let { amount, unit } = item;
    if (unit === "g" && amount >= 1000) { amount /= 1000; unit = "kg"; }
    if (unit === "ml" && amount >= 1000) { amount /= 1000; unit = "l"; }

    totalCost += item.price;

    const items = byCategory.get(item.category) ?? [];
    items.push({
      name: capitalize(item.name),
      amount: round(amount, 2),
      unit,
      estimatedPricePln: round(item.price, 2),
    });
    byCategory.set(item.category, items);
  }

  const list = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pl"))
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name, "pl")),
    }));

  return { list, totalCost: round(totalCost, 2) };
}

// Plan powstaje z wielu krótkich zapytań, które lecą równolegle: jeden dzień jadłospisu = jedno
// zapytanie, plus trening. Jedno zapytanie o cały plan trwało ok. 90 s, a model często mylił
// się w liczbie dni, gdy prosiliśmy o kilka dni naraz.

const DAYS_PL = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

// Każdy dzień dostaje inny „motyw" białka, żeby niezależne zapytania nie powtarzały tych samych dań.
const DAY_THEMES = [
  "kurczak lub indyk",
  "ryba lub owoce morza",
  "jajka i nabiał",
  "chude mięso czerwone",
  "rośliny strączkowe (soczewica, ciecierzyca, fasola)",
  "ryba, tofu lub tempeh",
  "dowolne białko, danie na spokojny weekend",
];

const TargetsSchema = z.object({
  dailyKcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});
const MealsPartSchema = z.object({ mealPlan: z.array(DaySchema) });
const TrainingPartSchema = z.object({ trainingPlan: z.array(TrainingDaySchema) });

type Targets = z.infer<typeof TargetsSchema>;

const BASE_PROMPT =
  "Jesteś profesjonalnym dietetykiem klinicznym oraz trenerem personalnym. " +
  "Wszystkie nazwy, opisy i przepisy pisz w języku polskim. ";

const TARGETS_PROMPT =
  BASE_PROMPT +
  "Na podstawie ankiety ustal dzienne zapotrzebowanie użytkownika: dailyKcal (kcal) oraz dzienne " +
  "makroskładniki proteinG, carbsG, fatG dopasowane do jego celu. Zwróć tylko te liczby.";

function dayPrompt(dayIndex: number, t: Targets) {
  return (
    BASE_PROMPT +
    `Wygeneruj jadłospis na JEDEN dzień: ${DAYS_PL[dayIndex]}. ` +
    `Pole mealPlan ma mieć dokładnie 1 element, z polem day równym "${DAYS_PL[dayIndex]}". ` +
    "Zasady: " +
    "1) Dzień ma 3-5 posiłków. " +
    `2) Dzienny cel to ok. ${t.dailyKcal} kcal (białko ${t.proteinG} g, węglowodany ${t.carbsG} g, tłuszcze ${t.fatG} g). ` +
    "Każdy posiłek ma kcal, proteinG, carbsG, fatG, a totalKcal dnia to suma kcal jego posiłków i ma być bliskie celowi. " +
    "3) Uwzględnij alergie, wykluczenia, dietę i cel z ankiety. Wykluczenia i dieta są ważniejsze niż motyw dnia. " +
    "4) Każdy posiłek ma w polu ingredients PEŁNĄ listę składników użytych w opisie przepisu, " +
    "z ilością na ten jeden posiłek, jednostką (g, ml, szt., łyżka, łyżeczka), kategorią sklepową i szacowanym kosztem w zł. " +
    "Każdy produkt wspomniany w przepisie (także tuńczyk, oliwa, przyprawy, sól) musi być w ingredients. " +
    "Nazwy składników pisz w mianowniku, w liczbie pojedynczej, zawsze tak samo dla tego samego produktu (np. zawsze 'jajko', nigdy 'jajka'). " +
    "5) Koszt składników z całego tygodnia ma mieścić się w budżecie z ankiety (jeśli podano); ten dzień to 1/7 tygodnia, " +
    "więc jego koszt ma być ok. 1/7 budżetu. " +
    `6) Dla urozmaicenia tygodnia oprzyj główne posiłki tego dnia na motywie: ${DAY_THEMES[dayIndex]} ` +
    "(o ile pozwalają na to wykluczenia i dieta z ankiety; jeśli nie, wybierz inne źródło białka)."
  );
}

const TRAINING_PROMPT =
  BASE_PROMPT +
  "Wygeneruj plan treningowy: trainingPlan ma mieć dokładnie 7 elementów (poniedziałek-niedziela). " +
  "Dostosuj go do ankiety: cel, poziom zaawansowania, dostępny sprzęt, miejsce treningów, liczbę dni treningowych w tygodniu i ewentualne kontuzje lub ograniczenia. " +
  "Dni treningowe mają 4-8 ćwiczeń, każde z liczbą serii (sets), powtórzeniami lub czasem (reps) i krótką wskazówką (notes), oraz krótką rozgrzewkę (warmup). " +
  "Dni odpoczynku mają isRestDay=true, durationMin=0, pustą tablicę exercises i pusty warmup; w title możesz zaproponować lekką aktywność, np. spacer. " +
  "Rozłóż dni treningowe i odpoczynku sensownie (nie trenuj tej samej partii mięśni dzień po dniu).";

// Jedno zapytanie do modelu. `feedback` to uwagi do poprzedniej, odrzuconej odpowiedzi.
async function askModel<T extends z.ZodTypeAny>(
  schema: T,
  name: string,
  system: string,
  surveyData: unknown,
  maxTokens: number,
  feedback?: string,
): Promise<z.infer<T>> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Dane ankiety użytkownika: ${JSON.stringify(surveyData)}` },
      ...(feedback ? [{ role: "user" as const, content: feedback }] : []),
    ],
    response_format: zodResponseFormat(schema, name),
  });

  const choice = completion.choices[0];

  if (choice.finish_reason === "length") {
    throw new Error("Odpowiedź modelu została ucięta. Spróbuj ponownie.");
  }
  if (choice.message.refusal) {
    throw new Error("Model odmówił wygenerowania planu.");
  }
  if (!choice.message.content) {
    throw new Error("Model nie zwrócił odpowiedzi.");
  }

  // Walidacja Zodem: gwarantuje, że frontend dostanie dokładnie oczekiwaną strukturę
  return schema.parse(JSON.parse(choice.message.content)) as z.infer<T>;
}

// Model nie ma w schemacie wymuszonej długości tablicy, więc liczbę elementów sprawdzamy w kodzie.
// Przy złej liczbie powtarzamy tylko to zapytanie (jedna próba), potem zgłaszamy błąd.
async function withExpectedLength<T>(
  request: (feedback?: string) => Promise<T[]>,
  expected: number,
  label: string,
): Promise<T[]> {
  let result = await request();
  if (result.length !== expected) {
    console.warn(`Część "${label}": ${result.length} elementów zamiast ${expected}, ponawiam.`);
    result = await request(
      `Poprzednia odpowiedź miała ${result.length} elementów zamiast ${expected}. ` +
        `Zwróć dokładnie ${expected} elementów.`,
    );
  }
  if (result.length !== expected) {
    throw new Error(`Część planu "${label}" jest niekompletna. Spróbuj ponownie.`);
  }
  return result;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const surveyData = req.body;

    if (!surveyData || typeof surveyData !== "object" || Object.keys(surveyData).length === 0) {
      return res.status(400).json({ success: false, error: "Brak danych ankiety." });
    }

    // Wykluczenia z ankiety pilnujemy też w kodzie, bo sam prompt bywa ignorowany.
    const exclusions = buildExclusions(surveyData.intolerances, surveyData.otherIntolerances);
    const exclusionRule = exclusionsPrompt(exclusions);
    const startedAt = Date.now();

    // Krok 1 (kilka sekund): wspólny cel kalorii i makro, żeby wszystkie dni były spójne.
    const targets = await askModel(TargetsSchema, "targets", TARGETS_PROMPT, surveyData, 300);

    // Jeden dzień jadłospisu (opcjonalnie z uwagą do poprzedniej, odrzuconej odpowiedzi).
    const requestDay = async (dayIndex: number, feedback?: string): Promise<DayPlan[]> =>
      (
        await askModel(
          MealsPartSchema,
          "meal_day",
          dayPrompt(dayIndex, targets) + exclusionRule,
          surveyData,
          3000,
          feedback,
        )
      ).mealPlan;

    // Krok 2: 7 dni jadłospisu i trening lecą równolegle. Dla każdego dnia: sprawdzenie długości,
    // a przy złamanych wykluczeniach jedna powtórka tego jednego dnia (o ile zostaje czas).
    const generateDay = async (dayIndex: number) => {
      const label = `jadłospis ${DAYS_PL[dayIndex]}`;
      const [first] = await withExpectedLength((fb) => requestDay(dayIndex, fb), 1, label);
      const found = findViolations([first], exclusions);
      if (found.length === 0 || Date.now() - startedAt >= RETRY_DEADLINE_MS) {
        return { day: first, violations: found };
      }
      const violationFeedback =
        "Poprzednia odpowiedź złamała zakaz: " +
        found.slice(0, 8).join("; ") +
        ". Wygeneruj ten dzień od nowa, bez tych składników.";
      const [retried] = await withExpectedLength(
        (fb) => requestDay(dayIndex, fb ? `${violationFeedback} ${fb}` : violationFeedback),
        1,
        `${label} (powtórka)`,
      );
      return { day: retried, violations: findViolations([retried], exclusions) };
    };

    const [days, trainingDays] = await Promise.all([
      Promise.all(DAYS_PL.map((_, i) => generateDay(i))),
      withExpectedLength(
        async (fb) =>
          (await askModel(TrainingPartSchema, "training_part", TRAINING_PROMPT, surveyData, 6000, fb))
            .trainingPlan,
        7,
        "trening",
      ),
    ]);

    const violations = days.flatMap((d) => d.violations);
    if (violations.length > 0) {
      console.warn("Plan łamie wykluczenia z ankiety:", violations);
      return res.status(422).json({
        success: false,
        error: "Nie udało się wygenerować planu zgodnego z Twoimi wykluczeniami. Spróbuj ponownie.",
      });
    }

    // Nazwy dni ustawiamy w kodzie, więc kolejność i podpisy zawsze się zgadzają.
    const mealPlan = days.map((d, i) => ({ ...d.day, day: DAYS_PL[i] }));
    const trainingPlan = trainingDays.map((d, i) => ({ ...d, day: DAYS_PL[i] ?? d.day }));

    // Lista zakupów liczona z przepisów, więc zawsze jest z nimi spójna
    const { list, totalCost } = buildShoppingList(mealPlan);
    if (list.length === 0) {
      throw new Error("Nie udało się zbudować listy zakupów. Spróbuj ponownie.");
    }

    const aiPlan = AiPlanSchema.parse({
      summary: { ...targets, estimatedWeeklyCostPln: totalCost },
      mealPlan,
      trainingPlan,
    });

    const plan: NutriPlan = { ...aiPlan, shoppingList: list };

    return res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    console.error("Błąd podczas generowania planu:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Wystąpił błąd serwera.",
    });
  }
}
