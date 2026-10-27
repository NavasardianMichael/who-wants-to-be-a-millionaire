import type { Locale } from './config'

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
