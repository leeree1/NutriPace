import { useState, type KeyboardEvent } from 'react'
import { Disclaimer } from '@/components/Disclaimer'
import { MealPlanView } from '@/components/MealPlanView'
import { ShoppingListView } from '@/components/ShoppingListView'
import { TrainingPlanView } from '@/components/TrainingPlanView'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { NutriPlan } from '@/types/plan'
import { DayPicker } from './DayPicker'

type TabId = 'meals' | 'training' | 'shopping'

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'meals', label: 'Jadłospis' },
  { id: 'training', label: 'Trening' },
  { id: 'shopping', label: 'Zakupy' },
]

interface DashboardProps {
  plan: NutriPlan
  planId: string
  weeklyBudgetPln: number
  onReset: () => void
}

/** Widok planu: zakładki Jadłospis / Trening / Zakupy oraz wybór dnia 1–7. */
export function Dashboard({ plan, planId, weeklyBudgetPln, onReset }: DashboardProps) {
  const [tab, setTab] = useState<TabId>('meals')
  const [dayIndex, setDayIndex] = useState(0)

  const dayCount = Math.max(plan.mealPlan.length, plan.trainingPlan.length)
  const selectedDay = Math.min(dayIndex, Math.max(dayCount - 1, 0))
  const dayNames = Array.from(
    { length: dayCount },
    (_, i) => plan.mealPlan[i]?.day ?? plan.trainingPlan[i]?.day ?? `Dzień ${i + 1}`,
  )

  const hasTrainingDays = plan.trainingPlan.some(
    (day) => !day.isRestDay && day.exercises.length > 0,
  )

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    let next: number | null = null
    if (event.key in offsets) next = (index + offsets[event.key] + TABS.length) % TABS.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = TABS.length - 1
    if (next === null) return

    event.preventDefault()
    setTab(TABS[next].id)
    document.getElementById(`tab-${TABS[next].id}`)?.focus()
  }

  const showDayPicker = tab !== 'shopping' && dayCount > 0

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4 pt-8 pb-16">
      <header className="space-y-2 rounded-xl bg-white p-5 text-center shadow-md">
        <h1 className="text-2xl font-bold tracking-tight text-brand-600">Twój plan jest gotowy! 🎉</h1>
        <p className="text-slate-600">
          Kalorie: <strong>{plan.summary.dailyKcal} kcal</strong> | Koszt tygodniowy:{' '}
          <strong>{plan.summary.estimatedWeeklyCostPln} zł</strong>
        </p>
        <p className="text-sm text-slate-500">
          Białko: <strong>{plan.summary.proteinG} g</strong> | Węglowodany:{' '}
          <strong>{plan.summary.carbsG} g</strong> | Tłuszcze: <strong>{plan.summary.fatG} g</strong>
        </p>
        <Button variant="ghost" onClick={onReset}>
          Zacznij od nowa
        </Button>
      </header>

      <div
        role="tablist"
        aria-label="Widok planu"
        className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200 p-1"
      >
        {TABS.map((item, index) => {
          const isActive = item.id === tab
          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="plan-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                'min-h-11 rounded-lg px-2 text-sm font-semibold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {showDayPicker && (
        <DayPicker dayNames={dayNames} selected={selectedDay} onSelect={setDayIndex} />
      )}

      <div id="plan-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-4">
        {tab === 'meals' && (
          <MealPlanView day={plan.mealPlan[selectedDay]} dayNumber={selectedDay + 1} />
        )}

        {tab === 'training' &&
          (hasTrainingDays ? (
            <TrainingPlanView day={plan.trainingPlan[selectedDay]} dayNumber={selectedDay + 1} />
          ) : (
            <div role="status" className="rounded-xl bg-white p-6 text-center shadow-md">
              <p className="font-semibold text-slate-700">W tym planie nie ma dni treningowych.</p>
              <p className="mt-1 text-sm text-slate-500">
                Wypełnij ankietę ponownie i wybierz co najmniej jeden dzień treningowy w tygodniu.
              </p>
            </div>
          ))}

        {tab === 'shopping' && (
          <ShoppingListView
            shoppingList={plan.shoppingList}
            totalBudget={weeklyBudgetPln}
            planId={planId}
          />
        )}
      </div>

      <Disclaimer />
    </main>
  )
}
