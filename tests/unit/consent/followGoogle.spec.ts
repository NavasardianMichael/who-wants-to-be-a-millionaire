import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type TcCallback = (data: { eventStatus?: string; gdprApplies?: boolean; purpose?: { consents?: Record<string, boolean> } }, success: boolean) => void

/** A browser in Berlin (asked first) with an empty localStorage, and GA configured. */
const setUp = async (tcf?: (callback: TcCallback) => void) => {
  const store = new Map<string, string>()
  const dataLayer: unknown[] = []
  vi.stubGlobal('window', {
    localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    dataLayer,
    ...(tcf && { __tcfapi: (_command: string, _version: number, callback: TcCallback) => tcf(callback) }),
  })
  vi.stubGlobal('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) }) })
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123')
  vi.resetModules()
  const consent = await import('@helpers/consent')
  return { consent, dataLayer }
}

describe('the analytics banner defers to Google’s consent message on ad pages', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('stays closed on an ad page while Google’s message is pending, but asks on other pages', async () => {
    const { consent } = await setUp()
    expect(consent.isConsentBannerOpen(true)).toBe(false)
    expect(consent.isConsentBannerOpen(false)).toBe(true)
  })

  it('takes a "no" to Purpose 1 as the analytics answer, so ours never asks', async () => {
    let answer: TcCallback = () => {}
    const { consent } = await setUp((callback) => (answer = callback))
    consent.followGoogleConsent()
    answer({ eventStatus: 'cmpuishown', gdprApplies: true }, true)
    expect(consent.isConsentBannerOpen(true)).toBe(false)
    answer({ eventStatus: 'useractioncomplete', gdprApplies: true, purpose: { consents: { 1: false } } }, true)
    expect(consent.readConsent()).toBe('denied')
    expect(consent.isConsentBannerOpen(true)).toBe(false)
  })

  it('takes a "yes" the same way', async () => {
    const { consent } = await setUp((callback) => callback({ eventStatus: 'useractioncomplete', gdprApplies: true, purpose: { consents: { 1: true } } }, true))
    consent.followGoogleConsent()
    expect(consent.readConsent()).toBe('granted')
  })

  it('asks itself where TCF does not apply', async () => {
    const { consent } = await setUp((callback) => callback({ eventStatus: 'tcloaded', gdprApplies: false }, true))
    consent.followGoogleConsent()
    expect(consent.readConsent()).toBeNull()
    expect(consent.isConsentBannerOpen(true)).toBe(true)
  })

  it('asks itself when Google’s message never loads (an ad blocker)', async () => {
    const { consent } = await setUp()
    consent.followGoogleConsent()
    expect(consent.isConsentBannerOpen(true)).toBe(false)
    await vi.advanceTimersByTimeAsync(11_000)
    expect(consent.isConsentBannerOpen(true)).toBe(true)
  })
})
