import type { ErrorEvent } from '@sentry/nextjs'

/** The browsers' wording for a refused `play()`: Firefox, then Chromium. */
const AUTOPLAY_REFUSAL = /play method is not allowed|play\(\) failed/i

/** Errors no code caught, reported by Sentry's `window.onerror` / `onunhandledrejection` hooks. */
const isUncaught = (mechanism: string | undefined): boolean => /onerror$|onunhandledrejection$/.test(mechanism ?? '')

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

/**
 * An uncaught error thrown entirely by a script that is not ours: every frame is a `.js` file
 * outside `/_next/`, the only place the app's scripts are served from. Sentry rewrites every
 * http(s) origin to `app://`, so a script a browser extension or the browser itself injected
 * (Opera's `app:///executors/200.js`, "reading 'M_ID'") looks in-app without this. An inline
 * script of our page has the page URL, not a `.js` name, and is kept.
 */
export const isUncaughtForeignScriptError = (event: ErrorEvent): boolean => {
  const values = event.exception?.values
  if (values?.length !== 1) return false
  const [exception] = values
  const frames = exception.stacktrace?.frames ?? []
  return (
    isUncaught(exception.mechanism?.type) &&
    frames.length > 0 &&
    frames.every(({ filename = '' }) => /\.js$/.test(filename) && !filename.includes('/_next/'))
  )
}

/** Sentry's `beforeSend`: drops noise the app cannot act on, keeps everything else as is. */
export const filterSentryEvent = (event: ErrorEvent): ErrorEvent | null =>
  isUncaughtAutoplayRefusal(event) || isUncaughtForeignScriptError(event) ? null : event
