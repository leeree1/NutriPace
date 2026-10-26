interface StepIndicatorProps {
  steps: ReadonlyArray<{ id: string; label: string }>
  currentIndex: number
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  const total = steps.length
  const progress = ((currentIndex + 1) / total) * 100

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-brand-700">
          Krok {currentIndex + 1} z {total}
        </span>
        <span className="text-slate-500">{steps[currentIndex].label}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Postęp ankiety"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={currentIndex + 1}
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
