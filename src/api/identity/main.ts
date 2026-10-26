import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { getPublicApiUrl } from '@helpers/url'
import { ENDPOINTS } from './endpoints'
import { processHealthResponse, processLogoutResponse, processMeResponse } from './processors'
import { GetHealthAPI, GetMeAPI, LogoutAPI } from './types'

export const getHealthAPI: GetHealthAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetHealthAPI['response']>>(ENDPOINTS.health)
  return processHealthResponse(data)
}

export const getMeAPI: GetMeAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetMeAPI['response']>>(ENDPOINTS.me)
  return processMeResponse(data)
}

export const logoutAPI: LogoutAPI['api'] = async () => {
  const { data } = await axiosInstance.post<APIResponse<LogoutAPI['response']>>(ENDPOINTS.logout)
  return processLogoutResponse(data)
}

/** Where the Google button navigates; the API sends the browser back to `returnPath`. */
export const googleSignInUrl = (returnPath: string): string =>
  `${getPublicApiUrl()}${ENDPOINTS.googleSignIn}?returnPath=${encodeURIComponent(returnPath)}`
