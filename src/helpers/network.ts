import type { Locale } from '@i18n/config'
import type { NetworkSite } from '@constants/network'

export type NetworkLink = { name: string; href: string; hrefLang?: string }

/** The site's page in the visitor's language when it has one, otherwise its fallback. */
export const networkLink = (site: NetworkSite, locale: Locale): NetworkLink => {
  const target = site.locales[locale]
  return target
    ? { name: site.name, href: `${site.url}/${target}`, hrefLang: target }
    : { name: site.name, href: `${site.url}${site.fallbackPath === '/' ? '' : site.fallbackPath}` }
}
