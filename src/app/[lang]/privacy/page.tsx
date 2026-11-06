import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getFormatter, getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { AD_LOCALES, ADSENSE_ENABLED } from '@constants/ads'
import { LEGAL_UPDATED_AT } from '@constants/legal'
import { ROUTES } from '@constants/routes'
import { PageHeader } from '@components/ui/layout/PageHeader'
import { Prose } from '@components/ui/layout/Prose'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.privacy, title: t('privacyTitle'), description: t('privacyDescription') })
}

const GOOGLE_AD_SETTINGS_URL = 'https://adssettings.google.com'
const GOOGLE_PARTNER_SITES_URL = 'https://policies.google.com/technologies/partner-sites'

const externalLink = (href: string, chunks: ReactNode) => (
  <a href={href} target='_blank' rel='noopener noreferrer'>
    {chunks}
  </a>
)

export default async function PrivacyPage() {
  const [t, format, locale] = await Promise.all([getTranslations('Legal'), getFormatter(), currentLocale()])
  // AdSense's disclosure, where ads can run at all.
  const showsAds = ADSENSE_ENABLED && AD_LOCALES.includes(locale)
  return (
    <>
      <PageHeader title={t('privacyTitle')} subtitle={t('privacyIntro')} />
      <Prose>
        <h2>{t('privacyDataTitle')}</h2>
        <p>{t('privacyDataBody')}</p>
        <h2>{t('privacyUseTitle')}</h2>
        <p>{t('privacyUseBody')}</p>
        <h2>{t('privacyAnalyticsTitle')}</h2>
        <p>{t('privacyAnalyticsBody')}</p>
        {showsAds && (
          <>
            <h2>{t('privacyAdsTitle')}</h2>
            <p>
              {t.rich('privacyAdsBody', {
                settings: (chunks) => externalLink(GOOGLE_AD_SETTINGS_URL, chunks),
                partners: (chunks) => externalLink(GOOGLE_PARTNER_SITES_URL, chunks),
              })}
            </p>
          </>
        )}
        <h2>{t('privacyRightsTitle')}</h2>
        <p>{t('privacyRightsBody')}</p>
        <p className='mt-6 text-caption text-mist-dim'>{t('updated', { date: format.dateTime(LEGAL_UPDATED_AT, { dateStyle: 'long' }) })}</p>
      </Prose>
    </>
  )
}
