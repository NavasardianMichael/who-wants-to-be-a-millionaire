import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import { processLeaderboardResponse } from './processors'
import { GetLeaderboardAPI } from './types'

export const getLeaderboardAPI: GetLeaderboardAPI['api'] = async (query) => {
  const { data } = await axiosInstance.get<APIResponse<GetLeaderboardAPI['response']>>(ENDPOINTS.leaderboards, {
    params: { ...query, locale: query.locale || undefined, q: query.q || undefined },
  })
  return processLeaderboardResponse(data)
}
