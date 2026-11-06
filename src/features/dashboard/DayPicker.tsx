import { cn } from '@/lib/cn'

interface DayPickerProps {
  /** Nazwy dni (np. „Poniedziałek") – czytane przez czytnik ekranu. */
  dayNames: string[]
  selected: number
  onSelect: (index: number) => void
}

/** Wybór dnia 1–7. Siatka dzieli szerokość równo, więc na 360 px nie ma poziomego przewijania. */
export function DayPicker({ dayNames, selected, onSelect }: DayPickerProps) {
  return (
    <div
      role="group"
      aria-label="Wybór dnia"
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${dayNames.length}, minmax(0, 1fr))` }}
    >
      {dayNames.map((name, index) => {
        const isSelected = index === selected
        return (
          <button
            key={`${index}-${name}`}
            type="button"
            aria-label={name || `Dzień ${index + 1}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(index)}
            className={cn(
              'min-h-11 rounded-lg text-sm font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              isSelected
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100',
            )}
          >
            {index + 1}
          </button>
        )
      })}
    </div>
  )
}
