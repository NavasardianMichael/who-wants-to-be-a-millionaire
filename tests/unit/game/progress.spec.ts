import { describe, expect, it } from 'vitest'
import { currentStreak, type GameSummary, type LocalStats, qualifyingBadges } from '@helpers/game/progress'

const stats = (overrides: Partial<LocalStats> = {}): LocalStats => ({
  localesPlayed: ['en'],
  playDays: [],
  quickAnswers: 0,
  categoryCorrect: {},
  offlineGames: 0,
  gamesPlayed: 1,
  ...overrides,
})

const game = (overrides: Partial<GameSummary> = {}): GameSummary => ({
  mode: 'classic',
  locale: 'en',
  correctCount: 0,
  outcome: 'lost',
  lifelinesUsed: [],
  quickAnswers: 0,
  categoryCorrect: {},
  offline: false,
  savedByFriend: false,
  ...overrides,
})

describe('badge rules', () => {
  it('awards the classic milestones', () => {
    expect(qualifyingBadges(game({ correctCount: 1 }), stats())).toEqual(['firstSteps'])
    expect(qualifyingBadges(game({ correctCount: 10 }), stats())).toEqual(expect.arrayContaining(['safeHaven', 'halfWay']))
  })

  it('awards the purist only for a lifeline-free million', () => {
    expect(qualifyingBadges(game({ correctCount: 15, outcome: 'won' }), stats())).toEqual(
      expect.arrayContaining(['millionaire', 'purist'])
    )
    expect(qualifyingBadges(game({ correctCount: 15, outcome: 'won', lifelinesUsed: ['fiftyFifty'] }), stats())).not.toContain('purist')
  })

  it('counts a smart exit only at question 12 or later', () => {
    expect(qualifyingBadges(game({ correctCount: 11, outcome: 'walked' }), stats())).not.toContain('smartExit')
    expect(qualifyingBadges(game({ correctCount: 12, outcome: 'walked' }), stats())).toContain('smartExit')
  })

  it('reads the running stats', () => {
    const badges = qualifyingBadges(
      game({ offline: true, savedByFriend: true }),
      stats({ localesPlayed: ['en', 'hy', 'ja'], quickAnswers: 10, categoryCorrect: { history: 25 } })
    )
    expect(badges).toEqual(expect.arrayContaining(['polyglot3', 'quickThinker', 'offlineHero', 'savedByAFriend', 'categoryMaster']))
  })

  it('never awards ranked-run badges from a device', () => {
    const badges = qualifyingBadges(game({ mode: 'marathon', correctCount: 200, outcome: 'ended' }), stats())
    expect(badges.some((badge) => badge.startsWith('marathon') || badge.startsWith('timeAttack'))).toBe(false)
  })
})

describe('streaks', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-10-22', '2026-10-23', '2026-10-24'], now)).toBe(3)
  })

  it('does not break before the day is over', () => {
    expect(currentStreak(['2026-10-22', '2026-10-23'], now)).toBe(2)
  })

  it('resets after a missed day', () => {
    expect(currentStreak(['2026-10-20', '2026-10-21'], now)).toBe(0)
  })
})
