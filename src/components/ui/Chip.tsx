import type { ReactNode } from 'react'

interface ChipProps {
  /** `checkbox` = multi-select, `radio` = single-select w ramach grupy `name`. */
  type: 'checkbox' | 'radio'
  name: string
  value: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}

/** Mały, zaokrąglony przełącznik (tag) – natywny input pod spodem. */
export function Chip({ type, name, value, checked, onChange, children }: ChipProps) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer select-none items-center rounded-full border-2 border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-700 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  )
}
