/**
 * Kształt odpowiedzi JSON z OpenAI (krok 2 MVP) – to samo opisujemy w prompcie
 * systemowym, a w UI (dashboard) mapujemy 1:1 na zakładki.
 * Liczby są zawsze w jednostkach podanych w nazwie pola (kcal, g, zł).
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Ingredient {
  name: string
  amount: number
  /** np. "g", "ml", "szt." */
  unit: string
}

export interface Meal {
  type: MealType
  name: string
  ingredients: Ingredient[]
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  /** Krótki opis przygotowania. */
  recipe?: string
}

export interface MealDay {
  /** 1 = poniedziałek … 7 = niedziela. */
  day: number
  meals: Meal[]
}

export interface Exercise {
  name: string
  sets: number
  /** Tekst, bo model zwraca też zakresy ("8-10") i czas ("30 s"). */
  reps: string
  restSec?: number
  notes?: string
}

export interface TrainingDay {
  /** 1 = poniedziałek … 7 = niedziela. */
  day: number
  /** np. "Góra ciała", "Nogi", "Odpoczynek". */
  focus: string
  isRestDay: boolean
  exercises: Exercise[]
}

export interface ShoppingItem {
  name: string
  amount: number
  unit: string
  estimatedPricePln?: number
}

export interface ShoppingCategory {
  /** np. "Nabiał", "Warzywa i owoce", "Mięso i ryby". */
  category: string
  items: ShoppingItem[]
}

export interface PlanSummary {
  dailyKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  estimatedWeeklyCostPln: number
}

/** Cały plan zwracany jednym wywołaniem (response_format: json_object). */
export interface NutriPlan {
  summary: PlanSummary;
  mealPlan: MealDay[];
  trainingPlan: TrainingDay[];
  shoppingList: ShoppingCategory[];
}

/** Odpowiedź funkcji "Ratunek w sklepie" (krok 4 MVP). */
export interface SubstituteSuggestion {
  name: string
  amount: number
  unit: string
  /** Dlaczego pasuje i czy zmienia makro posiłku. */
  reason: string
}

export interface SubstituteResponse {
  substitutes: SubstituteSuggestion[]
}


import { z } from "zod";

// --- Schematy Zod do Structured Outputs (OpenAI) ---

export const ingredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
});

export const mealSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string(),
  ingredients: z.array(ingredientSchema),
  kcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  recipe: z.string().optional(),
});

export const mealDaySchema = z.object({
  day: z.number(),
  meals: z.array(mealSchema),
});

export const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.string(),
  restSec: z.number().optional(),
  notes: z.string().optional(),
});

export const trainingDaySchema = z.object({
  day: z.number(),
  focus: z.string(),
  isRestDay: z.boolean(),
  exercises: z.array(exerciseSchema),
});

export const shoppingItemSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  estimatedPricePln: z.number().optional(),
});

export const shoppingCategorySchema = z.object({
  category: z.string(),
  items: z.array(shoppingItemSchema),
});

export const planSummarySchema = z.object({
  dailyKcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  estimatedWeeklyCostPln: z.number(),
});

export const nutriPlanSchema = z.object({
  summary: planSummarySchema,
  mealPlan: z.array(mealDaySchema),
  trainingPlan: z.array(trainingDaySchema),
  shoppingList: z.array(shoppingCategorySchema),
});