import { GA_ENABLED } from '@constants/analytics'
import { CONSENT_TIME_ZONES } from '@constants/consent'
import { setAnalyticsConsent } from '@helpers/analytics'

/**
 * Google Consent Mode v2 for **analytics only** (as guests and crossword). Where the law asks for
 * an opt-in (`CONSENT_TIME_ZONES`: the EU and EEA, the UK, Switzerland), GA starts with analytics
 * storage denied — no cookies, only cookieless pings — and `ConsentBanner` asks; accepting or
 * closing it grants. Everywhere else analytics storage is granted from the first page and no
 * banner shows. An answer is kept in this browser and can be changed from "Cookie settings" in
 * the footer. Storage can throw (blocked site data); then the banner asks again next visit.
 *
 * The ad_* signals are left alone: AdSense asks for its own consent in those regions, through
 * Google's message (docs/ADSENSE_SETUP.md §6), and a default here would override it everywhere.
 */
export type ConsentChoice = 'granted' | 'denied'

/** Whether a device in this time zone is asked first. An unknown or UTC zone (privacy browsers) is. */
export const asksForConsent = (timeZone: string | undefined): boolean =>
  !timeZone || timeZone === 'UTC' || timeZone.startsWith('Etc/') || CONSENT_TIME_ZONES.includes(timeZone)

const deviceTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

const KEY = 'millionaire:analytics-consent:v1'

export const readConsent = (): ConsentChoice | null => {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

/** Whether the banner shows — a `useSyncExternalStore` source, read only in the browser. */
let bannerOpen: boolean | null = null
const listeners = new Set<() => void>()
const emit = (): void => listeners.forEach((listener) => listener())

export const subscribeConsentBanner = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * On a page that loads the ad code, Google's own consent message (AdSense's, docs/ADSENSE_SETUP.md
 * §6) asks in the same regions. Until it has had its say, ours stays closed, so the two never
 * stand on screen together; `followGoogleConsent` settles it.
 */
let googlePending = true

/**
 * Open until the visitor answers, where an opt-in is needed; never without a GA tag to ask about.
 * `adPage`: this page loads the ad code (`AutoAds`), decided in the same render so nothing flashes.
 */
export const isConsentBannerOpen = (adPage: boolean): boolean =>
  !(adPage && googlePending) && (bannerOpen ??= GA_ENABLED && readConsent() === null && asksForConsent(deviceTimeZone()))

/** "Cookie settings" in the footer: ask again, whatever Google's message is doing. */
export const openConsentBanner = (): void => {
  googlePending = false
  bannerOpen = GA_ENABLED
  emit()
}

export const saveConsent = (choice: ConsentChoice): void => {
  try {
    window.localStorage.setItem(KEY, choice)
  } catch {
    // Site data blocked: the answer holds for this page, and the banner asks again next visit.
  }
  setAnalyticsConsent(choice)
  bannerOpen = false
  emit()
}

type TcData = { eventStatus?: string; gdprApplies?: boolean; purpose?: { consents?: Record<string, boolean> } }
type TcfApi = (command: 'addEventListener', version: 2, callback: (data: TcData, success: boolean) => void) => void

/** How long to wait for Google's message to load before ours asks after all (an ad blocker). */
const GOOGLE_WAIT_MS = 10_000

/**
 * Called by `AutoAds` once it loads the ad code. Google's message is an IAB TCF consent tool; the
 * visitor's answer there to Purpose 1 — storing information on the device, which is what
 * analytics cookies do — becomes the analytics answer, so nobody is asked twice. An answer from
 * an earlier visit (`tcloaded`) is adopted only when ours has none. Where TCF does not apply, or
 * the message never loads, ours asks as it would anywhere else.
 */
export const followGoogleConsent = (): void => {
  if (!GA_ENABLED) return
  const settle = (): void => {
    googlePending = false
    emit()
  }
  const started = Date.now()
  const attach = (): void => {
    const tcf = (window as Window & { __tcfapi?: TcfApi }).__tcfapi
    if (!tcf) {
      if (Date.now() - started < GOOGLE_WAIT_MS) window.setTimeout(attach, 250)
      else settle()
      return
    }
    tcf('addEventListener', 2, (data, success) => {
      if (!success || data.gdprApplies === false) return settle()
      const agreed = data.purpose?.consents?.[1] === true
      if (data.eventStatus === 'useractioncomplete') {
        googlePending = false
        saveConsent(agreed ? 'granted' : 'denied')
      } else if (data.eventStatus === 'tcloaded') {
        googlePending = false
        if (readConsent() === null) saveConsent(agreed ? 'granted' : 'denied')
        else emit()
      }
      // 'cmpuishown': Google's message is on screen; ours stays closed until it is answered.
    })
  }
  attach()
}

/**
 * Runs before anything reaches GA's queue (inline, first in the locale layout's body): analytics
 * granted by a stored "yes", denied by a stored "no", and otherwise by region — denied where
 * `asksForConsent` (mirrored here, tested against it), granted elsewhere. So a visitor outside
 * those regions is counted from the first page view.
 */
export const CONSENT_DEFAULTS_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
var stored = null;
try { stored = localStorage.getItem(${JSON.stringify(KEY)}); } catch (e) {}
var zone = '';
try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
var asks = !zone || zone === 'UTC' || zone.indexOf('Etc/') === 0 || ${JSON.stringify(CONSENT_TIME_ZONES)}.indexOf(zone) !== -1;
gtag('consent', 'default', {
  analytics_storage: stored === 'granted' || (stored !== 'denied' && !asks) ? 'granted' : 'denied',
});
`
