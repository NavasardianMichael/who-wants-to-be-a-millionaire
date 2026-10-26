import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import { processPhoneAFriendResponse } from './processors'
import { PhoneAFriendAPI } from './types'

export const phoneAFriendAPI: PhoneAFriendAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<PhoneAFriendAPI['response']>>(ENDPOINTS.phoneAFriend, payload, {
    timeout: 20_000,
  })
  return processPhoneAFriendResponse(data)
}
