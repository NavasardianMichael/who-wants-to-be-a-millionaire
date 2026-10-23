import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOCALES } from '@i18n/config'
import { matchAcceptLanguage } from '@i18n/matchAcceptLanguage'
// A plain .mjs script, shared with the CLI so both run the same checks.
import { checkLocale } from '../../../scripts/check-messages.mjs'
import { LOCALES as SERVER_LOCALES } from '../../../server/src/lib/locales'

const MESSAGES = path.resolve(__dirname, '../../../src/messages')

describe('locales', () => {
  it('ships 50 languages', () => {
    expect(LOCALES).toHaveLength(50)
    expect(new Set(LOCALES).size).toBe(50)
  })

  it('matches the API’s locale list exactly', () => {
    expect([...SERVER_LOCALES].sort()).toEqual([...LOCALES].sort())
  })

  it('negotiates real browser headers to a supported locale', () => {
    expect(matchAcceptLanguage('pt-PT,en;q=0.9')).toBe('pt-BR')
    expect(matchAcceptLanguage('hy-AM,hy;q=0.9,en;q=0.8')).toBe('hy')
    expect(matchAcceptLanguage('zh-TW,en;q=0.9')).toBe('zh-CN')
    expect(matchAcceptLanguage('xx')).toBe('en')
    expect(matchAcceptLanguage(null)).toBe('en')
  })
})

describe('message catalogues', () => {
  it('has a catalogue file for every locale', () => {
    for (const locale of LOCALES) expect(() => readFileSync(path.join(MESSAGES, `${locale}.json`))).not.toThrow()
  })

  it.each(LOCALES.filter((locale) => locale !== 'en'))('%s matches en.json (keys, placeholders, plurals)', (locale) => {
    expect(checkLocale(locale)).toEqual([])
  })
})
