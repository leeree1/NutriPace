import { useState } from 'react'
import { Disclaimer } from '@/components/Disclaimer'
import { Button } from '@/components/ui/Button'
import { SurveyForm } from '@/features/survey'
import PlanGenerator from '@/components/PlanGenerator'
import type { SurveyData } from '@/types'
import type { NutriPlan } from '@/types/plan'
import { usePlanGeneration } from '@/services/usePlanGeneration'
import {
  clearAll,
  clearPlan,
  loadPlan,
  loadSurvey,
  savePlan,
  saveSurvey,
  type StoredPlan,
} from '@/lib/storage'
import { Dashboard } from '@/features/dashboard'

export default function App() {
  // Ankieta i plan przeżywają odświeżenie strony (localStorage).
  const [survey, setSurvey] = useState<SurveyData | null>(loadSurvey)
  const [stored, setStored] = useState<StoredPlan | null>(loadPlan)
  const { status, error, generate, cancel } = usePlanGeneration()

  const startGeneration = (data: SurveyData) =>
    generate(data, (generated: NutriPlan) => {
      const next = { id: crypto.randomUUID(), plan: generated }
      savePlan(next)
      setStored(next)
    })

  // Ostatni krok ankiety od razu uruchamia generowanie.
  const handleSurveyComplete = (data: SurveyData) => {
    clearPlan()
    setStored(null)
    saveSurvey(data)
    setSurvey(data)
    void startGeneration(data)
  }

  const resetAll = () => {
    cancel()
    clearAll()
    setStored(null)
    setSurvey(null)
  }

  if (!survey) {
    return <SurveyForm onComplete={handleSurveyComplete} />
  }

  // Gdy plan jest gotowy, pokazujemy dashboard z zakładkami.
  if (stored) {
    return (
      <Dashboard
        plan={stored.plan}
        planId={stored.id}
        weeklyBudgetPln={survey.weeklyBudgetPln}
        onReset={resetAll}
      />
    )
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4 pt-10">
      <h1 className="text-2xl font-bold tracking-tight">Twój plan</h1>

      <PlanGenerator
        status={status}
        errorMessage={error}
        onGenerate={() => void startGeneration(survey)}
        onCancel={cancel}
      />

      <Disclaimer />
      {status !== 'loading' && (
        <Button variant="ghost" onClick={resetAll}>
          Wypełnij ankietę ponownie
        </Button>
      )}
    </main>
  )
}
