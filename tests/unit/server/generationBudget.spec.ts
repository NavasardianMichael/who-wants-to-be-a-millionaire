import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGenerationBudget } from '../../../server/src/lib/generationBudget'

describe('live generation budget', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stops one player at their own hourly limit', () => {
    const allowed = createGenerationBudget({ perHour: 100, perPlayerPerHour: 3 })
    expect([1, 2, 3, 4].map(() => allowed('ip:1'))).toEqual([true, true, true, false])
    expect(allowed('ip:2')).toBe(true)
  })

  it('stops everyone once the server-wide limit is spent', () => {
    const allowed = createGenerationBudget({ perHour: 2, perPlayerPerHour: 10 })
    expect([allowed('ip:1'), allowed('ip:2'), allowed('ip:3')]).toEqual([true, true, false])
  })

  it('never lets a player past their own limit draw on the shared budget', () => {
    const allowed = createGenerationBudget({ perHour: 3, perPlayerPerHour: 1 })
    allowed('ip:attacker')
    for (let attempt = 0; attempt < 50; attempt++) allowed('ip:attacker')
    expect([allowed('ip:a'), allowed('ip:b')]).toEqual([true, true])
  })

  it('opens again after an hour', () => {
    const allowed = createGenerationBudget({ perHour: 1, perPlayerPerHour: 1 })
    expect(allowed('user:1')).toBe(true)
    expect(allowed('user:1')).toBe(false)
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(allowed('user:1')).toBe(true)
  })
})
