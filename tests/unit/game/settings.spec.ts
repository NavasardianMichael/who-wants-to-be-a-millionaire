import { describe, expect, it } from 'vitest'
import { levelForCorrectCount, STAGE_LEVELS } from '@constants/game'
import { classicLevel, classicSeconds, DEFAULT_SETTINGS, isDefaultSettings, practiceLevel, sanitizeSettings } from '@helpers/game/settings'

describe('levels', () => {
  it('maps the 15 classic stages onto 5 levels, three each', () => {
    expect(STAGE_LEVELS).toHaveLength(15)
    expect([1, 3, 4, 7, 13, 15].map((stage) => classicLevel(stage, 'normal'))).toEqual([1, 1, 2, 3, 5, 5])
  })

  it('shifts with difficulty but stays within 1..5', () => {
    expect(classicLevel(1, 'easy')).toBe(1)
    expect(classicLevel(1, 'hard')).toBe(2)
    expect(classicLevel(15, 'hard')).toBe(5)
    expect(classicLevel(15, 'easy')).toBe(4)
  })

  it('raises the marathon level every five correct answers, capped at 5', () => {
    expect([0, 4, 5, 9, 10, 19, 20, 99].map((count) => levelForCorrectCount(count, 5))).toEqual([1, 1, 2, 2, 3, 4, 5, 5])
    expect(practiceLevel('marathon', 0, 'hard')).toBe(2)
  })
})

describe('timer', () => {
  it('follows the show pace by default', () => {
    expect([1, 5, 6, 10, 11, 15].map((stage) => classicSeconds(stage, 'classic'))).toEqual([30, 30, 45, 45, null, null])
  })

  it('honours a fixed limit or none', () => {
    expect(classicSeconds(12, 15)).toBe(15)
    expect(classicSeconds(1, 'off')).toBeNull()
  })
})

describe('settings', () => {
  it('recognises the untouched defaults (the only ones that can be ranked)', () => {
    expect(isDefaultSettings(DEFAULT_SETTINGS)).toBe(true)
    expect(isDefaultSettings({ ...DEFAULT_SETTINGS, difficulty: 'hard' })).toBe(false)
    expect(isDefaultSettings({ ...DEFAULT_SETTINGS, categories: ['history'] })).toBe(false)
  })

  it('drops whatever no longer parses from storage', () => {
    expect(sanitizeSettings({ categories: ['history', 'nope'], difficulty: 'insane', timer: 99, lifelines: ['fiftyFifty', 'x'] })).toEqual({
      categories: ['history'],
      difficulty: 'normal',
      timer: 'classic',
      lifelines: ['fiftyFifty'],
    })
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
  })
})
