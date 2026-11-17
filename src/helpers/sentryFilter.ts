import type { ErrorEvent } from '@sentry/nextjs'

/** The browsers' wording for a refused `play()`: Firefox, then Chromium. */
const AUTOPLAY_REFUSAL = /play method is not allowed|play\(\) failed/i

/**
 * A media `play()` the browser refused (autoplay rules) that nobody caught. Ours never reach
 * here: every `play()` in `audioManager` handles its refusal. What does is third-party media —
 * an Auto ads video creative on a content page — which the app can neither catch nor fix.
 */
export const isUncaughtAutoplayRefusal = (event: ErrorEvent): boolean => {
  const values = event.exception?.values
  if (values?.length !== 1) return false
  const [exception] = values
  return (
    exception.type === 'NotAllowedError' &&
    AUTOPLAY_REFUSAL.test(exception.value ?? '') &&
    (exception.mechanism?.type ?? '').endsWith('onunhandledrejection')
  )
}

/** Sentry's `beforeSend`: drops noise the app cannot act on, keeps everything else as is. */
export const filterSentryEvent = (event: ErrorEvent): ErrorEvent | null => (isUncaughtAutoplayRefusal(event) ? null : event)
