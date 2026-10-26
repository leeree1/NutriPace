import { HOME_EQUIPMENT, TRAINING_PLACES } from '@/types'
import { Chip } from '@/components/ui/Chip'
import { OptionCard } from '@/components/ui/OptionCard'
import { toggleItem } from '@/lib/toggleItem'
import {
  HOME_EQUIPMENT_LABELS,
  TRAINING_DAYS_OPTIONS,
  TRAINING_PLACE_OPTIONS,
} from '../survey.options'
import { StepLayout } from './StepLayout'
import type { StepProps } from './types'

export function EquipmentStep({ data, onChange }: StepProps) {
  return (
    <StepLayout
      title="Gdzie trenujesz?"
      description="Dobierzemy ćwiczenia do sprzętu, który faktycznie masz pod ręką."
    >
      <fieldset className="space-y-3">
        <legend className="sr-only">Miejsce treningu</legend>
        {TRAINING_PLACES.map((place) => {
          const { label, description, icon } = TRAINING_PLACE_OPTIONS[place]
          return (
            <OptionCard
              key={place}
              name="training-place"
              value={place}
              checked={data.trainingPlace === place}
              onSelect={() =>
                // Zmiana miejsca czyści sprzęt domowy, żeby nie zostały "duchy" w danych.
                onChange({ trainingPlace: place, homeEquipment: [] })
              }
              icon={icon}
              title={label}
              description={description}
            />
          )
        })}
      </fieldset>

      {data.trainingPlace === 'home' && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">
            Co masz w domu? <span className="font-normal text-slate-500">(opcjonalnie)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {HOME_EQUIPMENT.map((item) => (
              <Chip
                key={item}
                type="checkbox"
                name="home-equipment"
                value={item}
                checked={data.homeEquipment.includes(item)}
                onChange={() =>
                  onChange({ homeEquipment: toggleItem(data.homeEquipment, item) })
                }
              >
                {HOME_EQUIPMENT_LABELS[item]}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Nic nie zaznaczone = plan oparty na ćwiczeniach z masą własnego ciała.
          </p>
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">
          Ile dni w tygodniu chcesz trenować?
        </legend>
        <div className="flex flex-wrap gap-2">
          {TRAINING_DAYS_OPTIONS.map((days) => (
            <Chip
              key={days}
              type="radio"
              name="training-days"
              value={String(days)}
              checked={data.trainingDaysPerWeek === days}
              onChange={() => onChange({ trainingDaysPerWeek: days })}
            >
              {days} dni
            </Chip>
          ))}
        </div>
      </fieldset>
    </StepLayout>
  )
}
