import { describe, expect, it } from 'vitest'
import { LOCALES } from '@i18n/config'
import { LADDER } from '@constants/game'
import { formatMoney, formatNumber } from '@helpers/money'

// The ladder, the counter's in-between values, and leaderboard-sized scores.
const VALUES = [0, 7, 42, ...LADDER, 1234, 98765, 4321987, 1234567890]

/**
 * The table must say exactly what Node's full ICU says. When this fails after a Node
 * upgrade or a new locale, run `pnpm i18n:formats` and look over the diff.
 */
describe.each(LOCALES)('%s', (locale) => {
  it('writes money as Intl does', () => {
    const intl = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    expect(VALUES.map((value) => formatMoney(value, locale))).toEqual(VALUES.map((value) => intl.format(value)))
  })

  it('writes whole numbers as Intl does', () => {
    const intl = new Intl.NumberFormat(locale)
    expect(VALUES.map((value) => formatNumber(value, locale))).toEqual(VALUES.map((value) => intl.format(value)))
  })
})

describe('formatMoney', () => {
  it('rounds to whole dollars', () => {
    expect(formatMoney(1499.6, 'en')).toBe('$1,500')
  })

  it('falls back to English for an unknown locale', () => {
    expect(formatMoney(1000000, 'xx')).toBe('$1,000,000')
  })
})
