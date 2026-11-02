import { type Locale, LOCALE_LABELS } from './config'

/** ICU names `zh-CN` "Chinese (China)"; readers know the two by their scripts. */
const DISPLAY_CODES: Partial<Record<Locale, string>> = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' }

/**
 * `locale`'s name in the language `inLocale` — "Armenian" on an English page, "армянский" on a
 * Russian one — capitalised, since it stands alone as a label. Falls back to the code where ICU
 * has no name.
 */
export const languageName = (locale: Locale, inLocale: Locale): string => {
  const name =
    new Intl.DisplayNames([inLocale], { type: 'language', fallback: 'code' }).of(DISPLAY_CODES[locale] ?? locale) ??
    locale
  return name.charAt(0).toLocaleUpperCase(inLocale) + name.slice(1)
}

/** Lower-cased with Latin, Greek and Cyrillic accents dropped, so "espanol" finds "Español". */
export const foldForSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase()
    .trim()

/**
 * What a language search on an `inLocale` page matches `locale` by, folded: its code, its own
 * name, its English name and its name in the page's language — so "armenian", "армянский" and
 * "հայերեն" all find `hy`.
 */
export const languageSearchText = (locale: Locale, inLocale: Locale): string =>
  foldForSearch([locale, LOCALE_LABELS[locale], languageName(locale, 'en'), languageName(locale, inLocale)].join('\n'))
