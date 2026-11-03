import type { SurveyDraft } from '@/types'

/** Wspólne propsy wszystkich kroków ankiety. */
export interface StepProps {
  data: SurveyDraft
  onChange: (patch: Partial<SurveyDraft>) => void
}
