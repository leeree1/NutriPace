import type { DayPlan } from "../src/types/plan";

// Plik z prefiksem "_" nie jest publicznym endpointem Vercel, to zwykły moduł pomocniczy.

/** Polskie nazwy nietolerancji z ankiety (klucze jak w src/types/survey.ts). */
const INTOLERANCE_LABELS: Record<string, string> = {
  gluten: "gluten (pszenica, żyto, jęczmień, chleb, makaron, mąka, kasza manna, kuskus)",
  lactose: "laktoza (mleko i przetwory mleczne: ser, jogurt, kefir, śmietana, masło, twaróg)",
  nuts: "orzechy (włoskie, laskowe, migdały, nerkowce, pistacje)",
  peanuts: "orzeszki ziemne (także masło orzechowe)",
  eggs: "jaja",
  soy: "soja (tofu, tempeh, sos sojowy, edamame)",
  fish: "ryby",
  shellfish: "owoce morza (krewetki, małże, kalmary)",
};

/**
 * Rdzenie słów: słowo z planu pasuje, gdy zaczyna się od rdzenia (odmiana: ryż, ryżu, ryżem).
 * `exact` to krótkie słowa, które muszą pasować w całości (np. „ser", żeby nie łapać „seler").
 * `safe` usuwa z tekstu frazy, które tylko brzmią podobnie (np. „mleko kokosowe" przy laktozie).
 */
interface Terms {
  stems: string[];
  exact?: string[];
  safe?: RegExp;
}

const PLANT_BASED = "orzechow|migdałow|kokosow|sojow|owsian|ryżow|roślinn|bezlaktozow";

const INTOLERANCE_TERMS: Record<string, Terms> = {
  gluten: {
    stems: [
      "pszen", "żytn", "żyto", "jęczmien", "owsian", "chleb", "bułk", "bułc", "bagiet", "makaron",
      "mąk", "mąc", "kuskus", "manna", "mannę", "seitan", "pierog", "tortill", "panierk", "pieczyw",
      "tosty", "tost", "naleśnik", "spaghetti", "penne", "lasagne",
    ],
  },
  lactose: {
    stems: [
      "mlek", "mleczn", "jogurt", "kefir", "śmietan", "śmietank", "masł", "maślank", "twaróg",
      "twarog", "twarożk", "serek", "serow", "serwatk", "skyr", "mascarpone", "ricotta",
      "mozzarell", "parmezan", "feta", "fety", "cheddar", "gouda",
    ],
    exact: ["ser", "sera", "serem", "serze", "sery", "serów"],
    safe: new RegExp(`(masł|mlek|jogurt|śmietan)\\p{L}*\\s+(${PLANT_BASED})\\p{L}*`, "gu"),
  },
  nuts: {
    stems: ["orzech", "migdał", "laskow", "nerkowc", "pistacj", "pekan", "makadami"],
  },
  peanuts: {
    // „orzechow" łapie też „masło orzechowe", czyli zwykle masło z orzeszków ziemnych
    stems: ["orzeszk", "arachid", "orzechow"],
  },
  eggs: {
    stems: ["jaj", "jajecz", "omlet", "majonez", "żółtk"],
  },
  soy: {
    stems: ["soj", "tofu", "tempeh", "edamame"],
  },
  fish: {
    stems: [
      "ryb", "łosoś", "łososi", "tuńczyk", "dorsz", "makrel", "śledź", "śledzi", "sardyn", "pstrąg",
      "mintaj", "halibut", "anchois", "karp", "szczupak", "okoń", "morszczuk",
    ],
  },
  shellfish: {
    stems: ["krewetk", "małż", "ostryg", "kalmar", "homar", "krab", "langust", "mule", "ośmiornic"],
  },
};

const STOPWORDS = new Set([
  "bez", "nie", "jem", "lubię", "unikam", "alergia", "uczulenie", "uczulony", "uczulona", "oraz",
  "lub", "przyprawy", "przyprawa", "ostre", "ostry", "produkty", "jedzenie", "dużo", "mało", "inne",
]);

const tokenize = (text: string): string[] => text.toLowerCase().match(/\p{L}+/gu) ?? [];

export interface Exclusion {
  /** Opis do promptu i komunikatów. */
  label: string;
  /** Zwraca znalezione słowo z `text` albo null. */
  find: (text: string) => string | null;
}

function fromTerms(label: string, terms: Terms): Exclusion {
  return {
    label,
    find: (text) => {
      const cleaned = terms.safe ? text.toLowerCase().replace(terms.safe, " ") : text;
      const words = tokenize(cleaned);
      for (const word of words) {
        if (terms.exact?.includes(word)) return word;
        if (terms.stems.some((stem) => word.startsWith(stem))) return word;
      }
      return null;
    },
  };
}

/** Wolny tekst z ankiety („ryż, seler") zamieniamy na rdzenie słów. */
function fromFreeText(other: string): Exclusion[] {
  return other
    .split(/[,;\n]| i | oraz | lub /i)
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .flatMap((phrase) => {
      const stems = tokenize(phrase)
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
        .map((word) => (word.length >= 5 ? word.slice(0, Math.max(4, word.length - 2)) : word));
      if (stems.length === 0) return [];
      return [
        {
          label: phrase,
          find: (text: string) => {
            const words = tokenize(text);
            const hit = words.find((word) => stems.some((stem) => word.startsWith(stem)));
            return hit ?? null;
          },
        },
      ];
    });
}

export function buildExclusions(intolerances: unknown, otherIntolerances: unknown): Exclusion[] {
  const known = Array.isArray(intolerances)
    ? intolerances.filter((key): key is string => typeof key === "string" && key in INTOLERANCE_TERMS)
    : [];

  // Wolny tekst przycinamy, bo trafia do promptu (koszt i nadużycia).
  const other = typeof otherIntolerances === "string" ? otherIntolerances.slice(0, 200) : "";

  return [
    ...[...new Set(known)].map((key) => fromTerms(INTOLERANCE_LABELS[key], INTOLERANCE_TERMS[key])),
    ...fromFreeText(other),
  ];
}

/** Reguła do dopisania do promptu; pusty tekst, gdy nic nie wykluczamy. */
export function exclusionsPrompt(exclusions: Exclusion[]): string {
  if (exclusions.length === 0) return "";
  return (
    " 7) BEZWZGLĘDNY ZAKAZ: w żadnym posiłku, opisie ani składniku nie wolno użyć: " +
    exclusions.map((e) => e.label).join("; ") +
    ". Dotyczy to także produktów, które to zawierają. Jeśli przepis wymaga takiego składnika, wybierz inny przepis."
  );
}

/** Sprawdza posiłki pod kątem wykluczeń. Zwraca opisy naruszeń (pusta lista = plan jest w porządku). */
export function findViolations(days: DayPlan[], exclusions: Exclusion[]): string[] {
  if (exclusions.length === 0) return [];

  const violations = new Set<string>();
  for (const day of days) {
    for (const meal of day.meals) {
      const texts = [meal.name, meal.description, ...(meal.ingredients ?? []).map((i) => i.name)];
      for (const exclusion of exclusions) {
        for (const text of texts) {
          const hit = exclusion.find(text ?? "");
          if (hit) violations.add(`„${hit}" w posiłku „${meal.name}" (zakaz: ${exclusion.label})`);
        }
      }
    }
  }
  return [...violations];
}
