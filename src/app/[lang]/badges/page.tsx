import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { breadcrumbSchema } from '@linkedDataSchema/index'
import { BadgeCollection } from '@components/badges/BadgeCollection'
import { JsonLd } from '@components/seo/JsonLd'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.badges, title: t('badgesTitle'), description: t('badgesDescription') })
}

export default async function BadgesPage() {
  const [t, locale] = await Promise.all([getTranslations(), currentLocale()])
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: t('Nav.home'), path: ROUTES.home },
          { name: t('Badges.title'), path: ROUTES.badges },
        ])}
      />
      <PageHeader title={t('Badges.title')} />
      <div className='container-page pb-16'>
        <BadgeCollection />
      </div>
    </>
  )
}
