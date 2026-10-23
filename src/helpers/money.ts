/**
 * The ladder is dollars everywhere — the show's own currency — written the way each
 * language writes money: `$1,000,000`, `1.000.000 $`, `1 000 000 $US`, `US$1,000,000`.
 * Formatters are cached per locale: `Intl.NumberFormat` construction is the expensive part.
 */
const formatters = new Map<string, Intl.NumberFormat>()

export const formatMoney = (amount: number, locale: string): string => {
  let formatter = formatters.get(locale)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    formatters.set(locale, formatter)
  }
  return formatter.format(amount)
}

/** Shorter form for tight spaces (the mobile header): `$125K`, `$1M`. */
export const formatMoneyCompact = (amount: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)

export const formatNumber = (value: number, locale: string): string => new Intl.NumberFormat(locale).format(value)
