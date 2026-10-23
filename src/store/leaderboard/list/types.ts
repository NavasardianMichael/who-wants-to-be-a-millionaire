import type { LeaderboardQuery } from '@api/leaderboards/types'
import type { LeaderboardPage } from '@interfaces/entities'
import { StateCommonProps } from '@interfaces/store'

export type LeaderboardListState = StateCommonProps & {
  query: Required<Pick<LeaderboardQuery, 'mode' | 'period' | 'page'>> & Pick<LeaderboardQuery, 'locale' | 'q'>
  data: LeaderboardPage | null
}

export type LeaderboardListActions = {
  /** Seeds the store with the server-rendered first page, so hydration shows the same rows. */
  hydrateLeaderboard: (data: LeaderboardPage, query: LeaderboardListState['query']) => void
  getLeaderboard: (query: LeaderboardListState['query']) => Promise<void>
}
