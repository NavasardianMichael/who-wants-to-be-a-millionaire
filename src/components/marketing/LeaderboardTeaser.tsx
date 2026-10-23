import { getTranslations } from 'next-intl/server'
import type { RankedMode } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { cn } from '@helpers/cn'
import { fetchTopRuns } from '@helpers/serverData'
import { AppLink } from '@components/ui/bare/AppLink'
import { Avatar } from '@components/ui/bare/Avatar'

const MEDAL = ['text-gold-200', 'text-mist', 'text-lock-300']

/** Top players of one mode, rendered on the server (the page revalidates every few minutes). */
export const LeaderboardTeaser = async ({ mode, limit = 5 }: { mode: RankedMode; limit?: number }) => {
  const [t, entries] = await Promise.all([getTranslations(), fetchTopRuns(mode, limit)])

  return (
    <div className='panel flex flex-col gap-3 p-5'>
      <h3 className='font-display text-h3 font-extrabold text-gold-200'>{t(`Modes.${mode}.name`)}</h3>
      {entries.length ? (
        <ol className='flex flex-col gap-1'>
          {entries.map((entry) => (
            <li key={entry.userId} className='flex items-center gap-3 rounded-xl px-2 py-1.5'>
              <span className={cn('w-6 text-center font-display font-black tabular', MEDAL[entry.rank - 1] ?? 'text-mist-dim')}>
                {entry.rank}
              </span>
              <Avatar name={entry.displayName} url={entry.avatarUrl} size='sm' />
              <span className='min-w-0 flex-1 truncate font-semibold'>{entry.displayName}</span>
              <span className='font-display font-black text-gold-300 tabular'>{entry.score}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className='text-body-sm text-mist'>{t('Home.emptyLeaderboard')}</p>
      )}
      <AppLink href={{ pathname: ROUTES.leaderboard, query: { mode } }} className='mt-auto text-body-sm font-semibold text-spot-300 hover:text-gold-200'>
        {t('Home.viewLeaderboard')}
      </AppLink>
    </div>
  )
}
