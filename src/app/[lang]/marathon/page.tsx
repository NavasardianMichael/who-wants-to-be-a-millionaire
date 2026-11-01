import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { ModePage } from '@components/marketing/ModePage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.marathon, title: t('marathonTitle'), description: t('marathonDescription') })
}

export default async function MarathonPage() {
  return <ModePage mode='marathon' />
}
