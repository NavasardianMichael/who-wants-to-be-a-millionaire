import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { ModePage } from '@components/marketing/ModePage'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  const seconds = TIME_ATTACK_RULES.durationSeconds
  return pageMetadata({
    path: ROUTES.timeAttack,
    title: t('timeAttackTitle', { seconds }),
    description: t('timeAttackDescription', { seconds }),
  })
}

export default async function TimeAttackPage() {
  return <ModePage mode='timeAttack' />
}
