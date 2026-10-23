/**
 * Lifeline maths — pure, seedable with `random`.
 *
 * **Twin file.** `src/helpers/game/lifelines.ts` (web: offline and unranked games) and
 * `server/src/lib/lifelines.ts` (API: ranked runs and phone-a-friend) must stay identical
 * below the marker line — `tests/unit/game/twins.spec.ts` fails on drift. The import sits
 * above the marker because the two packages resolve modules differently.
 */
import { AUDIENCE_KNOWLEDGE, type Level, OPTIONS_COUNT, PHONE_FRIEND_ACCURACY } from '@constants/game'

// --- twin: keep identical below this line ---

export type Random = () => number

const pickOne = <T>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)]!

/** Indexes still on the board after any earlier 50:50. */
export const remainingIndexes = (removed: readonly number[]): number[] =>
  Array.from({ length: OPTIONS_COUNT }, (_, index) => index).filter((index) => !removed.includes(index))

/**
 * 50:50 — the two wrong options to remove. One random wrong option survives beside the
 * correct one. Already-removed options are never chosen again.
 */
export const fiftyFifty = (correctIndex: number, removed: readonly number[], random: Random = Math.random): number[] => {
  const wrong = remainingIndexes(removed).filter((index) => index !== correctIndex)
  const keep = pickOne(wrong, random)
  return wrong.filter((index) => index !== keep)
}

/**
 * Ask the Audience — four whole percentages summing to 100, removed options at 0.
 *
 * A level-dependent share of the audience reliably knows the answer (with some noise per
 * question); everyone else spreads over the remaining options at random. On a hard
 * question that is exactly how a real audience misleads.
 */
export const audienceVotes = (
  correctIndex: number,
  removed: readonly number[],
  level: Level,
  random: Random = Math.random
): number[] => {
  const remaining = remainingIndexes(removed)
  const knowledge = Math.min(0.95, AUDIENCE_KNOWLEDGE[level] * (0.7 + 0.6 * random()))

  const weights = Array.from({ length: OPTIONS_COUNT }, () => 0)
  const guesses = remaining.map(() => 0.2 + random())
  const guessTotal = guesses.reduce((sum, weight) => sum + weight, 0)
  remaining.forEach((index, i) => {
    weights[index] = (1 - knowledge) * (guesses[i]! / guessTotal)
  })
  weights[correctIndex] = (weights[correctIndex] ?? 0) + knowledge

  // Largest-remainder rounding, so the bars always add up to exactly 100.
  const raw = weights.map((weight) => weight * 100)
  const floors = raw.map(Math.floor)
  let missing = 100 - floors.reduce((sum, value) => sum + value, 0)
  const byRemainder = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .filter(({ index }) => remaining.includes(index))
    .sort((a, b) => b.remainder - a.remainder)
  for (const { index } of byRemainder) {
    if (missing <= 0) break
    floors[index]! += 1
    missing -= 1
  }
  return floors
}

export type FriendConfidence = 'high' | 'medium' | 'low'

/**
 * Phone a Friend — which option the friend names and how sure they sound. Decided here, in
 * code, before any AI writes the words: the probability of being right must be a game rule,
 * not a model's mood. Confidence correlates with being right, but a wrong friend can still
 * sound sure — that is the drama of the lifeline.
 */
export const friendPick = (
  correctIndex: number,
  removed: readonly number[],
  level: Level,
  random: Random = Math.random
): { index: number; confidence: FriendConfidence; isCorrect: boolean } => {
  const isCorrect = random() < PHONE_FRIEND_ACCURACY[level]
  const wrong = remainingIndexes(removed).filter((index) => index !== correctIndex)
  const index = isCorrect || !wrong.length ? correctIndex : pickOne(wrong, random)

  const roll = random()
  const confidence: FriendConfidence = isCorrect
    ? roll < 0.6
      ? 'high'
      : roll < 0.9
        ? 'medium'
        : 'low'
    : roll < 0.2
      ? 'high'
      : roll < 0.6
        ? 'medium'
        : 'low'

  return { index, confidence, isCorrect: index === correctIndex }
}
