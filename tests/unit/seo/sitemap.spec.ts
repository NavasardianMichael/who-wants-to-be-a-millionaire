import { describe, expect, it } from 'vitest'
import { LOCALES } from '@i18n/config'
import { CATEGORIES } from '@constants/game'
import { INDEXABLE_ROUTES } from '@constants/routes'
import robots from '../../../src/app/robots'
import sitemap from '../../../src/app/sitemap'

describe('sitemap', () => {
  const entries = sitemap()

  it('lists every public page and category page in every locale', () => {
    expect(entries).toHaveLength((INDEXABLE_ROUTES.length + CATEGORIES.length) * LOCALES.length)
  })

  it('gives every entry the full hreflang set', () => {
    for (const entry of entries) expect(Object.keys(entry.alternates?.languages ?? {})).toHaveLength(LOCALES.length)
  })

  it('never lists private pages', () => {
    expect(entries.some(({ url }) => /\/(profile|settings)$/.test(url))).toBe(false)
  })

  it('is referenced from robots.txt, which blocks the private pages', () => {
    const rules = robots()
    expect(String(rules.sitemap)).toMatch(/\/sitemap\.xml$/)
    expect(JSON.stringify(rules.rules)).toContain('/*/profile')
  })
})
