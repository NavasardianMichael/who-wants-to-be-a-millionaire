import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isStaleBuildError, reloadIfStaleBuild } from '@helpers/staleBuild'

const FACTORY =
  'Module 470102 was instantiated because it was required from module 789817, but the module factory is not available.'

describe('isStaleBuildError', () => {
  it('recognises Turbopack and webpack chunk errors', () => {
    expect(isStaleBuildError(new Error(FACTORY))).toBe(true)
    expect(isStaleBuildError(new Error('Failed to load chunk /_next/static/chunks/0abc.js from module 123'))).toBe(true)
    expect(isStaleBuildError(new Error('Loading chunk 42 failed.'))).toBe(true)
    expect(isStaleBuildError(Object.assign(new Error('whatever'), { name: 'ChunkLoadError' }))).toBe(true)
  })

  it('leaves every other error alone', () => {
    expect(isStaleBuildError(new TypeError("Cannot read properties of undefined (reading 'x')"))).toBe(false)
    expect(isStaleBuildError(FACTORY)).toBe(false)
    expect(isStaleBuildError(null)).toBe(false)
  })
})

describe('reloadIfStaleBuild', () => {
  let store: Map<string, string>
  let reload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    store = new Map()
    reload = vi.fn()
    vi.stubGlobal('window', {
      location: { reload },
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('reloads once, then lets a repeat through to be reported', () => {
    expect(reloadIfStaleBuild(new Error(FACTORY))).toBe(true)
    expect(reloadIfStaleBuild(new Error(FACTORY))).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads again once the guard has expired', () => {
    vi.useFakeTimers()
    expect(reloadIfStaleBuild(new Error(FACTORY))).toBe(true)
    vi.advanceTimersByTime(61_000)
    expect(reloadIfStaleBuild(new Error(FACTORY))).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('never reloads for an ordinary error', () => {
    expect(reloadIfStaleBuild(new Error('boom'))).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('never reloads when sessionStorage throws, so it cannot loop', () => {
    vi.stubGlobal('window', {
      location: { reload },
      sessionStorage: {
        getItem: () => {
          throw new Error('SecurityError')
        },
      },
    })
    expect(reloadIfStaleBuild(new Error(FACTORY))).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
