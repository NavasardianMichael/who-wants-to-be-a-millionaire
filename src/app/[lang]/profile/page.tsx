import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { ProfileView } from '@components/profile/ProfileView'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.profile, title: t('profileTitle'), description: t('profileDescription'), noIndex: true })
}

/** Personal, so `noindex` and disallowed in robots.txt. The shell is static; the data loads on the client. */
export default async function ProfilePage() {
  const t = await getTranslations('Profile')
  return (
    <>
      <PageHeader title={t('title')} />
      <div className='container-page pb-16'>
        <ProfileView />
      </div>
    </>
  )
}
