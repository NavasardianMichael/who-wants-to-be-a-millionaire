import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { VerifyEmailForm } from '@components/auth/VerifyEmailForm'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.verifyEmail, title: t('verifyEmailTitle'), description: t('verifyEmailDescription'), noIndex: true })
}

/** The emailed verification link's page. Static: the token is read from the URL on the client. */
export default async function VerifyEmailPage() {
  const t = await getTranslations('Auth')
  return (
    <>
      <PageHeader title={t('verifyTitle')} subtitle={t('verifySubtitle')} className='items-center text-center' />
      <div className='container-page flex justify-center pb-16'>
        <Card tone='gold' className='w-full max-w-md'>
          <VerifyEmailForm />
        </Card>
      </div>
    </>
  )
}
