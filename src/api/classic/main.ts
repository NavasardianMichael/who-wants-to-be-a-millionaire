import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import { processClassicHistoryResponse, processSyncClassicResponse } from './processors'
import { GetClassicHistoryAPI, SyncClassicAPI } from './types'

export const syncClassicAPI: SyncClassicAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<SyncClassicAPI['response']>>(ENDPOINTS.sync, payload)
  return processSyncClassicResponse(data)
}

export const getClassicHistoryAPI: GetClassicHistoryAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetClassicHistoryAPI['response']>>(ENDPOINTS.history)
  return processClassicHistoryResponse(data)
}
