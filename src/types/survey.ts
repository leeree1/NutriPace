/**
 * Dane z ankiety (krok 1 MVP).
 * Wartości są po angielsku i stabilne – trafią do promptu dla OpenAI,
 * a polskie etykiety żyją wyłącznie w warstwie UI (survey.options.ts).
 */

export const GOALS = ['cut', 'bulk', 'health'] as const
export type Goal = (typeof GOALS)[number]

export const TRAINING_PLACES = ['home', 'gym'] as const
export type TrainingPlace = (typeof TRAINING_PLACES)[number]

export const HOME_EQUIPMENT = [
  'dumbbells',
  'resistance_bands',
  'pullup_bar',
  'kettlebell',
  'bench',
] as const
export type HomeEquipment = (typeof HOME_EQUIPMENT)[number]

export const INTOLERANCES = [
  'gluten',
  'lactose',
  'nuts',
  'peanuts',
  'eggs',
  'soy',
  'fish',
  'shellfish',
] as const
export type Intolerance = (typeof INTOLERANCES)[number]

/** Kompletne, zwalidowane dane – wejście do generatora planu. */
export interface SurveyData {
  goal: Goal
  weeklyBudgetPln: number
  trainingPlace: TrainingPlace
  /** Dotyczy tylko `trainingPlace === 'home'`; pusta lista = trening z masą ciała. */
  homeEquipment: HomeEquipment[]
  trainingDaysPerWeek: number
  /** Pusta lista = brak nietolerancji. */
  intolerances: Intolerance[]
  /** Wolny tekst uzupełniający (np. "seler, kiwi"). */
  otherIntolerances: string
}

/** Stan formularza w trakcie wypełniania – pola wyboru nie mają jeszcze wartości. */
export type SurveyDraft = Omit<SurveyData, 'goal' | 'trainingPlace'> & {
  goal: Goal | null
  trainingPlace: TrainingPlace | null
}
