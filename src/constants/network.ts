import type { Locale } from '@i18n/config'

/**
 * The rest of the eapps network, linked from the footer. Names are brands and stay in English
 * everywhere; only the heading (`Nav.moreApps`) is translated.
 *
 * `locales` maps each of our locales to the target's own code for it. A locale it lacks links
 * the target's `fallbackPath` instead.
 */
export type NetworkSite = {
  name: string
  url: string
  locales: Partial<Record<Locale, string>>
  /** `/` lets the target negotiate a language itself; a path pins one. */
  fallbackPath: string
}

/** The 33 locales of crossword's `LOCALES` (its `src/constants/puzzle.ts`), in our codes. */
const CROSSWORD_LOCALES: Partial<Record<Locale, string>> = {
  en: 'en',
  ru: 'ru',
  hy: 'hy',
  es: 'es',
  'pt-BR': 'pt',
  fr: 'fr',
  de: 'de',
  id: 'id',
  mr: 'mr',
  it: 'it',
  pl: 'pl',
  vi: 'vi',
  uk: 'uk',
  ar: 'ar',
  hi: 'hi',
  ko: 'ko',
  bn: 'bn',
  ja: 'ja',
  'zh-CN': 'zh',
  fa: 'fa',
  nl: 'nl',
  ro: 'ro',
  el: 'el',
  cs: 'cs',
  sv: 'sv',
  hu: 'hu',
  he: 'he',
  fil: 'fil',
  ms: 'ms',
  ur: 'ur',
  th: 'th',
  ta: 'ta',
  sw: 'sw',
}

export const NETWORK_SITES: readonly NetworkSite[] = [
  { name: 'Crossword AI', url: 'https://crossword.eapps.site', locales: CROSSWORD_LOCALES, fallbackPath: '/' },
  { name: 'eapps.site', url: 'https://eapps.site', locales: { en: 'en', ru: 'ru', hy: 'hy' }, fallbackPath: '/en' },
]
