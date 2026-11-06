import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { AiPlanSchema } from "../src/types/plan"; // dostosuj ścieżkę do swojego projektu
import type { DayPlan, NutriPlan, ShoppingCategory } from "../src/types/plan";
import { buildExclusions, exclusionsPrompt, findViolations } from "./_exclusions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vercel: generowanie trwa kilkanaście sekund, domyślny limit bywa za krótki
export const config = { maxDuration: 60 };

// Druga próba ma sens tylko, jeśli pierwsza skończyła się dość wcześnie.
const RETRY_DEADLINE_MS = 25_000;

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

const SYSTEM_PROMPT =
  "Jesteś profesjonalnym dietetykiem klinicznym oraz trenerem personalnym. " +
  "Na podstawie ankiety wygeneruj spersonalizowany 7-dniowy plan. " +
  "Wszystkie nazwy posiłków, opisy oraz przepisy pisz w języku polskim. " +
  "Zasady: " +
  "1) mealPlan ma dokładnie 7 elementów (poniedziałek-niedziela), każdy dzień ma 3-5 posiłków. " +
  "2) Każdy posiłek ma kcal, proteinG, carbsG, fatG; suma kcal posiłków = totalKcal dnia, a totalKcal ≈ summary.dailyKcal. " +
  "3) Uwzględnij alergie, wykluczenia, dietę i cel z ankiety. " +
  "4) Każdy posiłek ma w polu ingredients PEŁNĄ listę składników użytych w opisie przepisu, " +
  "z ilością na ten jeden posiłek, jednostką (g, ml, szt., łyżka, łyżeczka), kategorią sklepową i szacowanym kosztem w zł. " +
  "Każdy produkt wspomniany w przepisie (także tuńczyk, oliwa, przyprawy, sól) musi być w ingredients. " +
  "Nazwy składników pisz w mianowniku, w liczbie pojedynczej, zawsze tak samo dla tego samego produktu (np. zawsze 'jajko', nigdy 'jajka'). " +
  "5) Łączny koszt wszystkich składników z całego tygodnia ma mieścić się w budżecie z ankiety (jeśli podano). " +
  "6) trainingPlan ma dokładnie 7 elementów (poniedziałek-niedziela). " +
  "Dostosuj go do ankiety: cel, poziom zaawansowania, dostępny sprzęt, miejsce treningów, liczbę dni treningowych w tygodniu i ewentualne kontuzje lub ograniczenia. " +
  "Dni treningowe mają 4-8 ćwiczeń, każde z liczbą serii (sets), powtórzeniami lub czasem (reps) i krótką wskazówką (notes), oraz krótką rozgrzewkę (warmup). " +
  "Dni odpoczynku mają isRestDay=true, durationMin=0, pustą tablicę exercises i pusty warmup; w title możesz zaproponować lekką aktywność, np. spacer. " +
  "Rozłóż dni treningowe i odpoczynku sensownie (nie trenuj tej samej partii mięśni dzień po dniu).";

// Jedno zapytanie do modelu. `feedback` to uwagi do poprzedniej, odrzuconej odpowiedzi.
async function requestPlan(surveyData: unknown, exclusionRule: string, feedback?: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 16000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT + exclusionRule },
      { role: "user", content: `Dane ankiety użytkownika: ${JSON.stringify(surveyData)}` },
      ...(feedback ? [{ role: "user" as const, content: feedback }] : []),
    ],
    response_format: zodResponseFormat(AiPlanSchema, "nutri_plan"),
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
  return AiPlanSchema.parse(JSON.parse(choice.message.content));
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

    let aiPlan = await requestPlan(surveyData, exclusionRule);
    let violations = findViolations(aiPlan.mealPlan, exclusions);

    // Jedna powtórka, ale tylko gdy zostaje czas w limicie funkcji (maxDuration = 60 s).
    if (violations.length > 0 && Date.now() - startedAt < RETRY_DEADLINE_MS) {
      aiPlan = await requestPlan(
        surveyData,
        exclusionRule,
        "Poprzednia odpowiedź złamała zakaz: " +
          violations.slice(0, 8).join("; ") +
          ". Wygeneruj cały plan od nowa, bez tych składników.",
      );
      violations = findViolations(aiPlan.mealPlan, exclusions);
    }

    if (violations.length > 0) {
      console.warn("Plan łamie wykluczenia z ankiety:", violations);
      return res.status(422).json({
        success: false,
        error: "Nie udało się wygenerować planu zgodnego z Twoimi wykluczeniami. Spróbuj ponownie.",
      });
    }

    if (aiPlan.mealPlan.length === 0) {
      throw new Error("Plan jest niekompletny. Spróbuj ponownie.");
    }

    // Lista zakupów liczona z przepisów, więc zawsze jest z nimi spójna
    const { list, totalCost } = buildShoppingList(aiPlan.mealPlan);
    if (list.length === 0) {
      throw new Error("Nie udało się zbudować listy zakupów. Spróbuj ponownie.");
    }

    const plan: NutriPlan = {
      ...aiPlan,
      summary: { ...aiPlan.summary, estimatedWeeklyCostPln: totalCost },
      shoppingList: list,
    };

    return res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    console.error("Błąd podczas generowania planu:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Wystąpił błąd serwera.",
    });
  }
}