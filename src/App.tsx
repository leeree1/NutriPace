import { useState } from 'react'
import { Disclaimer } from '@/components/Disclaimer'
import { Button } from '@/components/ui/Button'
import { SurveyForm } from '@/features/survey'
import PlanGenerator from '@/components/PlanGenerator'
import type { SurveyData } from '@/types'
import type { NutriPlan } from '@/types/plan'
import { ShoppingListView } from '@/components/ShoppingListView'
import { MealPlanView } from '@/components/MealPlanView'
import { TrainingPlanView } from '@/components/TrainingPlanView'

export default function App() {
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [plan, setPlan] = useState<NutriPlan | null>(null)

  if (!survey) {
    return <SurveyForm onComplete={setSurvey} />
  }

  // Jeśli plan został już wygenerowany, pokazujemy pełny widok z jadłospisem i listą zakupów
  if (plan) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 p-4 pt-10 pb-16">
        <div className="space-y-2 text-center bg-white p-6 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-600">Twój plan jest gotowy! 🎉</h1>
          <p className="text-slate-600">
            Kalorie: <strong>{plan.summary.dailyKcal} kcal</strong> | Koszt tygodniowy:{' '}
            <strong>{plan.summary.estimatedWeeklyCostPln} zł</strong>
          </p>
          <p className="text-sm text-slate-500">
            Białko: <strong>{plan.summary.proteinG} g</strong> | Węglowodany:{' '}
            <strong>{plan.summary.carbsG} g</strong> | Tłuszcze: <strong>{plan.summary.fatG} g</strong>
          </p>
          <div className="pt-2">
            <Button variant="ghost" onClick={() => { setPlan(null); setSurvey(null); }}>
              Zacznij od nowa
            </Button>
          </div>
        </div>

        {/* Widok 7-dniowego jadłospisu */}
        <MealPlanView days={plan.mealPlan} />

        {/* Widok planu treningowego */}
        <TrainingPlanView days={plan.trainingPlan} />

        {/* Widok listy zakupów */}
        <ShoppingListView
          shoppingList={plan.shoppingList}
          totalBudget={survey.weeklyBudgetPln}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4 pt-10">
      <h1 className="text-2xl font-bold tracking-tight">Ankieta gotowa ✔</h1>
      <p className="text-slate-600">
        Kliknij poniżej, aby wygenerować spersonalizowany plan na podstawie Twojej ankiety:
      </p>

      <PlanGenerator
        surveyData={survey}
        onPlanGenerated={(generatedPlan) => {
          setPlan(generatedPlan);
        }}
      />

      <Disclaimer />
      <Button variant="ghost" onClick={() => setSurvey(null)}>
        Wypełnij ankietę ponownie
      </Button>
    </main>
  )
}