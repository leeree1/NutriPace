import { Info } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DisclaimerProps {
  className?: string
}

/** Informacja prawna: plan jest orientacyjny i nie zastępuje porady specjalisty. */
export function Disclaimer({ className }: DisclaimerProps) {
  return (
    <aside
      role="note"
      className={cn(
        'flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900',
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        NutriPace AI tworzy plany o charakterze informacyjnym i nie zastępuje porady lekarza
        ani dietetyka. Przed zmianą diety lub rozpoczęciem treningów skonsultuj się ze
        specjalistą, zwłaszcza przy chorobach, alergiach, ciąży lub przyjmowaniu leków.
      </p>
    </aside>
  )
}
