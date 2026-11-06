import type { Locale } from '@i18n/config'
import { ROUTES } from './routes'

/**
 * Google AdSense Auto ads. Everything stays off while NEXT_PUBLIC_ADSENSE_CLIENT is unset.
 * NEXT_PUBLIC_ values are inlined at build time. Manual setup: docs/ADSENSE_SETUP.md.
 */
const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{10,20}$/

const readClient = () => {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()
  if (!raw) return ''
  if (ADSENSE_CLIENT_PATTERN.test(raw)) return raw
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[ads] NEXT_PUBLIC_ADSENSE_CLIENT does not look like an AdSense client ID (ca-pub-XXXXXXXXXXXXXXXX).')
  }
  return ''
}

/** `ca-pub-…`: the ad code's `client` and the site-ownership meta tag. */
export const ADSENSE_CLIENT = readClient()

export const ADSENSE_ENABLED = ADSENSE_CLIENT.length > 0

/** `pub-…`: the form ads.txt uses. */
export const ADSENSE_PUBLISHER_ID = ADSENSE_CLIENT.replace(/^ca-/, '')

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`

/** Google's own ads.txt line; `f08c47fec0942fa0` is Google's fixed certification authority ID. */
export const ADS_TXT_LINE = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`

/**
 * The locales AdSense supports (support.google.com/adsense/answer/9727). Ad code on a page in
 * any other language is against AdSense policy, so the other 32 locales never load it.
 */
export const AD_LOCALES: readonly Locale[] = [
  'ar', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fil', 'fr', 'gu', 'he',
  'hi', 'hr', 'hu', 'id', 'it', 'ja', 'kn', 'ko', 'lt', 'lv', 'ml', 'mr', 'ms', 'nb', 'nl', 'pa',
  'pl', 'pt-BR', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'ta', 'te', 'th', 'uk', 'ur', 'vi', 'zh-CN', 'zh-TW',
]

/**
 * The pages Auto ads may fill (locale-free, each with its sub-paths). An allow-list: the game
 * screens stay clear so an ad never sits over an answer, and screens with no content of their
 * own — sign-in, forms, settings, 404s — may not carry ads under AdSense policy.
 */
export const AD_ROUTES: readonly string[] = [
  ROUTES.home,
  ROUTES.leaderboard,
  ROUTES.categories,
  ROUTES.badges,
  ROUTES.rules,
  ROUTES.about,
  ROUTES.privacy,
  ROUTES.terms,
]
