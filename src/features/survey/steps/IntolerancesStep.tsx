import { INTOLERANCES } from '@/types'
import { Chip } from '@/components/ui/Chip'
import { toggleItem } from '@/lib/toggleItem'
import { INTOLERANCE_LABELS } from '../survey.options'
import { StepLayout } from './StepLayout'
import type { StepProps } from './types'

export function IntolerancesStep({ data, onChange }: StepProps) {
  return (
    <StepLayout
      title="Czego unikasz w jedzeniu?"
      description="Wykluczymy te składniki z jadłospisu i listy zakupów. Jeśli nie masz ograniczeń, po prostu przejdź dalej."
    >
      <fieldset className="space-y-3">
        <legend className="sr-only">Nietolerancje i alergie pokarmowe</legend>
        <div className="flex flex-wrap gap-2">
          {INTOLERANCES.map((item) => (
            <Chip
              key={item}
              type="checkbox"
              name="intolerances"
              value={item}
              checked={data.intolerances.includes(item)}
              onChange={() => onChange({ intolerances: toggleItem(data.intolerances, item) })}
            >
              {INTOLERANCE_LABELS[item]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="other-intolerances" className="text-sm font-semibold text-slate-900">
          Coś jeszcze? <span className="font-normal text-slate-500">(opcjonalnie)</span>
        </label>
        <input
          id="other-intolerances"
          type="text"
          maxLength={120}
          placeholder="np. seler, kiwi, ostre przyprawy"
          value={data.otherIntolerances}
          onChange={(e) => onChange({ otherIntolerances: e.target.value })}
          className="min-h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
        />
      </div>
    </StepLayout>
  )
}
