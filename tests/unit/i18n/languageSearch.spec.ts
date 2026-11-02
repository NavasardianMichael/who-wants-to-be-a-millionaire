import { describe, expect, it } from 'vitest'
import { type Locale, LOCALES } from '@i18n/config'
import { foldForSearch, languageSearchText } from '@i18n/languageNames'

const search = (query: string, inLocale: Locale) =>
  LOCALES.filter((each) => languageSearchText(each, inLocale).includes(foldForSearch(query)))

describe('language search', () => {
  it('finds a language by its own name, its English name and its code', () => {
    for (const query of ['Հայերեն', 'armenian', 'ARMEN', 'hy']) expect(search(query, 'en')).toContain('hy')
  })

  it("finds a language by its name in the page's language", () => {
    expect(search('армянский', 'ru')).toContain('hy')
  })

  it('ignores accents', () => {
    expect(search('espanol', 'en')).toContain('es')
    expect(search('francais', 'en')).toContain('fr')
  })

  it('knows every language by its English name', () => {
    for (const each of LOCALES) expect(languageSearchText(each, 'en')).not.toBe(foldForSearch(each))
  })
})
