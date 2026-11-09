import { createRateLimiter } from './rateLimit.js'
import { config } from '../config.js'

/**
 * How many AI batches player requests may start: a ceiling per player and one for the whole
 * server, so the bill has a known maximum whatever arrives. A request that excludes every
 * question in a bucket would otherwise buy a fresh batch each time it is sent.
 *
 * The background refill is not counted here; it has its own per-tick cap.
 */
export type GenerationBudget = (player: string) => boolean

export const createGenerationBudget = ({ perHour, perPlayerPerHour }: { perHour: number; perPlayerPerHour: number }): GenerationBudget => {
  const hour = 60 * 60 * 1000
  const perPlayer = createRateLimiter({ limit: perPlayerPerHour, windowMs: hour })
  const overall = createRateLimiter({ limit: perHour, windowMs: hour })

  // The player's own limit first: one turned away there never draws on the shared budget.
  return (player) => perPlayer(player).allowed && overall('all').allowed
}

export const liveGenerationAllowed: GenerationBudget = createGenerationBudget(config.liveGeneration)
