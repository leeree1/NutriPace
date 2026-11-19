import { useEffect, useState } from 'react'
import type { SurveyData, SurveyDraft } from '@/types'
import { clearSurveyDraft, loadSurveyDraft, saveSurveyDraft } from '@/lib/storage'
import { INITIAL_DRAFT, SURVEY_STEPS } from './survey.options'
import { isStepValid, toSurveyData } from './survey.validation'

/** Cała logika wieloetapowej ankiety – komponenty zostają czysto prezentacyjne. */
export function useSurveyForm(onComplete: (data: SurveyData) => void) {
  // Szkic i krok przeżywają odświeżenie strony (localStorage).
  const [saved] = useState(() => loadSurveyDraft(SURVEY_STEPS.length))
  const [draft, setDraft] = useState<SurveyDraft>(saved?.draft ?? INITIAL_DRAFT)
  const [stepIndex, setStepIndex] = useState(saved?.stepIndex ?? 0)

  useEffect(() => {
    saveSurveyDraft({ draft, stepIndex })
  }, [draft, stepIndex])

  const step = SURVEY_STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === SURVEY_STEPS.length - 1
  const canProceed = isStepValid(step.id, draft)

  const update = (patch: Partial<SurveyDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }))

  const back = () => setStepIndex((i) => Math.max(0, i - 1))

  const next = () => {
    if (!canProceed) return

    if (!isLastStep) {
      setStepIndex((i) => i + 1)
      return
    }

    const data = toSurveyData(draft)
    if (data) {
      clearSurveyDraft()
      onComplete(data)
    }
  }

  return { draft, update, step, stepIndex, isFirstStep, isLastStep, canProceed, back, next }
}
