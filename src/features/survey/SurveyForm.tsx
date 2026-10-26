import type { ComponentType, FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { SurveyData } from '@/types'
import { Button } from '@/components/ui/Button'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { SURVEY_STEPS, type SurveyStepId } from './survey.options'
import { useSurveyForm } from './useSurveyForm'
import { BudgetStep } from './steps/BudgetStep'
import { EquipmentStep } from './steps/EquipmentStep'
import { GoalStep } from './steps/GoalStep'
import { IntolerancesStep } from './steps/IntolerancesStep'
import type { StepProps } from './steps/types'

const STEP_COMPONENTS: Record<SurveyStepId, ComponentType<StepProps>> = {
  goal: GoalStep,
  budget: BudgetStep,
  equipment: EquipmentStep,
  intolerances: IntolerancesStep,
}

interface SurveyFormProps {
  /** Wywoływane po ostatnim kroku z kompletnymi, zwalidowanymi danymi. */
  onComplete: (data: SurveyData) => void
}

export function SurveyForm({ onComplete }: SurveyFormProps) {
  const { draft, update, step, stepIndex, isFirstStep, isLastStep, canProceed, back, next } =
    useSurveyForm(onComplete)

  const StepComponent = STEP_COMPONENTS[step.id]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    next()
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
    >
      <header className="px-4 pt-6 sm:pt-10">
        <div className="mb-5 flex items-center gap-2 text-brand-700">
          <Sparkles className="size-5" aria-hidden />
          <span className="font-bold tracking-tight">NutriPace AI</span>
        </div>
        <StepIndicator steps={SURVEY_STEPS} currentIndex={stepIndex} />
      </header>

      <main className="flex-1 px-4 py-6">
        {/* key = remount kroku → fokus na nowym nagłówku i czysty stan UI */}
        <StepComponent key={step.id} data={draft} onChange={update} />
      </main>

      <footer className="sticky bottom-0 border-t border-slate-200 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex gap-3">
          {!isFirstStep && (
            <Button variant="ghost" onClick={back}>
              <ChevronLeft className="size-5" aria-hidden />
              Wstecz
            </Button>
          )}
          <Button type="submit" disabled={!canProceed} className="flex-1">
            {isLastStep ? (
              <>
                Generuj plan
                <Sparkles className="size-5" aria-hidden />
              </>
            ) : (
              <>
                Dalej
                <ChevronRight className="size-5" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </footer>
    </form>
  )
}
