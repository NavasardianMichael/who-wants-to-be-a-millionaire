import axios from 'axios'

/**
 * Turns any thrown value into a *kind* the UI has translated copy for (`Errors.<kind>`),
 * plus the original message for the development-only details block. Production never
 * renders a server message: those are English and written for developers.
 */
export type ErrorKind = 'network' | 'rateLimited' | 'unauthorized' | 'notFound' | 'server' | 'generic'

/**
 * `code` is the envelope's `error.code`: a stable number some failures carry so a form can
 * explain them in its own words (`AUTH_ERROR_CODE`). Never its message.
 */
export type ClassifiedError = { kind: ErrorKind; status: number | null; code: number | null; details: string }

export const classifyError = (error: unknown): ClassifiedError => {
  const details = error instanceof Error ? error.message : String(error)

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null
    const envelopeCode = (error.response?.data as { error?: { code?: unknown } } | undefined)?.error?.code
    const code = typeof envelopeCode === 'number' ? envelopeCode : null
    if (!error.response) return { kind: 'network', status, code, details }
    if (status === 429) return { kind: 'rateLimited', status, code, details }
    if (status === 401) return { kind: 'unauthorized', status, code, details }
    if (status === 404) return { kind: 'notFound', status, code, details }
    if (status && status >= 500) return { kind: 'server', status, code, details }
    return { kind: 'generic', status, code, details }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) return { kind: 'network', status: null, code: null, details }
  return { kind: 'generic', status: null, code: null, details }
}

export const IS_DEV = process.env.NODE_ENV !== 'production'
