import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { ForgotPasswordForm } from '@components/auth/ForgotPasswordForm'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.forgotPassword, title: t('forgotPasswordTitle'), description: t('forgotPasswordDescription'), noIndex: true })
}

/** Linked from sign-in and from the "password changed" email. */
export default async function ForgotPasswordPage() {
  const t = await getTranslations('Auth')
  return (
    <>
      <PageHeader title={t('forgotTitle')} subtitle={t('forgotSubtitle')} className='items-center text-center' />
      <div className='container-page flex justify-center pb-16'>
        <Card tone='gold' className='w-full max-w-md'>
          <ForgotPasswordForm />
        </Card>
      </div>
    </>
  )
}
