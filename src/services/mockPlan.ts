import type {
  DayPlan,
  Ingredient,
  Meal,
  NutriPlan,
  ShoppingCategory,
  TrainingDay,
} from '@/types/plan'
import type { Intolerance, SurveyData } from '@/types/survey'

/**
 * Przykładowy plan do pracy nad UI bez backendu i bez kosztów OpenAI
 * (włączany przez VITE_USE_MOCK=true). Plan reaguje na ankietę: liczba dni treningowych
 * i nietolerancje z listy (posiłki z alergenem są zamieniane na bezpieczne odpowiedniki).
 * Lista zakupów jest liczona z przepisów tak jak na serwerze: sumowanie po nazwie
 * i jednostce, grupowanie po kategorii. Wolny tekst „inne nietolerancje" mock ignoruje.
 */

const ing = (
  name: string,
  amount: number,
  unit: string,
  category: string,
  estimatedPricePln: number,
): Ingredient => ({ name, amount, unit, category, estimatedPricePln })

const OATMEAL: Meal = {
  mealType: 'Śniadanie',
  name: 'Owsianka z bananem',
  description: 'Płatki owsiane zalej mlekiem i gotuj 5 minut. Dodaj pokrojonego banana.',
  ingredients: [
    ing('płatki owsiane', 80, 'g', 'Pieczywo i zboża', 0.8),
    ing('mleko', 250, 'ml', 'Nabiał', 1.2),
    ing('banan', 1, 'szt.', 'Warzywa i owoce', 1.5),
  ],
  kcal: 450,
  proteinG: 18,
  carbsG: 70,
  fatG: 10,
}

const SCRAMBLED_EGGS: Meal = {
  mealType: 'Śniadanie',
  name: 'Jajecznica z papryką',
  description: 'Paprykę podsmaż na oliwie, wbij jajka i smaż, aż się zetną.',
  ingredients: [
    ing('jajko', 3, 'szt.', 'Jajka', 2.1),
    ing('papryka', 100, 'g', 'Warzywa i owoce', 1.5),
    ing('oliwa', 10, 'ml', 'Inne', 0.6),
  ],
  kcal: 380,
  proteinG: 24,
  carbsG: 8,
  fatG: 28,
}

const MILLET_BANANA: Meal = {
  mealType: 'Śniadanie',
  name: 'Kasza jaglana z bananem',
  description: 'Kaszę jaglaną ugotuj na wodzie. Dodaj pokrojonego banana i szczyptę cynamonu.',
  ingredients: [
    ing('kasza jaglana', 80, 'g', 'Pieczywo i zboża', 0.9),
    ing('banan', 1, 'szt.', 'Warzywa i owoce', 1.5),
    ing('cynamon', 1, 'łyżeczka', 'Inne', 0.2),
  ],
  kcal: 420,
  proteinG: 12,
  carbsG: 80,
  fatG: 6,
}

const LUNCH: Meal = {
  mealType: 'Obiad',
  name: 'Kurczak z ryżem i brokułem',
  description: 'Kurczaka usmaż na oliwie. Ryż ugotuj, brokuła zblanszuj i podawaj razem.',
  ingredients: [
    ing('pierś z kurczaka', 150, 'g', 'Mięso i ryby', 5.5),
    ing('ryż', 100, 'g', 'Pieczywo i zboża', 0.9),
    ing('brokuł', 150, 'g', 'Warzywa i owoce', 1.8),
    ing('oliwa', 10, 'ml', 'Inne', 0.6),
  ],
  kcal: 650,
  proteinG: 50,
  carbsG: 75,
  fatG: 15,
}

const COTTAGE_CHEESE_SANDWICHES: Meal = {
  mealType: 'Kolacja',
  name: 'Kanapki z twarogiem',
  description: 'Chleb posmaruj twarogiem, dodaj pokrojony pomidor.',
  ingredients: [
    ing('chleb razowy', 100, 'g', 'Pieczywo i zboża', 1.1),
    ing('twaróg', 150, 'g', 'Nabiał', 2.4),
    ing('pomidor', 1, 'szt.', 'Warzywa i owoce', 1.3),
  ],
  kcal: 400,
  proteinG: 32,
  carbsG: 40,
  fatG: 12,
}

const PUMPKIN_SOUP: Meal = {
  mealType: 'Kolacja',
  name: 'Krem z dyni z ryżem',
  description: 'Dynię ugotuj i zmiksuj z wodą i oliwą. Podawaj z ugotowanym ryżem.',
  ingredients: [
    ing('dynia', 300, 'g', 'Warzywa i owoce', 1.8),
    ing('ryż', 80, 'g', 'Pieczywo i zboża', 0.7),
    ing('oliwa', 10, 'ml', 'Inne', 0.6),
  ],
  kcal: 380,
  proteinG: 10,
  carbsG: 62,
  fatG: 11,
}

/** Posiłek razem z alergenami, które zawiera. Ostatnia opcja na liście jest zawsze bezpieczna. */
interface MealOption {
  meal: Meal
  allergens: Intolerance[]
}

const option = (meal: Meal, allergens: Intolerance[] = []): MealOption => ({ meal, allergens })

const BREAKFAST_OPTIONS = [
  option(OATMEAL, ['gluten', 'lactose']),
  option(SCRAMBLED_EGGS, ['eggs']),
  option(MILLET_BANANA),
]

const DINNER_OPTIONS = [
  option(COTTAGE_CHEESE_SANDWICHES, ['gluten', 'lactose']),
  option(PUMPKIN_SOUP),
]

/** Pierwsza opcja bez alergenów użytkownika; w ostateczności ostatnia (bezpieczna) z listy. */
function pickMeal(options: MealOption[], intolerances: Intolerance[]): Meal {
  const safe = options.find((o) => !o.allergens.some((a) => intolerances.includes(a)))
  return (safe ?? options[options.length - 1]).meal
}

const DAY_NAMES = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
]

/** Indeksy dni treningowych (0 = poniedziałek) dla zadanej liczby treningów w tygodniu. */
const TRAINING_PATTERN: Record<number, number[]> = {
  0: [],
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
}

const strengthDay = (day: string): TrainingDay => ({
  day,
  title: 'Trening siłowy: całe ciało',
  isRestDay: false,
  durationMin: 50,
  warmup: '5 minut marszu w miejscu i krążenia ramion.',
  exercises: [
    { name: 'Przysiad', sets: 4, reps: '8-12', notes: 'Plecy proste, kolana na zewnątrz.' },
    { name: 'Pompki', sets: 3, reps: '10-15', notes: '' },
    { name: 'Wiosłowanie z hantlą', sets: 3, reps: '10-12', notes: 'Łopatki ściągnięte.' },
    { name: 'Plank', sets: 3, reps: '30 s', notes: '' },
  ],
})

const restDay = (day: string): TrainingDay => ({
  day,
  title: 'Dzień odpoczynku',
  isRestDay: true,
  durationMin: 0,
  warmup: '',
  exercises: [],
})

function buildShoppingList(days: DayPlan[]): ShoppingCategory[] {
  const merged = new Map<string, Ingredient>()

  for (const day of days) {
    for (const meal of day.meals) {
      for (const item of meal.ingredients) {
        const key = `${item.name}|${item.unit}`
        const existing = merged.get(key)
        merged.set(
          key,
          existing
            ? {
                ...existing,
                amount: existing.amount + item.amount,
                estimatedPricePln: existing.estimatedPricePln + item.estimatedPricePln,
              }
            : { ...item },
        )
      }
    }
  }

  const byCategory = new Map<string, ShoppingCategory['items']>()
  for (const item of merged.values()) {
    const items = byCategory.get(item.category) ?? []
    items.push({
      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      amount: Math.round(item.amount * 100) / 100,
      unit: item.unit,
      estimatedPricePln: Math.round(item.estimatedPricePln * 100) / 100,
    })
    byCategory.set(item.category, items)
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pl'))
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    }))
}

/** Przykładowy plan dopasowany do ankiety: dni treningowe i nietolerancje. */
export function buildMockPlan(survey: SurveyData): NutriPlan {
  const intolerances = survey.intolerances ?? []
  const meals = [
    pickMeal(BREAKFAST_OPTIONS, intolerances),
    LUNCH,
    pickMeal(DINNER_OPTIONS, intolerances),
  ]
  const sum = (pick: (meal: Meal) => number) => meals.reduce((total, meal) => total + pick(meal), 0)

  const mealPlan: DayPlan[] = DAY_NAMES.map((day) => ({
    day,
    totalKcal: sum((meal) => meal.kcal),
    meals,
  }))

  const active = new Set(TRAINING_PATTERN[survey.trainingDaysPerWeek] ?? TRAINING_PATTERN[3])
  const trainingPlan: TrainingDay[] = DAY_NAMES.map((day, i) =>
    active.has(i) ? strengthDay(day) : restDay(day),
  )

  const shoppingList = buildShoppingList(mealPlan)

  return {
    summary: {
      dailyKcal: sum((meal) => meal.kcal),
      proteinG: sum((meal) => meal.proteinG),
      carbsG: sum((meal) => meal.carbsG),
      fatG: sum((meal) => meal.fatG),
      estimatedWeeklyCostPln: Math.round(
        shoppingList.reduce(
          (total, cat) => total + cat.items.reduce((s, item) => s + item.estimatedPricePln, 0),
          0,
        ),
      ),
    },
    mealPlan,
    trainingPlan,
    shoppingList,
  }
}
