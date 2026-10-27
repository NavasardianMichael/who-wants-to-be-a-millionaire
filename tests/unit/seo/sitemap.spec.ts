import { describe, expect, it } from 'vitest'
import { LOCALES } from '@i18n/config'
import { INDEXABLE_ROUTES } from '@constants/routes'
import robots from '../../../src/app/robots'
import sitemap from '../../../src/app/sitemap'

describe('sitemap', () => {
  const entries = sitemap()

  it('lists every indexable page in every locale, once', () => {
    expect(entries).toHaveLength(INDEXABLE_ROUTES.length * LOCALES.length)
    expect(new Set(entries.map(({ url }) => url)).size).toBe(entries.length)
  })

  it('lists every locale home page', () => {
    for (const locale of LOCALES) expect(entries.some(({ url }) => url.endsWith(`/${locale}`))).toBe(true)
  })

  it('leaves hreflang to the pages, so the file stays small', () => {
    expect(entries.every((entry) => entry.alternates === undefined)).toBe(true)
  })

  it('never lists private or noindex pages', () => {
    expect(entries.some(({ url }) => /\/(profile|settings|sign-in|categories)(\/|$)/.test(url))).toBe(false)
  })

  it('is referenced from robots.txt, which blocks the private pages', () => {
    const rules = robots()
    expect(String(rules.sitemap)).toMatch(/\/sitemap\.xml$/)
    expect(JSON.stringify(rules.rules)).toContain('/*/profile')
  })
})
