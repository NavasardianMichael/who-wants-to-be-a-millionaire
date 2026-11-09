import { config } from '../config.js'
import { graduateRankedQuestions } from '../services/questionPool.js'

/**
 * Hands well-used ranked questions on to Classic, so each one is written once and played
 * in both. Hourly rather than daily: deploys restart the process, and a daily timer could
 * be reset before it ever fired. The query is one indexed pass over the reserve.
 */
const GRADUATION_INTERVAL_MS = 60 * 60 * 1000

export const startRankedGraduation = (): void => {
  const timer = setInterval(() => {
    graduateRankedQuestions(config.rankedGraduation)
      .then((moved) => {
        if (moved) console.log(`[graduation] ${moved} ranked questions moved to Classic`)
      })
      .catch((error: unknown) => console.error('[graduation]', error))
  }, GRADUATION_INTERVAL_MS)
  timer.unref()
}
