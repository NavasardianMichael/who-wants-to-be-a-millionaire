import type { CSSProperties } from 'react'
import { Manrope, Montserrat } from 'next/font/google'
import type { Locale } from '@i18n/config'

/**
 * Montserrat for display (headings, the ladder, the money), Manrope for body copy. Both
 * cover Latin, Latin-ext, Cyrillic and Vietnamese; Manrope adds Greek.
 *
 * The variables are `--font-heading` / `--font-body`, NOT `--font-sans`: Tailwind defines
 * `--font-sans` itself, and globals.css composes it from these.
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
 * active locale's family, so 79 visitors in 80 never download a CJK font they cannot read.
 * (next/font would inline every family's @font-face rules into the shared CSS; with 23
 * script families, four of them CJK, that costs every visitor hundreds of KB.)
 *
 * The script face goes *after* Montserrat/Manrope, so Latin text inside an Arabic UI still
 * renders in them by per-glyph fallback — but *before* next/font's metric-matched fallback
 * face (`'Manrope Fallback'`, a `local("Arial")`): Arial has Armenian, Greek, Hebrew, Arabic
 * and Cyrillic glyphs, so behind it the script face was never reached.
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
  'zh-TW': 'Noto Sans TC',
  ps: 'Noto Sans Arabic',
  ne: 'Noto Sans Devanagari',
  or: 'Noto Sans Oriya',
  si: 'Noto Sans Sinhala',
  my: 'Noto Sans Myanmar',
  km: 'Noto Sans Khmer',
  lo: 'Noto Sans Lao',
  am: 'Noto Sans Ethiopic',
}

export type ScriptFont = {
  family: string
  href: string
  /** `--font-heading` / `--font-body` with the script face slotted in; set on <html> over next/font's own. */
  variables: CSSProperties
}

/** `'Manrope', 'Manrope Fallback'` → `'Manrope', '<script>', 'Manrope Fallback'`. */
const withScriptFace = (fontFamily: string, family: string): string => {
  const [face, ...fallbacks] = fontFamily.split(',').map((name) => name.trim())
  return [face, `'${family}'`, ...fallbacks].join(', ')
}

export const getScriptFont = (locale: Locale): ScriptFont | null => {
  const family = SCRIPT_FAMILIES[locale]
  if (!family) return null
  return {
    family,
    href: `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;600;700;800&display=swap`,
    variables: {
      '--font-heading': withScriptFace(fontHeading.style.fontFamily, family),
      '--font-body': withScriptFace(fontBody.style.fontFamily, family),
    } as CSSProperties,
  }
}
