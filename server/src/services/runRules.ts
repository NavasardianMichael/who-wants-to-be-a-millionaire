import {
  DEADLINE_GRACE_MS,
  type Level,
  levelForCorrectCount,
  type Lifeline,
  MARATHON_RULES,
  type RankedMode,
  TIME_ATTACK_RULES,
} from '../lib/game.js'

/**
 * The referee's rules for ranked runs — pure, so every timing edge has a unit test.
 * `services/runs.ts` applies them to the database row.
 */

export type RunClock = {
  mode: RankedMode
  /** Time Attack: the end of the whole run. */
  endsAt: Date | null
  /** Marathon: the end of the current question. */
  currentDeadline: Date | null
}

export const levelUpEvery = (mode: RankedMode): number =>
  mode === 'marathon' ? MARATHON_RULES.levelUpEvery : TIME_ATTACK_RULES.levelUpEvery

export const levelFor = (mode: RankedMode, correctCount: number): Level =>
  levelForCorrectCount(correctCount, levelUpEvery(mode))

export const allowedLifelines = (mode: RankedMode): readonly Lifeline[] =>
  mode === 'marathon' ? MARATHON_RULES.lifelines : TIME_ATTACK_RULES.lifelines

/** Whether an answer arriving `now` is still in time, with the latency grace applied. */
export const isInTime = (clock: RunClock, now: Date): boolean => {
  const limit = clock.mode === 'marathon' ? clock.currentDeadline : clock.endsAt
  return !limit || now.getTime() <= limit.getTime() + DEADLINE_GRACE_MS
}

export const questionDeadline = (mode: RankedMode, now: Date): Date | null =>
  mode === 'marathon' ? new Date(now.getTime() + MARATHON_RULES.questionSeconds * 1000) : null

export const initialEndsAt = (mode: RankedMode, now: Date): Date | null =>
  mode === 'timeAttack' ? new Date(now.getTime() + TIME_ATTACK_RULES.durationSeconds * 1000) : null

export type AnswerOutcome = {
  /** Whether the run is over after this answer. */
  finished: boolean
  /** Time Attack: the end after any wrong-answer penalty. */
  endsAt: Date | null
}

/**
 * Marathon ends on the first wrong answer. Time Attack carries on, five seconds poorer, and
 * ends only once the penalty eats the remaining time.
 */
export const applyAnswer = (clock: RunClock, correct: boolean, now: Date): AnswerOutcome => {
  if (clock.mode === 'marathon') return { finished: !correct, endsAt: null }

  const endsAt = clock.endsAt ?? now
  const nextEndsAt = correct ? endsAt : new Date(endsAt.getTime() - TIME_ATTACK_RULES.wrongPenaltySeconds * 1000)
  return { finished: nextEndsAt.getTime() <= now.getTime(), endsAt: nextEndsAt }
}

/** A thinking-time allowance for lifelines that take a while to play out (a phone call, a vote). */
export const LIFELINE_EXTRA_MS: Partial<Record<Lifeline, number>> = {
  phoneAFriend: 20_000,
  askAudience: 8_000,
}

/**
 * Switch the Question first asks which answer the player would have given to the discarded
 * question (for fun, never scored), then shows the new one. The new question's clock gets
 * this allowance so that beat does not eat into its thinking time.
 */
export const SWITCH_PREVIEW_MS = 15_000

/** Whether an abandoned active run is past saving — the sweeper finishes it as it stands. */
export const isStale = (clock: RunClock, now: Date): boolean => !isInTime(clock, now)
