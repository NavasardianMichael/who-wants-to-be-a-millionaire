'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from '@i18n/navigation'
import { adsAllowedOn, isAdCodeLoaded, isAdFreeUrl, loadAdCode } from '@helpers/ads'

/**
 * Google AdSense Auto ads: Google picks the places and formats for each screen size. The ad
 * code loads after hydration, only on pages `adsAllowedOn` admits.
 *
 * Auto ads place themselves on a full page load and keep those places through in-app
 * navigation, and loaded ad code cannot be unloaded. So once it is on the page, a link to an
 * ad-free page (a game screen, a form, a language AdSense does not support) is left to the
 * browser as a full page load; any other way of getting there (back button, language switch)
 * reloads the page on arrival.
 */
export const AutoAds = () => {
  const locale = useLocale()
  const pathname = usePathname()
  const allowed = adsAllowedOn(locale, pathname)

  useEffect(() => {
    if (allowed) loadAdCode()
    else if (isAdCodeLoaded()) window.location.reload()
  }, [allowed])

  useEffect(() => {
    if (!allowed) return
    // Capture phase on window runs before React's handler on the document, so stopping the
    // event there keeps the router out and the browser follows the link itself.
    const onClick = (event: MouseEvent) => {
      if (!isAdCodeLoaded() || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (isAdFreeUrl(url)) event.stopImmediatePropagation()
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [allowed])

  return null
}
