'use client'

import { useEffect, useRef, useState } from 'react'
import { Empty, Input, Pagination, Select } from 'antd'
import { Search } from 'lucide-react'
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
            value={query.period}
            onChange={(period) => navigate({ period })}
            options={[
              { value: 'all', label: t('Leaderboard.allTime') },
              { value: 'week', label: t('Leaderboard.thisWeek') },
            ]}
          />
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            aria-label={t('Common.language')}
            value={query.locale ?? ''}
            onChange={(value: string) => navigate({ locale: isLocale(value) ? value : undefined })}
            options={[
              { value: '', label: t('Leaderboard.allLanguages') },
              ...LOCALES.map((locale) => ({ value: locale, label: LOCALE_LABELS[locale] })),
            ]}
            popupMatchSelectWidth={false}
            className='min-w-48'
          />
        </div>
      </div>

      <Input
        type='search'
        size='large'
        allowClear
        aria-label={t('Leaderboard.searchLabel')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('Leaderboard.searchPlaceholder')}
        maxLength={40}
        prefix={<Search aria-hidden className='size-5 text-mist' />}
      />

      {page?.viewer && !viewerOnPage && (
        <div className='panel-gold flex items-center justify-between gap-3 px-5 py-3' aria-live='polite'>
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
          <div className='panel p-10'>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className='text-mist'>{query.q ? t('Leaderboard.noResults', { query: query.q }) : t('Leaderboard.empty')}</span>}
            >
              <ButtonLink href={query.mode === 'marathon' ? ROUTES.marathon : ROUTES.timeAttack}>{t('Leaderboard.playToRank')}</ButtonLink>
            </Empty>
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label={t('Leaderboard.pagination', { page: query.page, pages })} className='flex justify-center'>
          <Pagination
            current={query.page}
            total={page?.total ?? 0}
            pageSize={page?.pageSize ?? 1}
            showSizeChanger={false}
            onChange={(next) => navigate({ page: next })}
          />
        </nav>
      )}
    </div>
  )
}
