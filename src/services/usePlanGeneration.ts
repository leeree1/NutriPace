import { useCallback, useEffect, useRef, useState } from 'react'
import type { SurveyData } from '@/types'
import type { NutriPlan } from '@/types/plan'
import { generatePlan } from './planApi'

export type GenerationStatus = 'idle' | 'loading' | 'error'

/**
 * Stan generowania planu. Żądanie startuje z handlera (kliknięcie w ostatnim
 * kroku ankiety albo „Spróbuj ponownie"), a nie z efektu, więc StrictMode
 * w trybie dev nie wysyła go dwa razy (każde wywołanie kosztuje).
 */
export function usePlanGeneration() {
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (survey: SurveyData, onSuccess: (plan: NutriPlan) => void) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setStatus('loading')
      setError(null)

      const result = await generatePlan(survey, { signal: controller.signal })

      // Wynik anulowanego lub zastąpionego żądania jest ignorowany.
      if (controllerRef.current !== controller) return
      controllerRef.current = null

      if (result.ok) {
        setStatus('idle')
        onSuccess(result.plan)
      } else {
        setStatus('error')
        setError(result.message)
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus('idle')
    setError(null)
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return { status, error, generate, cancel }
}
