import * as Sentry from '@sentry/nextjs'

/**
 * The one place a deliberate silence goes. Logged in development, sent to Sentry from the
 * browser (a no-op on the server, where Sentry never starts, and while it is off). `silent`
 * skips Sentry for expected failures such as being offline.
 */
export const reportError = (error: unknown, context: string, options: { silent?: boolean } = {}): void => {
  if (process.env.NODE_ENV !== 'production') console.warn(`[${context}]`, error)
  if (!options.silent) Sentry.captureException(error, { tags: { context } })
}
