import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import { processSendContactMessageResponse } from './processors'
import { SendContactMessageAPI } from './types'

export const sendContactMessageAPI: SendContactMessageAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<SendContactMessageAPI['response']>>(ENDPOINTS.send, payload)
  return processSendContactMessageResponse(data)
}
