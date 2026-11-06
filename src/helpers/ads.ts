import { isLocale } from '@i18n/config'
import { splitLocaleFromPathname } from '@i18n/pathname'
import { AD_LOCALES, AD_ROUTES, ADSENSE_SCRIPT_SRC } from '@constants/ads'

/** Whether ad code may run on this page: a locale AdSense supports and a page on the allow-list. */
export const adsAllowedOn = (locale: string, pathname: string): boolean =>
  isLocale(locale) &&
  AD_LOCALES.includes(locale) &&
  AD_ROUTES.some((route) => (route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)))

/**
 * Whether a same-origin URL (`/en/play`, `/hy`) opens a page that must stay ad-free. Unknown
 * paths count as ad-free too: they are 404s.
 */
export const isAdFreeUrl = (url: URL): boolean => {
  const { locale, pathname } = splitLocaleFromPathname(url.pathname)
  return !locale || !adsAllowedOn(locale, pathname)
}

const SCRIPT_ID = 'adsbygoogle-js'

/** Ad code, once loaded, stays for the life of the document — only a full page load removes it. */
export const isAdCodeLoaded = (): boolean => typeof document !== 'undefined' && document.getElementById(SCRIPT_ID) !== null

/** The Auto ads tag as AdSense issues it (async, crossorigin), added to <head> once. */
export const loadAdCode = (): void => {
  if (isAdCodeLoaded()) return
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = ADSENSE_SCRIPT_SRC
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}
