import { getLeaderboardAPI } from '@api/leaderboards/main'
import { getCategorySamplesAPI } from '@api/questions/main'
import type { SampleQuestion } from '@api/questions/types'
import type { LeaderboardEntry, LeaderboardPage } from '@interfaces/entities'
import type { Category, RankedMode } from '@constants/game'

/**
 * Data that server-rendered pages embed for crawlers and first paint. Every read degrades to
 * empty: a static page must still build when the API is down (as during `next build` in CI),
 * and ISR fills it in on the next revalidation.
 */
export const fetchTopRuns = async (mode: RankedMode, limit: number, locale?: string): Promise<LeaderboardEntry[]> => {
  try {
    const page = await getLeaderboardAPI({ mode, locale })
    return page.entries.slice(0, limit)
  } catch {
    return []
  }
}

export const fetchLeaderboardPage = async (mode: RankedMode): Promise<LeaderboardPage | null> => {
  try {
    return await getLeaderboardAPI({ mode })
  } catch {
    return null
  }
}

export const fetchCategorySamples = async (locale: string, category: Category): Promise<SampleQuestion[]> => {
  try {
    return await getCategorySamplesAPI({ locale, category })
  } catch {
    return []
  }
}
