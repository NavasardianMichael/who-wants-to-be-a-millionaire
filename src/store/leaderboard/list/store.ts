import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { getLeaderboardAPI } from '@api/leaderboards/main'
import { appendSelectors } from '@store/appendSelectors'
import { LeaderboardListActions, LeaderboardListState } from './types'

const initialState: LeaderboardListState = {
  query: { mode: 'marathon', period: 'all', page: 1 },
  data: null,
  isPending: false,
  error: null,
}

/** Only the latest request may write: typing in the search box fires several. */
let latestRequest = 0

export const useLeaderboardListStoreBase = create<LeaderboardListState & LeaderboardListActions>()(
  immer(
    combine(
      initialState,
      (set): LeaderboardListActions => ({
        hydrateLeaderboard: (data, query) => {
          set((state) => {
            state.data = data
            state.query = query
          })
        },
        getLeaderboard: async (query) => {
          const request = ++latestRequest
          set((state) => {
            state.query = query
            state.isPending = true
            state.error = null
          })
          try {
            const data = await getLeaderboardAPI(query)
            if (request !== latestRequest) return
            set((state) => {
              state.data = data
            })
          } catch (error) {
            if (request !== latestRequest) return
            set((state) => {
              state.error = error
            })
          } finally {
            if (request === latestRequest) {
              set((state) => {
                state.isPending = false
              })
            }
          }
        },
      })
    )
  )
)

export const useLeaderboardListStore = appendSelectors(useLeaderboardListStoreBase)
