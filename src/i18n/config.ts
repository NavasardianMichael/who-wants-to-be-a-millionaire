/**
 * The 50 supported locales, roughly by number of speakers online.
 *
 * BCP-47 codes carry a region only where it decides the copy — `pt-BR` rather than `pt-PT`,
 * `zh-CN` (Simplified) rather than `zh-TW`. **Twin:** `server/src/lib/locales.ts` holds the
 * same list plus each locale's culture hint for question generation;
 * `tests/unit/i18n/locales.spec.ts` keeps them in step.
 *
 * The locale is a path segment: every route lives under `app/[lang]/` and every URL names
 * its language, English included (`localePrefix: 'always'`). `src/proxy.ts` negotiates a
 * locale only for unprefixed traffic — `NEXT_LOCALE` cookie, then `Accept-Language`.
 */
export const LOCALES = [
  'en',
  'zh-CN',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'pt-BR',
  'ru',
  'ur',
  'id',
  'de',
  'ja',
  'sw',
  'mr',
  'te',
  'tr',
  'ta',
  'vi',
  'ko',
  'it',
  'fa',
  'th',
  'gu',
  'pl',
  'uk',
  'kn',
  'ml',
  'pa',
  'fil',
  'ms',
  'nl',
  'ro',
  'el',
  'cs',
  'hu',
  'sv',
  'he',
  'da',
  'fi',
  'nb',
  'sk',
  'bg',
  'sr',
  'hr',
  'az',
  'kk',
  'uz',
  'hy',
  'ka',
] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** The cookie an explicit switcher choice writes. Read by `src/proxy.ts`. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

/** Right-to-left scripts. Drives `<html dir>`. */
const RTL_LOCALES = new Set<Locale>(['ar', 'ur', 'fa', 'he'])

export type Direction = 'ltr' | 'rtl'

export const getDirection = (locale: Locale): Direction => (RTL_LOCALES.has(locale) ? 'rtl' : 'ltr')

/**
 * Endonyms — each language named in itself, which is what a language switcher must show:
 * someone who cannot read the current UI language still has to find their own. Never
 * translate these.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  bn: 'বাংলা',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  ur: 'اردو',
  id: 'Bahasa Indonesia',
  de: 'Deutsch',
  ja: '日本語',
  sw: 'Kiswahili',
  mr: 'मराठी',
  te: 'తెలుగు',
  tr: 'Türkçe',
  ta: 'தமிழ்',
  vi: 'Tiếng Việt',
  ko: '한국어',
  it: 'Italiano',
  fa: 'فارسی',
  th: 'ไทย',
  gu: 'ગુજરાતી',
  pl: 'Polski',
  uk: 'Українська',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  fil: 'Filipino',
  ms: 'Bahasa Melayu',
  nl: 'Nederlands',
  ro: 'Română',
  el: 'Ελληνικά',
  cs: 'Čeština',
  hu: 'Magyar',
  sv: 'Svenska',
  he: 'עברית',
  da: 'Dansk',
  fi: 'Suomi',
  nb: 'Norsk bokmål',
  sk: 'Slovenčina',
  bg: 'Български',
  sr: 'Српски',
  hr: 'Hrvatski',
  az: 'Azərbaycan dili',
  kk: 'Қазақ тілі',
  uz: 'Oʻzbekcha',
  hy: 'Հայերեն',
  ka: 'ქართული',
}

/** OpenGraph wants `ll_CC`; a best-effort region per language. */
export const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  'zh-CN': 'zh_CN',
  hi: 'hi_IN',
  es: 'es_ES',
  fr: 'fr_FR',
  ar: 'ar_AR',
  bn: 'bn_BD',
  'pt-BR': 'pt_BR',
  ru: 'ru_RU',
  ur: 'ur_PK',
  id: 'id_ID',
  de: 'de_DE',
  ja: 'ja_JP',
  sw: 'sw_KE',
  mr: 'mr_IN',
  te: 'te_IN',
  tr: 'tr_TR',
  ta: 'ta_IN',
  vi: 'vi_VN',
  ko: 'ko_KR',
  it: 'it_IT',
  fa: 'fa_IR',
  th: 'th_TH',
  gu: 'gu_IN',
  pl: 'pl_PL',
  uk: 'uk_UA',
  kn: 'kn_IN',
  ml: 'ml_IN',
  pa: 'pa_IN',
  fil: 'tl_PH',
  ms: 'ms_MY',
  nl: 'nl_NL',
  ro: 'ro_RO',
  el: 'el_GR',
  cs: 'cs_CZ',
  hu: 'hu_HU',
  sv: 'sv_SE',
  he: 'he_IL',
  da: 'da_DK',
  fi: 'fi_FI',
  nb: 'nb_NO',
  sk: 'sk_SK',
  bg: 'bg_BG',
  sr: 'sr_RS',
  hr: 'hr_HR',
  az: 'az_AZ',
  kk: 'kk_KZ',
  uz: 'uz_UZ',
  hy: 'hy_AM',
  ka: 'ka_GE',
}
