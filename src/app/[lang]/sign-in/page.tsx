import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { SignInView } from '@components/auth/SignInView'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.signIn, title: t('signInTitle'), description: t('signInDescription'), noIndex: true })
}

/** Not indexed (nothing to find here) and disallowed in robots.txt. The session resolves on the client. */
export default async function SignInPage() {
  const t = await getTranslations('Auth')
  return (
    <>
      <PageHeader title={t('signInTitle')} subtitle={t('signInSubtitle')} className='items-center text-center' />
      <div className='container-page flex justify-center pb-16'>
        <Card tone='gold' className='w-full max-w-md'>
          <SignInView />
        </Card>
      </div>
    </>
  )
}
