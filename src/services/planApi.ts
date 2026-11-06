import { z } from 'zod'
import { AiPlanSchema, ShoppingCategorySchema } from '@/types/plan'
import type { NutriPlan } from '@/types/plan'
import type { SurveyData } from '@/types'
import { MOCK_PLAN } from './mockPlan'

/** Pełny plan zwracany przez /api/generate-plan (plan od AI + lista zakupów z serwera). */
export const NutriPlanSchema = AiPlanSchema.extend({
  shoppingList: z.array(ShoppingCategorySchema),
})

/** Funkcja serverless może działać do 60 s (maxDuration), więc dajemy jej chwilę zapasu. */
const REQUEST_TIMEOUT_MS = 65_000
const MOCK_DELAY_MS = 1_200

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export type PlanErrorReason = 'aborted' | 'timeout' | 'network' | 'server' | 'invalid'

export type PlanResult =
  | { ok: true; plan: NutriPlan }
  | { ok: false; reason: PlanErrorReason; message: string }

const fail = (reason: PlanErrorReason, message: string): PlanResult => ({
  ok: false,
  reason,
  message,
})

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

interface GeneratePlanOptions {
  /** Pozwala anulować żądanie (przycisk „Anuluj"). */
  signal?: AbortSignal
}

/**
 * Jedyne miejsce, które zna endpoint generowania planu. Zawsze zwraca wynik
 * (nigdy nie rzuca), a komunikaty są gotowe do pokazania użytkownikowi.
 */
export async function generatePlan(
  survey: SurveyData,
  { signal }: GeneratePlanOptions = {},
): Promise<PlanResult> {
  // Własny kontroler łączy anulowanie przez użytkownika z limitem czasu.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', onExternalAbort, { once: true })

  try {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS, controller.signal)
      return { ok: true, plan: MOCK_PLAN }
    }

    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
      signal: controller.signal,
    })

    // Bez backendu (np. samo `npm run dev`) /api zwraca 404 z HTML-em, nie z JSON-em.
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return fail(
        'server',
        import.meta.env.DEV
          ? 'Brak backendu pod /api. Uruchom aplikację przez „vercel dev" albo ustaw VITE_USE_MOCK=true w pliku .env.'
          : 'Usługa generowania planu jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
      )
    }

    const body: unknown = await response.json()
    const success =
      typeof body === 'object' && body !== null && (body as { success?: unknown }).success === true

    if (!response.ok || !success) {
      return fail(
        'server',
        response.status === 400
          ? 'Dane z ankiety są niepełne. Wypełnij ankietę ponownie.'
          : 'Nie udało się wygenerować planu. Spróbuj ponownie za chwilę.',
      )
    }

    const parsed = NutriPlanSchema.safeParse((body as { data?: unknown }).data)
    if (!parsed.success) {
      return fail('invalid', 'Otrzymany plan ma nieprawidłowy format. Spróbuj wygenerować go ponownie.')
    }

    return { ok: true, plan: parsed.data }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return timedOut
        ? fail('timeout', 'Generowanie trwa zbyt długo. Spróbuj ponownie.')
        : fail('aborted', 'Anulowano generowanie planu.')
    }
    return fail('network', 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}
