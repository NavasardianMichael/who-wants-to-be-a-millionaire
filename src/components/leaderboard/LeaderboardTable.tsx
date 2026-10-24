'use client'

import { Table, type TableColumnsType } from 'antd'
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
 * antd's `Table` — a real `<table>` on every screen size, since rows and columns are what a
 * screen reader needs to navigate a ranking. On phones the language and time columns drop
 * out (CSS classes, not antd's `responsive`, so the server HTML already has the final layout).
 * Paging is the caller's, driven by the URL.
 */
export const LeaderboardTable = ({ entries, viewerId, caption }: { entries: LeaderboardEntry[]; viewerId?: string; caption: string }) => {
  const t = useTranslations('Leaderboard')
  const locale = useLocale()
  const number = new Intl.NumberFormat(locale)

  const columns: TableColumnsType<LeaderboardEntry> = [
    {
      key: 'rank',
      title: t('rank'),
      align: 'center',
      width: 72,
      render: (_, entry) => (
        <span
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-control font-display font-black tabular',
            RANK_STYLE[entry.rank] ?? 'text-mist'
          )}
        >
          {entry.rank}
        </span>
      ),
    },
    {
      key: 'player',
      title: t('player'),
      render: (_, entry) => (
        <span className='flex min-w-0 items-center gap-3'>
          <Avatar name={entry.displayName} url={entry.avatarUrl} size='sm' />
          <span className='truncate font-semibold'>
            {entry.displayName}
            {entry.userId === viewerId && <span className='ms-2 text-caption text-gold-300'>({t('yourBest')})</span>}
          </span>
        </span>
      ),
    },
    {
      key: 'language',
      title: t('language'),
      className: 'hidden md:table-cell text-body-sm text-mist',
      render: (_, entry) => (isLocale(entry.locale) ? LOCALE_LABELS[entry.locale] : entry.locale),
    },
    {
      key: 'time',
      title: t('time'),
      align: 'end',
      className: 'hidden sm:table-cell text-body-sm text-mist tabular',
      render: (_, entry) => formatDuration(entry.totalAnswerMs),
    },
    {
      key: 'score',
      title: t('score'),
      align: 'end',
      render: (_, entry) => <span className='font-display text-h3 font-black text-gold-300 tabular'>{number.format(entry.score)}</span>,
    },
  ]

  return (
    <section aria-label={caption} className='panel overflow-hidden'>
      <Table<LeaderboardEntry>
        rowKey='userId'
        columns={columns}
        dataSource={entries}
        pagination={false}
        size='middle'
        onRow={(entry) => (entry.userId === viewerId ? { 'aria-current': 'true' } : {})}
        rowClassName={(entry) => (entry.userId === viewerId ? 'bg-gold-400/10' : '')}
      />
    </section>
  )
}
