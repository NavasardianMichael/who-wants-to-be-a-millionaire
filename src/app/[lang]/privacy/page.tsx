import type { Metadata } from 'next'
import { getFormatter, getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { LEGAL_UPDATED_AT } from '@constants/legal'
import { ROUTES } from '@constants/routes'
import { PageHeader } from '@components/ui/layout/PageHeader'
import { Prose } from '@components/ui/layout/Prose'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.privacy, title: t('privacyTitle'), description: t('privacyDescription') })
}

export default async function PrivacyPage() {
  const [t, format] = await Promise.all([getTranslations('Legal'), getFormatter()])
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
        <h2>{t('privacyRightsTitle')}</h2>
        <p>{t('privacyRightsBody')}</p>
        <p className='mt-6 text-caption text-mist-dim'>{t('updated', { date: format.dateTime(LEGAL_UPDATED_AT, { dateStyle: 'long' }) })}</p>
      </Prose>
    </>
  )
}
