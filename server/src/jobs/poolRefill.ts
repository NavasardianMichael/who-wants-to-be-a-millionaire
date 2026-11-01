import { config, isGeminiConfigured } from '../config.js'
import { type Level } from '../lib/game.js'
import { allModelsCoolingDown } from '../lib/gemini.js'
import { isLocale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'
import { generateIntoPool } from '../services/questionPool.js'

/**
 * Keeps the busiest (locale, level) buckets stocked between games, so most games are
 * served straight from the pool with no Gemini latency.
 *
 * Demand-ordered on purpose: 50 locales × 5 levels × 16 categories is far beyond any free
 * quota, so the job only ever tops up buckets players have recently asked for, a few calls
 * per tick. A bucket counts as stocked once it holds `targetPerBucket` questions that have
 * been served fewer than twice. The ranked reserve has buckets of its own, demanded by
 * ranked runs.
 */
const RECENT_DEMAND_MS = 14 * 24 * 60 * 60 * 1000

/**
 * A bucket whose batch stored nothing (every question invalid or a duplicate) would be paid
 * for again on every tick, and stay first in line. It waits instead, twice as long after each
 * barren batch, until one stores something.
 */
const BARREN_BACKOFF_MS = 30 * 60 * 1000
const MAX_BARREN_BACKOFF_MS = 24 * 60 * 60 * 1000
const barren = new Map<string, { until: number; backoffMs: number }>()

let running = false

export const refillTick = async (): Promise<number> => {
  if (running || !isGeminiConfigured() || allModelsCoolingDown()) return 0
  running = true
  let calls = 0

  try {
    const buckets = await prisma.generationDemand.findMany({
      where: { lastRequestedAt: { gte: new Date(Date.now() - RECENT_DEMAND_MS) } },
      orderBy: [{ requests: 'desc' }, { lastRequestedAt: 'desc' }],
      take: 40,
    })

    for (const bucket of buckets) {
      if (calls >= config.poolRefill.maxCallsPerTick) break
      if (!isLocale(bucket.locale)) continue
      const key = `${bucket.locale}:${bucket.level}:${bucket.ranked}`
      if ((barren.get(key)?.until ?? 0) > Date.now()) continue

      const fresh = await prisma.question.count({
        where: { locale: bucket.locale, level: bucket.level, ranked: bucket.ranked, retiredAt: null, servedCount: { lt: 2 } },
      })
      if (fresh >= config.poolRefill.targetPerBucket) continue

      calls += 1
      try {
        const stored = await generateIntoPool(bucket.locale, bucket.level as Level, [], bucket.ranked)
        if (stored) {
          barren.delete(key)
        } else {
          const backoffMs = Math.min((barren.get(key)?.backoffMs ?? BARREN_BACKOFF_MS / 2) * 2, MAX_BARREN_BACKOFF_MS)
          barren.set(key, { until: Date.now() + backoffMs, backoffMs })
        }
      } catch (error) {
        // Quota or overload: stop for this tick; the cooldowns in lib/gemini.ts decide when to retry.
        console.warn('[refill] stopped:', (error as Error).message)
        break
      }
    }
  } finally {
    running = false
  }

  return calls
}

export const startPoolRefillJob = (): void => {
  if (!config.poolRefill.enabled) return
  const timer = setInterval(() => {
    refillTick().catch((error: unknown) => console.error('[refill]', error))
  }, config.poolRefill.intervalMs)
  // Never keep the process alive on its own.
  timer.unref()
}
