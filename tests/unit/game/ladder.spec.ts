import { describe, expect, it } from 'vitest'
import { LADDER, STAGES_COUNT } from '@constants/game'
import { guaranteedAmount, isSafeHaven, playingFor, prizeForStage, walkAwayAmount } from '@helpers/game/ladder'

describe('money ladder', () => {
  it('has 15 rising rungs ending at a million', () => {
    expect(STAGES_COUNT).toBe(15)
    expect(LADDER.at(-1)).toBe(1_000_000)
    for (let i = 1; i < LADDER.length; i++) expect(LADDER[i]).toBeGreaterThan(LADDER[i - 1]!)
  })

  it('marks questions 5 and 10 as safe havens', () => {
    expect([1, 4, 5, 6, 10, 15].map(isSafeHaven)).toEqual([false, false, true, false, true, false])
  })

  it('guarantees the last safe haven passed', () => {
    expect(guaranteedAmount(0)).toBe(0)
    expect(guaranteedAmount(4)).toBe(0)
    expect(guaranteedAmount(5)).toBe(prizeForStage(5))
    expect(guaranteedAmount(9)).toBe(prizeForStage(5))
    expect(guaranteedAmount(10)).toBe(prizeForStage(10))
    expect(guaranteedAmount(14)).toBe(prizeForStage(10))
  })

  it('lets a player walk away with everything banked', () => {
    expect(walkAwayAmount(0)).toBe(0)
    expect(walkAwayAmount(7)).toBe(prizeForStage(7))
    expect(walkAwayAmount(14)).toBe(500_000)
  })

  it('plays for the next rung', () => {
    expect(playingFor(0)).toBe(100)
    expect(playingFor(14)).toBe(1_000_000)
  })
})
