import type { Metadata } from 'next'
import { getFormatter, getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { LEGAL_UPDATED_AT } from '@constants/legal'
import { ROUTES } from '@constants/routes'
import { PageHeader } from '@components/ui/layout/PageHeader'
import { Prose } from '@components/ui/layout/Prose'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.terms, title: t('termsTitle'), description: t('termsDescription') })
}

export default async function TermsPage() {
  const [t, format] = await Promise.all([getTranslations('Legal'), getFormatter()])
  return (
    <>
      <PageHeader title={t('termsTitle')} subtitle={t('termsIntro')} />
      <Prose>
        <h2>{t('termsPlayTitle')}</h2>
        <p>{t('termsPlayBody')}</p>
        <h2>{t('termsContentTitle')}</h2>
        <p>{t('termsContentBody')}</p>
        <h2>{t('termsNamesTitle')}</h2>
        <p>{t('termsNamesBody')}</p>
        <p className='mt-6 text-caption text-mist-dim'>{t('updated', { date: format.dateTime(LEGAL_UPDATED_AT, { dateStyle: 'long' }) })}</p>
      </Prose>
    </>
  )
}
