import { describe, expect, it } from 'vitest'
import { musicForStage } from '@helpers/audio/sounds'

describe('question music', () => {
  it('changes bed after each safe haven: questions 1–5, 6–10, 11 on', () => {
    const beds = Array.from({ length: 15 }, (_, index) => musicForStage(index + 1))
    expect(beds).toEqual([...Array(5).fill('easy'), ...Array(5).fill('medium'), ...Array(5).fill('hard')])
  })

  it('stays on the last bed past question 15 (Marathon, Time Attack)', () => {
    expect(musicForStage(40)).toBe('hard')
  })
})
