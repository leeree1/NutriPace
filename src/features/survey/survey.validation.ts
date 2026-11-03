import type { SurveyData, SurveyDraft } from '@/types'
import { BUDGET, type SurveyStepId } from './survey.options'

/** Czy z danego kroku można przejść dalej. */
export function isStepValid(step: SurveyStepId, draft: SurveyDraft): boolean {
  switch (step) {
    case 'goal':
      return draft.goal !== null
    case 'budget':
      return (
        draft.weeklyBudgetPln >= BUDGET.min && draft.weeklyBudgetPln <= BUDGET.max
      )
    case 'equipment':
      return draft.trainingPlace !== null
    case 'intolerances':
      return true
  }
}

/** Zamienia roboczy stan formularza na kompletne dane; `null`, gdy czegoś brakuje. */
export function toSurveyData(draft: SurveyDraft): SurveyData | null {
  if (draft.goal === null || draft.trainingPlace === null) return null

  return {
    ...draft,
    goal: draft.goal,
    trainingPlace: draft.trainingPlace,
    // Sprzęt domowy nie ma sensu przy treningu na siłowni.
    homeEquipment: draft.trainingPlace === 'home' ? draft.homeEquipment : [],
    otherIntolerances: draft.otherIntolerances.trim(),
  }
}
