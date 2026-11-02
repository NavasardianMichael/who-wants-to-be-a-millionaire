import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { ResetPasswordForm } from '@components/auth/ResetPasswordForm'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.resetPassword, title: t('resetPasswordTitle'), description: t('resetPasswordDescription'), noIndex: true })
}

/** The emailed reset link's page. Static: the token is read from the URL on the client. */
export default async function ResetPasswordPage() {
  const t = await getTranslations('Auth')
  return (
    <>
      <PageHeader title={t('resetTitle')} subtitle={t('resetSubtitle')} className='items-center text-center' />
      <div className='container-page flex justify-center pb-16'>
        <Card tone='gold' className='w-full max-w-md'>
          <ResetPasswordForm />
        </Card>
      </div>
    </>
  )
}
