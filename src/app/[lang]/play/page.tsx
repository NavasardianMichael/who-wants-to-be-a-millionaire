import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { LADDER } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { formatMoney } from '@helpers/money'
import { ModePage } from '@components/marketing/ModePage'

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations('Seo'), currentLocale()])
  return pageMetadata({
    path: ROUTES.play,
    title: t('playTitle'),
    description: t('playDescription', { first: formatMoney(LADDER[0], locale), top: formatMoney(LADDER[LADDER.length - 1], locale) }),
  })
}

export default async function PlayPage() {
  return <ModePage mode='classic' />
}
