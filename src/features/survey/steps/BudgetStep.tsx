import { Chip } from '@/components/ui/Chip'
import { BUDGET } from '../survey.options'
import { StepLayout } from './StepLayout'
import type { StepProps } from './types'

function describeBudget(weeklyPln: number): string {
  if (weeklyPln < 200) return 'Oszczędnie – postawimy na tanie, sezonowe produkty.'
  if (weeklyPln < 400) return 'Standardowo – dużo swobody w doborze składników.'
  return 'Komfortowo – możemy sięgać po droższe źródła białka.'
}

export function BudgetStep({ data, onChange }: StepProps) {
  const value = data.weeklyBudgetPln

  return (
    <StepLayout
      title="Ile wydajesz na jedzenie?"
      description="Podaj tygodniowy budżet na zakupy spożywcze – lista zakupów zmieści się w tej kwocie."
    >
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
        <p className="text-center">
          <span className="text-4xl font-bold tracking-tight text-slate-900">{value}</span>
          <span className="ml-1 text-lg font-medium text-slate-500">zł / tydzień</span>
        </p>
        <p className="mt-1 text-center text-sm text-slate-500">
          ≈ {Math.round(value / 7)} zł dziennie
        </p>

        <input
          type="range"
          aria-label="Tygodniowy budżet na jedzenie w złotych"
          min={BUDGET.min}
          max={BUDGET.max}
          step={BUDGET.step}
          value={value}
          onChange={(e) => onChange({ weeklyBudgetPln: Number(e.target.value) })}
          className="mt-5 h-8 w-full cursor-pointer accent-brand-600"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{BUDGET.min} zł</span>
          <span>{BUDGET.max} zł</span>
        </div>

        <p className="mt-4 text-sm text-slate-600">{describeBudget(value)}</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">Szybki wybór</legend>
        <div className="flex flex-wrap gap-2">
          {BUDGET.presets.map((preset) => (
            <Chip
              key={preset}
              type="radio"
              name="budget-preset"
              value={String(preset)}
              checked={value === preset}
              onChange={() => onChange({ weeklyBudgetPln: preset })}
            >
              {preset} zł
            </Chip>
          ))}
        </div>
      </fieldset>
    </StepLayout>
  )
}
