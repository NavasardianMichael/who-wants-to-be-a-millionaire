import { beforeEach, describe, expect, it } from 'vitest'
import { leaveReason, useLeaveGuardStoreBase } from '@store/navigation/guard/store'

const store = () => useLeaveGuardStoreBase.getState()

describe('leave guard', () => {
  beforeEach(() => {
    store().setGuard('game', null)
    store().setGuard('form', null)
  })

  it('lets a navigation through at once while nothing is guarded', async () => {
    await expect(store().ask()).resolves.toBe(true)
    expect(store().question).toBeNull()
  })

  it('holds a navigation until the player answers', async () => {
    store().setGuard('game', 'game')
    const stay = store().ask()
    expect(store().question).not.toBeNull()
    store().answer(false)
    await expect(stay).resolves.toBe(false)
    expect(store().leaving).toBe(false)

    const leave = store().ask()
    store().answer(true)
    await expect(leave).resolves.toBe(true)
    // Agreed once: the page load that follows does not ask again.
    expect(store().leaving).toBe(true)
    await expect(store().ask()).resolves.toBe(true)
  })

  it('starts afresh once nothing is guarded, so the next game asks again', async () => {
    store().setGuard('game', 'game')
    const leave = store().ask()
    store().answer(true)
    await leave
    store().setGuard('game', null)
    expect(store().leaving).toBe(false)

    store().setGuard('game', 'game')
    void store().ask()
    expect(store().question).not.toBeNull()
  })

  it('drops an open question when the game ends under it', async () => {
    store().setGuard('game', 'rankedGame')
    const pending = store().ask()
    store().setGuard('game', null)
    await expect(pending).resolves.toBe(false)
    expect(store().question).toBeNull()
  })

  it('answers a superseded question with "stay"', async () => {
    store().setGuard('game', 'game')
    const first = store().ask()
    const second = store().ask()
    await expect(first).resolves.toBe(false)
    store().answer(true)
    await expect(second).resolves.toBe(true)
  })

  it('names a game over a form', () => {
    expect(leaveReason({ a: 'unsaved', b: 'game' })).toBe('game')
    expect(leaveReason({ a: 'game', b: 'rankedGame' })).toBe('rankedGame')
    expect(leaveReason({})).toBeNull()
  })
})
