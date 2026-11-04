import { z } from "zod";

// Składnik posiłku: z tych danych serwer sam buduje listę zakupów
export const IngredientSchema = z.object({
  name: z.string().describe("Nazwa w mianowniku, liczba pojedyncza, np. tuńczyk w puszce, jajko, ryż basmati"),
  amount: z.number().describe("Ilość na ten jeden posiłek, np. 150"),
  unit: z.string().describe("Jednostka: g, ml, szt., łyżka lub łyżeczka"),
  category: z.string().describe("Kategoria sklepowa, np. Nabiał, Warzywa, Mięso i ryby, Pieczywo i zboża"),
  estimatedPricePln: z.number().describe("Szacowany koszt tej ilości w zł"),
});

export const MealSchema = z.object({
  mealType: z.string().describe("Np. Śniadanie, Obiad, Kolacja"),
  name: z.string(),
  description: z.string().describe("Krótki przepis po polsku, 2-4 zdania"),
  ingredients: z.array(IngredientSchema).describe("WSZYSTKIE składniki użyte w przepisie"),
  kcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});

export const DaySchema = z.object({
  day: z.string().describe("Np. Poniedziałek"),
  totalKcal: z.number(),
  meals: z.array(MealSchema),
});

export const ExerciseSchema = z.object({
  name: z.string().describe("Nazwa ćwiczenia po polsku, np. Przysiad ze sztangą"),
  sets: z.number().describe("Liczba serii"),
  reps: z.string().describe("Powtórzenia lub czas, np. 8-12 albo 30 s"),
  notes: z.string().describe("Krótka wskazówka techniczna lub pusty tekst"),
});

export const TrainingDaySchema = z.object({
  day: z.string().describe("Np. Poniedziałek"),
  title: z.string().describe("Np. Trening siłowy: góra ciała, Spacer lub Dzień odpoczynku"),
  isRestDay: z.boolean(),
  durationMin: z.number().describe("0 w dniu odpoczynku"),
  warmup: z.string().describe("Krótka rozgrzewka lub pusty tekst w dniu odpoczynku"),
  exercises: z.array(ExerciseSchema).describe("Pusta tablica w dniu odpoczynku"),
});

// Struktura listy zakupów zgodna z ShoppingListView: kategorie -> produkty
export const ShoppingItemSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  estimatedPricePln: z.number(),
});

export const ShoppingCategorySchema = z.object({
  category: z.string(),
  items: z.array(ShoppingItemSchema),
});

// Schemat, który dostaje model (BEZ listy zakupów, bo ta jest liczona w kodzie)
export const AiPlanSchema = z.object({
  summary: z.object({
    dailyKcal: z.number(),
    proteinG: z.number(),
    carbsG: z.number(),
    fatG: z.number(),
    estimatedWeeklyCostPln: z.number(),
  }),
  mealPlan: z.array(DaySchema),
  trainingPlan: z.array(TrainingDaySchema),
});

export type AiPlan = z.infer<typeof AiPlanSchema>;
export type NutriPlan = AiPlan & { shoppingList: ShoppingCategory[] };
export type DayPlan = z.infer<typeof DaySchema>;
export type TrainingDay = z.infer<typeof TrainingDaySchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Meal = z.infer<typeof MealSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
export type ShoppingCategory = z.infer<typeof ShoppingCategorySchema>;