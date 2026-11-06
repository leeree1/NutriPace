import type {
  DayPlan,
  Ingredient,
  Meal,
  NutriPlan,
  ShoppingCategory,
  TrainingDay,
} from '@/types/plan'

/**
 * Przykładowy plan do pracy nad UI bez backendu i bez kosztów OpenAI
 * (włączany przez VITE_USE_MOCK=true). Lista zakupów jest liczona z przepisów
 * tak jak na serwerze: sumowanie po nazwie i jednostce, grupowanie po kategorii.
 */

const ing = (
  name: string,
  amount: number,
  unit: string,
  category: string,
  estimatedPricePln: number,
): Ingredient => ({ name, amount, unit, category, estimatedPricePln })

const BREAKFAST: Meal = {
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

const DINNER: Meal = {
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

const DAY_NAMES = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
]

const MEALS = [BREAKFAST, LUNCH, DINNER]

const mealPlan: DayPlan[] = DAY_NAMES.map((day) => ({
  day,
  totalKcal: MEALS.reduce((sum, meal) => sum + meal.kcal, 0),
  meals: MEALS,
}))

const STRENGTH_DAYS = new Set(['Poniedziałek', 'Środa', 'Piątek'])

const trainingPlan: TrainingDay[] = DAY_NAMES.map((day) =>
  STRENGTH_DAYS.has(day)
    ? {
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
      }
    : {
        day,
        title: 'Dzień odpoczynku',
        isRestDay: true,
        durationMin: 0,
        warmup: '',
        exercises: [],
      },
)

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

const shoppingList = buildShoppingList(mealPlan)

export const MOCK_PLAN: NutriPlan = {
  summary: {
    dailyKcal: 1500,
    proteinG: 100,
    carbsG: 185,
    fatG: 37,
    estimatedWeeklyCostPln: Math.round(
      shoppingList.reduce(
        (sum, cat) => sum + cat.items.reduce((s, item) => s + item.estimatedPricePln, 0),
        0,
      ),
    ),
  },
  mealPlan,
  trainingPlan,
  shoppingList,
}
