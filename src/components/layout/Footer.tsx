import { useLocale, useTranslations } from 'next-intl'
import { DEFAULT_LOCALE, isLocale, LOCALE_LABELS, LOCALES } from '@i18n/config'
import { LEGAL_NAV, PRIMARY_NAV, SECONDARY_NAV } from '@constants/navigation'
import { NETWORK_SITES } from '@constants/network'
import { networkLink } from '@helpers/network'
import { Emblem } from '@components/brand/Emblem'
import { ConsentSettingsLink } from '@components/consent/ConsentSettingsLink'
import { AppLink } from '@components/ui/bare/AppLink'

/**
 * Server-rendered, so every link is crawlable. The language list links each locale's home
 * page — together with `hreflang` and the sitemap, that is how all 50 variants are found.
 */
export const Footer = () => {
  const t = useTranslations()
  const current = useLocale()
  const locale = isLocale(current) ? current : DEFAULT_LOCALE
  const year = new Date().getFullYear()

  const linkClass = 'text-body-sm text-mist transition-colors hover:text-gold-200 text-underline'

  return (
    // A game page is one screen with nothing under it (ModePage marks it `data-game-stage`).
    <footer className='mt-16 border-t border-spot-300/10 bg-studio-950/80 pb-safe backdrop-blur [body:has([data-game-stage])_&]:hidden'>
      <div className='container-wide grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-3'>
            <Emblem className='size-12' />
            <p className='font-display text-h3 font-black text-gold-gradient'>{t('Common.appName')}</p>
          </div>
          <p className='max-w-sm text-body-sm text-mist'>{t('Common.tagline')}</p>
          <div>
            <h2 className='mb-2 text-caption font-bold tracking-[0.2em] text-spot-300 uppercase'>{t('Nav.moreApps')}</h2>
            <ul className='flex flex-wrap gap-x-4 gap-y-1.5'>
              {NETWORK_SITES.map((site) => {
                const { name, href, hrefLang } = networkLink(site, locale)
                return (
                  <li key={site.url}>
                    {/* Another site: a plain anchor, since AppLink would prefix our locale. */}
                    <a href={href} hrefLang={hrefLang} className={linkClass}>
                      {name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <nav aria-label={t('Nav.footer')} className='grid grid-cols-2 gap-x-6 gap-y-2'>
          {[...PRIMARY_NAV, ...SECONDARY_NAV, ...LEGAL_NAV].map(({ labelKey, href }) => (
            <AppLink key={href} href={href} className={linkClass}>
              {t(`Nav.${labelKey}`)}
            </AppLink>
          ))}
          <ConsentSettingsLink className={`cursor-pointer border-0 bg-transparent p-0 text-start font-[inherit] ${linkClass}`} />
        </nav>

        <div>
          <h2 className='mb-3 text-caption font-bold tracking-[0.2em] text-spot-300 uppercase'>{t('Common.language')}</h2>
          <ul className='flex max-h-48 flex-wrap gap-x-3 gap-y-1.5 overflow-y-auto pe-2'>
            {LOCALES.map((locale) => (
              <li key={locale}>
                <AppLink href='/' locale={locale} lang={locale} hrefLang={locale} className='text-caption text-mist-dim hover:text-gold-200'>
                  {LOCALE_LABELS[locale]}
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className='container-wide border-t border-spot-300/10 py-5 text-caption text-mist-dim'>
        {t('Common.copyright', { year, appName: t('Common.appName') })}
      </p>
    </footer>
  )
}
