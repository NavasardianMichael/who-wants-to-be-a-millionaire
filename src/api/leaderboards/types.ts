import { Endpoint } from '@interfaces/api'
import { LeaderboardPage } from '@interfaces/entities'
import type { RankedMode } from '@constants/game'

export type LeaderboardPeriod = 'all' | 'week'

export type LeaderboardQuery = {
  mode: RankedMode
  locale?: string
  q?: string
  period?: LeaderboardPeriod
  page?: number
}

export type GetLeaderboardAPI = Endpoint<{ payload: LeaderboardQuery; response: LeaderboardPage; processed: LeaderboardPage }>
