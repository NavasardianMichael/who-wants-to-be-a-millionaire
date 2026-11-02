import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { SignUpView } from '@components/auth/SignUpView'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.signUp, title: t('signUpTitle'), description: t('signUpDescription'), noIndex: true })
}

/** Not indexed and disallowed in robots.txt, like sign-in. The session resolves on the client. */
export default async function SignUpPage() {
  const t = await getTranslations('Auth')
  return (
    <>
      <PageHeader title={t('signUpTitle')} subtitle={t('signUpSubtitle')} className='items-center text-center' />
      <div className='container-page flex justify-center pb-16'>
        <Card tone='gold' className='w-full max-w-md'>
          <SignUpView />
        </Card>
      </div>
    </>
  )
}
