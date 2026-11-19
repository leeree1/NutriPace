import type { SurveyData, SurveyDraft } from '@/types'
import type { NutriPlan } from '@/types/plan'
import { NutriPlanSchema } from '@/services/planApi'
import { GOALS, HOME_EQUIPMENT, INTOLERANCES, TRAINING_PLACES } from '@/types/survey'

const SURVEY_KEY = 'nutripace_survey'
const SURVEY_DRAFT_KEY = 'nutripace_survey_draft'
const PLAN_KEY = 'nutripace_plan'
const CHECKED_KEY = 'nutripace_checked_shopping'

/** Plan razem z identyfikatorem, do którego przypisane są odhaczenia na liście zakupów. */
export interface StoredPlan {
  id: string
  plan: NutriPlan
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Nie udało się zapisać do localStorage', error)
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // brak dostępu do localStorage (np. tryb prywatny) – nic do usunięcia
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

// Dane z localStorage mogą pochodzić ze starszej wersji aplikacji, więc sprawdzamy kształt.
function isSurveyData(value: unknown): value is SurveyData {
  return (
    isRecord(value) &&
    (GOALS as readonly unknown[]).includes(value.goal) &&
    (TRAINING_PLACES as readonly unknown[]).includes(value.trainingPlace) &&
    typeof value.weeklyBudgetPln === 'number' &&
    typeof value.trainingDaysPerWeek === 'number' &&
    Array.isArray(value.homeEquipment) &&
    Array.isArray(value.intolerances) &&
    typeof value.otherIntolerances === 'string'
  )
}

export function loadSurvey(): SurveyData | null {
  const value = read(SURVEY_KEY)
  return isSurveyData(value) ? value : null
}

export function saveSurvey(survey: SurveyData) {
  write(SURVEY_KEY, survey)
}

/** Szkic ankiety w trakcie wypełniania razem z numerem kroku. */
export interface StoredSurveyDraft {
  draft: SurveyDraft
  stepIndex: number
}

const pickKnown = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
  Array.isArray(value) ? value.filter((v): v is T => (allowed as readonly unknown[]).includes(v)) : []

/** `stepCount` pilnuje, żeby zapisany numer kroku nie wyszedł poza obecną ankietę. */
export function loadSurveyDraft(stepCount: number): StoredSurveyDraft | null {
  const value = read(SURVEY_DRAFT_KEY)
  if (!isRecord(value) || !isRecord(value.draft)) return null

  const d = value.draft
  const goal = (GOALS as readonly unknown[]).includes(d.goal) ? (d.goal as SurveyDraft['goal']) : null
  const trainingPlace = (TRAINING_PLACES as readonly unknown[]).includes(d.trainingPlace)
    ? (d.trainingPlace as SurveyDraft['trainingPlace'])
    : null
  if (typeof d.weeklyBudgetPln !== 'number' || typeof d.trainingDaysPerWeek !== 'number') return null

  const stepIndex = value.stepIndex
  if (typeof stepIndex !== 'number' || !Number.isInteger(stepIndex)) return null

  return {
    draft: {
      goal,
      trainingPlace,
      weeklyBudgetPln: d.weeklyBudgetPln,
      trainingDaysPerWeek: d.trainingDaysPerWeek,
      homeEquipment: pickKnown(d.homeEquipment, HOME_EQUIPMENT),
      intolerances: pickKnown(d.intolerances, INTOLERANCES),
      otherIntolerances: typeof d.otherIntolerances === 'string' ? d.otherIntolerances : '',
    },
    stepIndex: Math.min(Math.max(stepIndex, 0), stepCount - 1),
  }
}

export function saveSurveyDraft(stored: StoredSurveyDraft) {
  write(SURVEY_DRAFT_KEY, stored)
}

export function clearSurveyDraft() {
  remove(SURVEY_DRAFT_KEY)
}

export function loadPlan(): StoredPlan | null {
  const value = read(PLAN_KEY)
  if (!isRecord(value) || typeof value.id !== 'string') return null
  const parsed = NutriPlanSchema.safeParse(value.plan)
  return parsed.success ? { id: value.id, plan: parsed.data } : null
}

export function savePlan(stored: StoredPlan) {
  write(PLAN_KEY, stored)
}

/** Odhaczone pozycje zakupów należą do jednego planu; dla innego planu są ignorowane. */
export function loadChecked(planId: string): Record<string, boolean> {
  const value = read(CHECKED_KEY)
  if (!isRecord(value) || value.planId !== planId || !isRecord(value.items)) return {}
  return value.items as Record<string, boolean>
}

export function saveChecked(planId: string, items: Record<string, boolean>) {
  write(CHECKED_KEY, { planId, items })
}

/** Usuwa plan i jego odhaczenia (nowa ankieta, reset). */
export function clearPlan() {
  remove(PLAN_KEY)
  remove(CHECKED_KEY)
}

export function clearAll() {
  clearPlan()
  clearSurveyDraft()
  remove(SURVEY_KEY)
}
