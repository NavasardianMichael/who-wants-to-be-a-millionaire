import { describe, expect, it } from 'vitest'
import { type Level, LEVELS, PHONE_FRIEND_ACCURACY } from '@constants/game'
import { audienceVotes, fiftyFifty, friendPick, remainingIndexes } from '@helpers/game/lifelines'

/** A small deterministic PRNG, so statistical tests are reproducible. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

describe('50:50', () => {
  it('removes exactly two wrong options and never the answer', () => {
    const random = seeded(7)
    for (let correct = 0; correct < 4; correct++) {
      for (let run = 0; run < 50; run++) {
        const removed = fiftyFifty(correct, [], random)
        expect(removed).toHaveLength(2)
        expect(removed).not.toContain(correct)
        expect(new Set(removed).size).toBe(2)
      }
    }
  })

  it('leaves the answer and exactly one wrong option on the board', () => {
    const removed = fiftyFifty(2, [], seeded(3))
    const left = remainingIndexes(removed)
    expect(left).toHaveLength(2)
    expect(left).toContain(2)
  })
})

describe('ask the audience', () => {
  it('always sums to 100 with removed options at 0', () => {
    const random = seeded(11)
    for (const level of LEVELS) {
      for (let run = 0; run < 100; run++) {
        const removed = run % 2 ? [0, 3] : []
        const correct = run % 2 ? 1 : run % 4
        const votes = audienceVotes(correct, removed, level, random)
        expect(votes.reduce((sum, vote) => sum + vote, 0)).toBe(100)
        for (const index of removed) expect(votes[index]).toBe(0)
        votes.forEach((vote) => expect(vote).toBeGreaterThanOrEqual(0))
      }
    }
  })

  it('favours the right answer more on easy questions than on hard ones', () => {
    const share = (level: Level) => {
      const random = seeded(level * 101)
      let total = 0
      for (let run = 0; run < 400; run++) total += audienceVotes(0, [], level, random)[0]!
      return total / 400
    }
    expect(share(1)).toBeGreaterThan(share(5) + 20)
  })
})

describe('phone a friend', () => {
  it('is right about as often as the level table says', () => {
    for (const level of LEVELS) {
      const random = seeded(level)
      let right = 0
      const runs = 2000
      for (let run = 0; run < runs; run++) if (friendPick(1, [], level, random).isCorrect) right++
      expect(right / runs).toBeGreaterThan(PHONE_FRIEND_ACCURACY[level] - 0.05)
      expect(right / runs).toBeLessThan(PHONE_FRIEND_ACCURACY[level] + 0.05)
    }
  })

  it('never suggests an option 50:50 removed', () => {
    const random = seeded(5)
    for (let run = 0; run < 300; run++) {
      const { index } = friendPick(0, [1, 2], 5, random)
      expect([0, 3]).toContain(index)
    }
  })
})
