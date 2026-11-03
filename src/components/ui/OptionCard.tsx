import { Check, type LucideIcon } from 'lucide-react'

interface OptionCardProps {
  /** Wspólna nazwa grupy radio. */
  name: string
  value: string
  checked: boolean
  onSelect: () => void
  icon: LucideIcon
  title: string
  description?: string
}

/**
 * Duża, dotykowa karta pojedynczego wyboru. Pod spodem natywny <input type="radio">,
 * więc klawiatura i czytniki ekranu działają bez dodatkowego kodu.
 */
export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  icon: Icon,
  title,
  description,
}: OptionCardProps) {
  return (
    <label className="group relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 has-checked:border-brand-500 has-checked:bg-brand-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-has-checked:bg-brand-100 group-has-checked:text-brand-700">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{title}</span>
        {description && (
          <span className="mt-0.5 block text-sm text-slate-600">{description}</span>
        )}
      </span>
      <Check
        className="size-5 shrink-0 text-brand-600 opacity-0 transition-opacity group-has-checked:opacity-100"
        aria-hidden
      />
    </label>
  )
}
