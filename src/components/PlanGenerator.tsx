import { Button } from '@/components/ui/Button'
import type { GenerationStatus } from '@/services/usePlanGeneration'

interface PlanGeneratorProps {
  status: GenerationStatus
  errorMessage: string | null
  onGenerate: () => void
  onCancel: () => void
}

/** Ekran generowania planu: ładowanie z możliwością anulowania, błąd z ponowieniem albo start. */
export default function PlanGenerator({
  status,
  errorMessage,
  onGenerate,
  onCancel,
}: PlanGeneratorProps) {
  if (status === 'loading') {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center space-y-4 p-8">
        <div
          className="size-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"
          aria-hidden
        />
        <p className="animate-pulse text-center font-medium text-slate-700">
          Generujemy Twój spersonalizowany plan... To może potrwać kilkanaście sekund.
        </p>
        <Button variant="ghost" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="font-medium text-red-600">{errorMessage}</p>
        <Button onClick={onGenerate}>Spróbuj ponownie</Button>
      </div>
    )
  }

  return (
    <Button className="w-full" onClick={onGenerate}>
      Generuj plan
    </Button>
  )
}
