import { sweepStaleRuns } from '../services/runs.js'

/**
 * Finishes ranked runs whose clock ran out with nobody answering — a closed tab, a lost
 * connection — so they reach the leaderboard at the score they had. Without it an
 * abandoned run would stay `active` forever and never count.
 */
const SWEEP_INTERVAL_MS = 60_000

export const startRunSweeper = (): void => {
  const timer = setInterval(() => {
    sweepStaleRuns().catch((error: unknown) => console.error('[sweeper]', error))
  }, SWEEP_INTERVAL_MS)
  timer.unref()
}
