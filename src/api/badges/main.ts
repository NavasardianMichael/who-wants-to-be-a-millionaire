import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import { processMyBadgesResponse, processSyncBadgesResponse } from './processors'
import { GetMyBadgesAPI, SyncBadgesAPI } from './types'

export const getMyBadgesAPI: GetMyBadgesAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetMyBadgesAPI['response']>>(ENDPOINTS.mine)
  return processMyBadgesResponse(data)
}

export const syncBadgesAPI: SyncBadgesAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<SyncBadgesAPI['response']>>(ENDPOINTS.sync, payload)
  return processSyncBadgesResponse(data)
}
