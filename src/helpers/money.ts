import { DEFAULT_LOCALE, isLocale } from '@i18n/config'
import { NUMBER_FORMATS, type NumberPattern } from '@i18n/numberFormats'

/**
 * The ladder is dollars everywhere — the show's own currency — written the way each
 * language writes money: `$1,000,000`, `1.000.000 $`, `1 000 000 $US`, `US$10,00,000`.
 *
 * Deliberately not `Intl.NumberFormat` at runtime: browsers ship trimmed ICU data (Chrome
 * has no number data for Armenian, Georgian, Kazakh and more, and falls back to English),
 * so the client would render different text from the server and hydration would fail.
 * The patterns are Node's ICU, captured once by `pnpm i18n:formats`.
 */
const render = (value: number, { prefix, suffix, group = ',', grouping = [3, 3], minimumGrouping = 1, digits }: NumberPattern) => {
  let rest = String(Math.round(value))
  let grouped = ''
  if (group && rest.length >= grouping[0] + minimumGrouping) {
    grouped = group + rest.slice(-grouping[0])
    rest = rest.slice(0, -grouping[0])
    while (rest.length > grouping[1]) {
      grouped = group + rest.slice(-grouping[1]) + grouped
      rest = rest.slice(0, -grouping[1])
    }
  }
  const latin = rest + grouped
  return prefix + (digits ? latin.replace(/\d/g, (digit) => digits[Number(digit)]!) : latin) + suffix
}

const patternsOf = (locale: string) => NUMBER_FORMATS[isLocale(locale) ? locale : DEFAULT_LOCALE]

/** Whole dollars; anything finer is rounded, as the show never pays cents. */
export const formatMoney = (amount: number, locale: string): string => render(amount, patternsOf(locale).money)

/** A whole number, grouped the locale's way. */
export const formatNumber = (value: number, locale: string): string => render(value, patternsOf(locale).number)
