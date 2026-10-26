import { GOALS } from '@/types'
import { OptionCard } from '@/components/ui/OptionCard'
import { GOAL_OPTIONS } from '../survey.options'
import { StepLayout } from './StepLayout'
import type { StepProps } from './types'

export function GoalStep({ data, onChange }: StepProps) {
  return (
    <StepLayout
      title="Jaki jest Twój cel?"
      description="Na tej podstawie dobierzemy kalorie, makroskładniki i charakter treningów."
    >
      <fieldset className="space-y-3">
        <legend className="sr-only">Cel sylwetkowy</legend>
        {GOALS.map((goal) => {
          const { label, description, icon } = GOAL_OPTIONS[goal]
          return (
            <OptionCard
              key={goal}
              name="goal"
              value={goal}
              checked={data.goal === goal}
              onSelect={() => onChange({ goal })}
              icon={icon}
              title={label}
              description={description}
            />
          )
        })}
      </fieldset>
    </StepLayout>
  )
}
