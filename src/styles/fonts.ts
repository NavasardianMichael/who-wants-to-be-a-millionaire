import { Manrope, Montserrat } from 'next/font/google'
import type { Locale } from '@i18n/config'

/**
 * Montserrat for display (headings, the ladder, the money), Manrope for body copy. Both
 * cover Latin, Latin-ext, Cyrillic and Vietnamese; Manrope adds Greek.
 *
 * The variables are `--font-heading` / `--font-body`, NOT `--font-sans`: Tailwind defines
 * `--font-sans` itself, and globals.css composes it from these plus `--font-script`.
 */
export const fontHeading = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['600', '700', '800', '900'],
})

export const fontBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  adjustFontFallback: true,
})

/**
 * Locales whose script neither face has. Loaded per page from Google Fonts — only the
 * active locale's family, so 49 visitors in 50 never download a CJK font they cannot read.
 * (next/font would inline every family's @font-face rules into the shared CSS; with 16
 * script families, three of them CJK, that costs every visitor hundreds of KB.)
 *
 * `--font-script` is appended *after* the Latin faces, so Latin text inside an Arabic UI
 * still renders in Montserrat/Manrope by per-glyph fallback.
 */
const SCRIPT_FAMILIES: Partial<Record<Locale, string>> = {
  'zh-CN': 'Noto Sans SC',
  ja: 'Noto Sans JP',
  ko: 'Noto Sans KR',
  ar: 'Noto Sans Arabic',
  ur: 'Noto Sans Arabic',
  fa: 'Noto Sans Arabic',
  he: 'Noto Sans Hebrew',
  hi: 'Noto Sans Devanagari',
  mr: 'Noto Sans Devanagari',
  bn: 'Noto Sans Bengali',
  pa: 'Noto Sans Gurmukhi',
  gu: 'Noto Sans Gujarati',
  ta: 'Noto Sans Tamil',
  te: 'Noto Sans Telugu',
  kn: 'Noto Sans Kannada',
  ml: 'Noto Sans Malayalam',
  th: 'Noto Sans Thai',
  hy: 'Noto Sans Armenian',
  ka: 'Noto Sans Georgian',
  el: 'Noto Sans',
}

export type ScriptFont = { family: string; href: string }

export const getScriptFont = (locale: Locale): ScriptFont | null => {
  const family = SCRIPT_FAMILIES[locale]
  if (!family) return null
  return {
    family,
    href: `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;600;700;800&display=swap`,
  }
}
