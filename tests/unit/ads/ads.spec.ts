import { describe, expect, it } from 'vitest'
import { LOCALES } from '@i18n/config'
import { AD_LOCALES } from '@constants/ads'
import { adsAllowedOn, isAdFreeUrl } from '@helpers/ads'

const url = (path: string) => new URL(path, 'https://example.com')

describe('ad locales', () => {
  it('are the 48 app locales AdSense supports, each a live locale', () => {
    expect(AD_LOCALES).toHaveLength(48)
    expect(new Set(AD_LOCALES).size).toBe(48)
    for (const locale of AD_LOCALES) expect(LOCALES).toContain(locale)
  })

  it('leave out languages AdSense does not support', () => {
    for (const locale of ['hy', 'ka', 'fa', 'sw', 'uz', 'af', 'zu']) expect(AD_LOCALES).not.toContain(locale)
  })
})

describe('adsAllowedOn', () => {
  it('admits content pages in a supported locale, sub-paths included', () => {
    expect(adsAllowedOn('en', '/')).toBe(true)
    expect(adsAllowedOn('de', '/leaderboard')).toBe(true)
    expect(adsAllowedOn('ja', '/categories/history')).toBe(true)
    expect(adsAllowedOn('ru', '/rules')).toBe(true)
  })

  it('keeps the game screens, forms and account pages clear', () => {
    for (const path of ['/play', '/marathon', '/time-attack', '/sign-in', '/sign-up', '/settings', '/profile', '/contact', '/verify-email']) {
      expect(adsAllowedOn('en', path)).toBe(false)
    }
  })

  it('refuses unsupported and unknown locales, and unknown paths', () => {
    expect(adsAllowedOn('hy', '/')).toBe(false)
    expect(adsAllowedOn('xx', '/')).toBe(false)
    expect(adsAllowedOn('en', '/no-such-page')).toBe(false)
    expect(adsAllowedOn('en', '/rulesx')).toBe(false)
  })
})

describe('isAdFreeUrl', () => {
  it('reads the locale from the URL', () => {
    expect(isAdFreeUrl(url('/en'))).toBe(false)
    expect(isAdFreeUrl(url('/en/badges?x=1#top'))).toBe(false)
    expect(isAdFreeUrl(url('/en/play'))).toBe(true)
    expect(isAdFreeUrl(url('/hy'))).toBe(true)
    expect(isAdFreeUrl(url('/hy/rules'))).toBe(true)
  })

  it('treats a path without a locale prefix as ad-free', () => {
    expect(isAdFreeUrl(url('/rules'))).toBe(true)
  })
})
