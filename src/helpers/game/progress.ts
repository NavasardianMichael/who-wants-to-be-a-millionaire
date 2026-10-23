import type { EarnedBadge } from '@interfaces/entities'
import { STORAGE_KEYS } from '@constants/app'
import { type BadgeId, type Category, type GameMode, type Lifeline } from '@constants/game'
import { readJson, writeJson } from '@helpers/storage'

/**
 * Device-side progress: the stats badges are judged on, and the badges themselves. Kept
 * locally so guests and offline players earn them too; a signed-in device merges them into
 * the account (`POST /badges/sync`).
 */
export type LocalStats = {
  localesPlayed: string[]
  /** `YYYY-MM-DD`, most recent last, the last 30 days with a game. */
  playDays: string[]
  /** Correct answers given in under three seconds. */
  quickAnswers: number
  categoryCorrect: Partial<Record<Category, number>>
  offlineGames: number
  gamesPlayed: number
}

const EMPTY_STATS: LocalStats = {
  localesPlayed: [],
  playDays: [],
  quickAnswers: 0,
  categoryCorrect: {},
  offlineGames: 0,
  gamesPlayed: 0,
}

export const readStats = (): LocalStats => ({ ...EMPTY_STATS, ...readJson<Partial<LocalStats>>(STORAGE_KEYS.stats, {}) })

export const readLocalBadges = (): EarnedBadge[] => readJson<EarnedBadge[]>(STORAGE_KEYS.badges, [])

export const writeLocalBadges = (badges: EarnedBadge[]): void => writeJson(STORAGE_KEYS.badges, badges)

/** What a finished game contributes to the stats and the badge rules. */
export type GameSummary = {
  mode: GameMode
  locale: string
  /** Correct answers in this game. */
  correctCount: number
  outcome: 'won' | 'walked' | 'lost' | 'timeout' | 'ended'
  lifelinesUsed: Lifeline[]
  quickAnswers: number
  categoryCorrect: Partial<Record<Category, number>>
  offline: boolean
  /** Phoned a friend, followed a correct suggestion, and got it right. */
  savedByFriend: boolean
}

const QUICK_THINKER_ANSWERS = 10
const CATEGORY_MASTER_ANSWERS = 25

const today = (): string => new Date().toISOString().slice(0, 10)

/** Consecutive days ending today (or yesterday — a streak is not broken before the day ends). */
export const currentStreak = (days: readonly string[], now: Date = new Date()): number => {
  const set = new Set(days)
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1)
  let streak = 0
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

/** Pure: which badges this game plus the running stats qualify for. */
export const qualifyingBadges = (summary: GameSummary, stats: LocalStats): BadgeId[] => {
  const badges: BadgeId[] = []
  const classic = summary.mode === 'classic'

  if (summary.correctCount >= 1) badges.push('firstSteps')
  if (classic && summary.correctCount >= 5) badges.push('safeHaven')
  if (classic && summary.correctCount >= 10) badges.push('halfWay')
  if (classic && summary.outcome === 'won') badges.push('millionaire')
  if (classic && summary.outcome === 'won' && summary.lifelinesUsed.length === 0) badges.push('purist')
  if (classic && summary.outcome === 'walked' && summary.correctCount >= 12) badges.push('smartExit')
  if (stats.quickAnswers >= QUICK_THINKER_ANSWERS) badges.push('quickThinker')
  if (stats.localesPlayed.length >= 3) badges.push('polyglot3')
  if (stats.localesPlayed.length >= 10) badges.push('polyglot10')
  const streak = currentStreak(stats.playDays)
  if (streak >= 3) badges.push('streak3')
  if (streak >= 7) badges.push('streak7')
  if (summary.offline) badges.push('offlineHero')
  if (summary.savedByFriend) badges.push('savedByAFriend')
  if (Object.values(stats.categoryCorrect).some((count) => (count ?? 0) >= CATEGORY_MASTER_ANSWERS)) {
    badges.push('categoryMaster')
  }
  return badges
}

/**
 * Folds a finished game into the stats, awards any new badges locally, and returns the new
 * ones so the result screen can celebrate them.
 */
export const recordGame = (summary: GameSummary): BadgeId[] => {
  const previous = readStats()
  const categoryCorrect = { ...previous.categoryCorrect }
  for (const [category, count] of Object.entries(summary.categoryCorrect) as [Category, number][]) {
    categoryCorrect[category] = (categoryCorrect[category] ?? 0) + count
  }

  const stats: LocalStats = {
    localesPlayed: Array.from(new Set([...previous.localesPlayed, summary.locale])),
    playDays: Array.from(new Set([...previous.playDays, today()])).slice(-30),
    quickAnswers: previous.quickAnswers + summary.quickAnswers,
    categoryCorrect,
    offlineGames: previous.offlineGames + (summary.offline ? 1 : 0),
    gamesPlayed: previous.gamesPlayed + 1,
  }
  writeJson(STORAGE_KEYS.stats, stats)

  return mergeLocalBadges(qualifyingBadges(summary, stats))
}

/** Adds badges to the device's collection; returns the ones that were not there yet. */
export const mergeLocalBadges = (badgeIds: readonly BadgeId[]): BadgeId[] => {
  const owned = readLocalBadges()
  const ownedIds = new Set(owned.map(({ badgeId }) => badgeId))
  const fresh = badgeIds.filter((badgeId) => !ownedIds.has(badgeId))
  if (fresh.length) {
    const earnedAt = new Date().toISOString()
    writeLocalBadges([...owned, ...fresh.map((badgeId) => ({ badgeId, earnedAt }))])
  }
  return fresh
}
