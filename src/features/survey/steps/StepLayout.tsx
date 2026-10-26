import { useEffect, useRef, type ReactNode } from 'react'

interface StepLayoutProps {
  title: string
  description: string
  children: ReactNode
}

/** Wspólny szablon kroku: nagłówek + opis + treść. */
export function StepLayout({ title, description, children }: StepLayoutProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Po zmianie kroku fokus trafia na nagłówek – czytnik ekranu od razu ogłasza nowy krok.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section aria-label={title} className="space-y-6">
      <header className="space-y-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight text-slate-900 focus:outline-none sm:text-3xl"
        >
          {title}
        </h2>
        <p className="text-slate-600">{description}</p>
      </header>
      {children}
    </section>
  )
}
