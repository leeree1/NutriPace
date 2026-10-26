import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SurveyForm } from '@/features/survey'
import type { SurveyData } from '@/types'

export default function App() {
  const [survey, setSurvey] = useState<SurveyData | null>(null)

  if (!survey) {
    return <SurveyForm onComplete={setSurvey} />
  }

  // Placeholder: w kroku 2 tutaj wywołamy generator planu (OpenAI),
  // a w kroku 3 pokażemy Dashboard z zakładkami.
  return (
    <main className="mx-auto max-w-xl space-y-4 p-4 pt-10">
      <h1 className="text-2xl font-bold tracking-tight">Ankieta gotowa ✔</h1>
      <p className="text-slate-600">
        Dane, które trafią do generatora planu (JSON wysyłany do promptu):
      </p>
      <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-emerald-300">
        {JSON.stringify(survey, null, 2)}
      </pre>
      <Button variant="ghost" onClick={() => setSurvey(null)}>
        Wypełnij ponownie
      </Button>
    </main>
  )
}
