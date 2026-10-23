import { describe, expect, it } from 'vitest'
import { DEADLINE_GRACE_MS } from '../../../server/src/lib/game'
import { applyAnswer, initialEndsAt, isInTime, levelFor, questionDeadline } from '../../../server/src/services/runRules'

const now = new Date('2026-10-24T12:00:00Z')
const at = (offsetMs: number) => new Date(now.getTime() + offsetMs)

describe('ranked run rules', () => {
  it('gives marathon a per-question deadline and time attack a whole-run clock', () => {
    expect(questionDeadline('marathon', now)).toEqual(at(30_000))
    expect(questionDeadline('timeAttack', now)).toBeNull()
    expect(initialEndsAt('timeAttack', now)).toEqual(at(180_000))
    expect(initialEndsAt('marathon', now)).toBeNull()
  })

  it('accepts an answer within the latency grace, refuses one after it', () => {
    const clock = { mode: 'marathon' as const, endsAt: null, currentDeadline: at(0) }
    expect(isInTime(clock, at(DEADLINE_GRACE_MS))).toBe(true)
    expect(isInTime(clock, at(DEADLINE_GRACE_MS + 1))).toBe(false)
  })

  it('ends a marathon on the first wrong answer', () => {
    const clock = { mode: 'marathon' as const, endsAt: null, currentDeadline: at(10_000) }
    expect(applyAnswer(clock, true, now).finished).toBe(false)
    expect(applyAnswer(clock, false, now).finished).toBe(true)
  })

  it('costs time attack five seconds per wrong answer, ending the run when time runs out', () => {
    const clock = { mode: 'timeAttack' as const, endsAt: at(20_000), currentDeadline: null }
    expect(applyAnswer(clock, false, now)).toEqual({ finished: false, endsAt: at(15_000) })
    expect(applyAnswer({ ...clock, endsAt: at(4_000) }, false, now).finished).toBe(true)
    expect(applyAnswer(clock, true, now)).toEqual({ finished: false, endsAt: at(20_000) })
  })

  it('raises the level every five correct answers', () => {
    expect([0, 5, 10, 24, 50].map((count) => levelFor('marathon', count))).toEqual([1, 2, 3, 5, 5])
  })
})
