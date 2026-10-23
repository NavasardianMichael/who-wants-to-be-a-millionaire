'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { useLeaderboardListStore } from '@store/leaderboard/list/store'
import type { LeaderboardListState } from '@store/leaderboard/list/types'
import type { LeaderboardPage } from '@interfaces/entities'
import { isLocale, LOCALE_LABELS, LOCALES } from '@i18n/config'
import { usePathname, useRouter } from '@i18n/navigation'
import { isRankedMode, RANKED_MODES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { cn } from '@helpers/cn'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { SegmentedControl } from '@components/ui/SegmentedControl'
import { LeaderboardTable } from './LeaderboardTable'

type Query = LeaderboardListState['query']

const DEFAULT_QUERY: Query = { mode: 'marathon', period: 'all', page: 1 }

const readQuery = (params: URLSearchParams): Query => {
  const mode = params.get('mode')
  const locale = params.get('locale')
  const page = Number(params.get('page'))
  return {
    mode: isRankedMode(mode) ? mode : 'marathon',
    period: params.get('period') === 'week' ? 'week' : 'all',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    locale: isLocale(locale) ? locale : undefined,
    q: params.get('q')?.slice(0, 40) || undefined,
  }
}

const sameQuery = (a: Query, b: Query) =>
  a.mode === b.mode && a.period === b.period && a.page === b.page && (a.locale ?? '') === (b.locale ?? '') && (a.q ?? '') === (b.q ?? '')

/**
 * The interactive board. The server renders the default view (all-time Marathon, page 1);
 * filters live in the URL, so every view is shareable and the back button works. The
 * canonical URL stays the bare `/leaderboard` — filtered views are not separate pages.
 */
export const LeaderboardView = ({ initial }: { initial: LeaderboardPage | null }) => {
  const t = useTranslations()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore.use.user()
  const data = useLeaderboardListStore.use.data()
  const isPending = useLeaderboardListStore.use.isPending()
  const error = useLeaderboardListStore.use.error()
  const hydrateLeaderboard = useLeaderboardListStore.use.hydrateLeaderboard()
  const getLeaderboard = useLeaderboardListStore.use.getLeaderboard()

  const query = readQuery(new URLSearchParams(params.toString()))
  const [search, setSearch] = useState(query.q ?? '')
  const hydrated = useRef(false)

  // Server rows first; then fetch whenever the URL's query differs from what is shown. A
  // signed-in viewer always refetches once, to get their own row.
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      if (initial && sameQuery(query, DEFAULT_QUERY) && !user) {
        hydrateLeaderboard(initial, DEFAULT_QUERY)
        return
      }
    }
    void getLeaderboard(query)
    // `query` is derived from `params`; the serialized form is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString(), user?.id])

  const navigate = (next: Partial<Query>) => {
    const merged = { ...query, page: 1, ...next }
    const search = new URLSearchParams()
    if (merged.mode !== DEFAULT_QUERY.mode) search.set('mode', merged.mode)
    if (merged.period !== DEFAULT_QUERY.period) search.set('period', merged.period)
    if (merged.locale) search.set('locale', merged.locale)
    if (merged.q) search.set('q', merged.q)
    if (merged.page > 1) search.set('page', String(merged.page))
    const queryString = search.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  // Debounced search.
  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed === (query.q ?? '')) return
    const timer = setTimeout(() => navigate({ q: trimmed || undefined }), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const page = data ?? initial
  const pages = page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1
  const modeName = t(`Modes.${query.mode}.name`)
  const viewerOnPage = page?.viewer && page.entries.some((entry) => entry.userId === page.viewer?.userId)

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <SegmentedControl
          label={t('Leaderboard.mode')}
          value={query.mode}
          onChange={(mode) => navigate({ mode })}
          options={RANKED_MODES.map((mode) => ({ value: mode, label: t(`Modes.${mode}.name`) }))}
        />
        <div className='flex flex-wrap gap-3'>
          <SegmentedControl
            label={t('Leaderboard.allTime')}
            size='sm'
            value={query.period}
            onChange={(period) => navigate({ period })}
            options={[
              { value: 'all', label: t('Leaderboard.allTime') },
              { value: 'week', label: t('Leaderboard.thisWeek') },
            ]}
          />
          <label className='relative'>
            <span className='sr-only'>{t('Common.language')}</span>
            <select
              value={query.locale ?? ''}
              onChange={(event) => navigate({ locale: isLocale(event.target.value) ? event.target.value : undefined })}
              className='h-10 rounded-full border border-spot-300/25 bg-studio-950/70 px-4 text-body-sm text-ivory focus:border-gold-300 focus:outline-none'
            >
              <option value=''>{t('Leaderboard.allLanguages')}</option>
              {LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_LABELS[locale]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className='relative block'>
        <span className='sr-only'>{t('Leaderboard.searchLabel')}</span>
        <Search aria-hidden className='pointer-events-none absolute inset-s-4 top-1/2 size-5 -translate-y-1/2 text-mist' />
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('Leaderboard.searchPlaceholder')}
          maxLength={40}
          className='h-12 w-full rounded-full border border-spot-300/25 bg-studio-950/70 ps-12 pe-4 text-ivory placeholder:text-mist-dim focus:border-gold-300 focus:outline-none'
        />
      </label>

      {page?.viewer && !viewerOnPage && (
        <div className='panel-gold flex items-center justify-between gap-3 px-5 py-3'>
          <span className='font-semibold'>{t('Leaderboard.yourBest')}</span>
          <span className='font-display font-black text-gold-200 tabular'>
            #{page.viewer.rank} · {page.viewer.score}
          </span>
        </div>
      )}

      {Boolean(error) && <ErrorAlert error={error} onRetry={() => void getLeaderboard(query)} />}

      <div className={cn('transition-opacity duration-200', isPending && 'opacity-60')} aria-busy={isPending}>
        {page && page.entries.length > 0 ? (
          <LeaderboardTable entries={page.entries} viewerId={user?.id} caption={`${t('Leaderboard.title')} — ${modeName}`} />
        ) : (
          <div className='panel flex flex-col items-center gap-4 p-10 text-center'>
            <p className='text-mist'>{query.q ? t('Leaderboard.noResults', { query: query.q }) : t('Leaderboard.empty')}</p>
            <ButtonLink href={query.mode === 'marathon' ? ROUTES.marathon : ROUTES.timeAttack}>{t('Leaderboard.playToRank')}</ButtonLink>
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label={t('Leaderboard.pagination', { page: query.page, pages })} className='flex items-center justify-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            disabled={query.page <= 1}
            onClick={() => navigate({ page: query.page - 1 })}
            icon={<ChevronLeft aria-hidden className='size-4 rtl:-scale-x-100' />}
          >
            {t('Leaderboard.previous')}
          </Button>
          <span className='text-body-sm text-mist'>{t('Leaderboard.pagination', { page: query.page, pages })}</span>
          <Button variant='outline' size='sm' disabled={query.page >= pages} onClick={() => navigate({ page: query.page + 1 })}>
            {t('Leaderboard.next')}
            <ChevronRight aria-hidden className='size-4 rtl:-scale-x-100' />
          </Button>
        </nav>
      )}
    </div>
  )
}
