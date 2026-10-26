import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { fetchLeaderboardPage } from '@helpers/serverData'
import { breadcrumbSchema, leaderboardSchema } from '@linkedDataSchema/index'
import { LeaderboardTable } from '@components/leaderboard/LeaderboardTable'
import { LeaderboardView } from '@components/leaderboard/LeaderboardView'
import { JsonLd } from '@components/seo/JsonLd'
import { PageHeader } from '@components/ui/layout/PageHeader'

/** The default board (all-time Marathon) is static and refreshed every minute. */
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.leaderboard, title: t('leaderboardTitle'), description: t('leaderboardDescription') })
}

export default async function LeaderboardPage() {
  const [t, locale] = await Promise.all([getTranslations(), currentLocale()])
  const initial = await fetchLeaderboardPage('marathon')

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: t('Nav.home'), path: ROUTES.home },
          { name: t('Leaderboard.title'), path: ROUTES.leaderboard },
        ])}
      />
      {initial && initial.entries.length > 0 && (
        <JsonLd data={leaderboardSchema(`${t('Leaderboard.title')} — ${t('Modes.marathon.name')}`, initial.entries)} />
      )}
      <PageHeader title={t('Leaderboard.title')} subtitle={t('Leaderboard.subtitle')} />
      <div className='container-page pb-16'>
        {/* The fallback is the same table, so crawlers and no-JS readers get the rows too. */}
        <Suspense
          fallback={
            initial?.entries.length ? (
              <LeaderboardTable entries={initial.entries} caption={t('Leaderboard.title')} />
            ) : null
          }
        >
          <LeaderboardView initial={initial} />
        </Suspense>
      </div>
    </>
  )
}
