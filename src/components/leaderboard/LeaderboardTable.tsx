import { useLocale, useTranslations } from 'next-intl'
import type { LeaderboardEntry } from '@interfaces/entities'
import { isLocale, LOCALE_LABELS } from '@i18n/config'
import { cn } from '@helpers/cn'
import { Avatar } from '@components/ui/bare/Avatar'

const formatDuration = (ms: number): string => {
  const seconds = Math.round(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes}:${String(seconds % 60).padStart(2, '0')}` : `${seconds}s`
}

const RANK_STYLE: Record<number, string> = {
  1: 'bg-[linear-gradient(180deg,var(--color-gold-200),var(--color-gold-500))] text-studio-950 shadow-glow-gold',
  2: 'bg-[linear-gradient(180deg,var(--color-ivory),var(--color-mist-dim))] text-studio-950',
  3: 'bg-[linear-gradient(180deg,var(--color-lock-300),var(--color-lock-700))] text-studio-950',
}

/**
 * A real `<table>` on every screen size — rows and columns are what a screen reader needs to
 * navigate a ranking. On phones the language and time columns drop out.
 */
export const LeaderboardTable = ({ entries, viewerId, caption }: { entries: LeaderboardEntry[]; viewerId?: string; caption: string }) => {
  const t = useTranslations('Leaderboard')
  const locale = useLocale()

  return (
    <div className='panel overflow-hidden'>
      <table className='w-full border-collapse text-start'>
        <caption className='sr-only'>{caption}</caption>
        <thead>
          <tr className='border-b border-spot-300/15 text-caption tracking-widest text-spot-300 uppercase'>
            <th scope='col' className='w-16 px-3 py-3 text-center font-bold'>
              {t('rank')}
            </th>
            <th scope='col' className='px-3 py-3 text-start font-bold'>
              {t('player')}
            </th>
            <th scope='col' className='hidden px-3 py-3 text-start font-bold md:table-cell'>
              {t('language')}
            </th>
            <th scope='col' className='hidden px-3 py-3 text-end font-bold sm:table-cell'>
              {t('time')}
            </th>
            <th scope='col' className='px-4 py-3 text-end font-bold'>
              {t('score')}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isViewer = entry.userId === viewerId
            return (
              <tr
                key={entry.userId}
                aria-current={isViewer ? 'true' : undefined}
                className={cn('border-b border-spot-300/5 last:border-0', isViewer ? 'bg-gold-400/10' : 'hover:bg-white/[0.03]')}
              >
                <td className='px-3 py-2.5 text-center'>
                  <span
                    className={cn(
                      'inline-flex size-9 items-center justify-center rounded-full font-display font-black tabular',
                      RANK_STYLE[entry.rank] ?? 'text-mist'
                    )}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className='px-3 py-2.5'>
                  <span className='flex min-w-0 items-center gap-3'>
                    <Avatar name={entry.displayName} url={entry.avatarUrl} size='sm' />
                    <span className='truncate font-semibold'>
                      {entry.displayName}
                      {isViewer && <span className='ms-2 text-caption text-gold-300'>({t('yourBest')})</span>}
                    </span>
                  </span>
                </td>
                <td className='hidden px-3 py-2.5 text-body-sm text-mist md:table-cell'>
                  {isLocale(entry.locale) ? LOCALE_LABELS[entry.locale] : entry.locale}
                </td>
                <td className='hidden px-3 py-2.5 text-end text-body-sm text-mist tabular sm:table-cell'>
                  {formatDuration(entry.totalAnswerMs)}
                </td>
                <td className='px-4 py-2.5 text-end font-display text-h3 font-black text-gold-300 tabular'>
                  {new Intl.NumberFormat(locale).format(entry.score)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
