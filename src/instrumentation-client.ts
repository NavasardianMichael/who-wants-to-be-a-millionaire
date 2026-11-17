import * as Sentry from '@sentry/nextjs'
import { SENTRY_DSN, SENTRY_ENABLED, SENTRY_ENVIRONMENT, SENTRY_TRACES_SAMPLE_RATE } from '@constants/sentry'
import { reportError } from '@helpers/reportError'
import { filterSentryEvent } from '@helpers/sentryFilter'

/**
 * Session Replay is added once the page is idle, fetched from Sentry's CDN: in the startup
 * bundle it cost every visit its code and a full DOM snapshot before the first paint. An error
 * in the first moments after load therefore has no replay. A failed fetch (often an ad blocker)
 * only means no replays, so it is not sent to Sentry (which would be blocked the same way).
 */
const addReplayWhenIdle = () => {
  const add = () =>
    Sentry.lazyLoadIntegration('replayIntegration')
      .then((replayIntegration) => Sentry.addIntegration(replayIntegration()))
      .catch((error: unknown) => reportError(error, 'sentry-replay', { silent: true }))
  const whenIdle = () => ('requestIdleCallback' in window ? window.requestIdleCallback(add, { timeout: 5000 }) : setTimeout(add, 2000))
  if (document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { once: true })
}

// Runs in the browser before the app becomes interactive.
if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    // Replays only for sessions that hit an error (text and inputs masked by default).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: filterSentryEvent,
  })
  addReplayWhenIdle()
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
