import { useTranslations } from 'next-intl'
import { LOCALE_LABELS, LOCALES } from '@i18n/config'
import { APP_NAME } from '@constants/app'
import { LEGAL_NAV, PRIMARY_NAV, SECONDARY_NAV } from '@constants/navigation'
import { Emblem } from '@components/brand/Emblem'
import { AppLink } from '@components/ui/bare/AppLink'

/**
 * Server-rendered, so every link is crawlable. The language list links each locale's home
 * page — together with `hreflang` and the sitemap, that is how all 50 variants are found.
 */
export const Footer = () => {
  const t = useTranslations()
  const year = new Date().getFullYear()

  const linkClass = 'text-body-sm text-mist transition-colors hover:text-gold-200'

  return (
    <footer className='mt-16 border-t border-spot-300/10 bg-studio-950/80 pb-safe backdrop-blur'>
      <div className='container-page grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-3'>
            <Emblem className='size-12' />
            <p className='font-display text-h3 font-black text-gold-gradient'>{APP_NAME}</p>
          </div>
          <p className='max-w-sm text-body-sm text-mist'>{t('Common.tagline')}</p>
        </div>

        <nav aria-label={t('Nav.footer')} className='grid grid-cols-2 gap-x-6 gap-y-2'>
          {[...PRIMARY_NAV, ...SECONDARY_NAV, ...LEGAL_NAV].map(({ labelKey, href }) => (
            <AppLink key={href} href={href} className={linkClass}>
              {t(`Nav.${labelKey}`)}
            </AppLink>
          ))}
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
      <p className='container-page border-t border-spot-300/10 py-5 text-caption text-mist-dim'>
        {t('Common.copyright', { year, appName: APP_NAME })}
      </p>
    </footer>
  )
}
