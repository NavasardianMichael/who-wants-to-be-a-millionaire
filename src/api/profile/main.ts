import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import {
  processProfileResponse,
  processRemoveAvatarResponse,
  processUpdateProfileResponse,
  processUploadAvatarResponse,
} from './processors'
import { GetProfileAPI, RemoveAvatarAPI, UpdateProfileAPI, UploadAvatarAPI } from './types'

export const getProfileAPI: GetProfileAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetProfileAPI['response']>>(ENDPOINTS.profile)
  return processProfileResponse(data)
}

export const updateProfileAPI: UpdateProfileAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.patch<APIResponse<UpdateProfileAPI['response']>>(ENDPOINTS.profile, payload)
  return processUpdateProfileResponse(data)
}

export const uploadAvatarAPI: UploadAvatarAPI['api'] = async ({ file }) => {
  const form = new FormData()
  form.append('avatar', file)
  const { data } = await axiosInstance.post<APIResponse<UploadAvatarAPI['response']>>(ENDPOINTS.avatar, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return processUploadAvatarResponse(data)
}

export const removeAvatarAPI: RemoveAvatarAPI['api'] = async () => {
  const { data } = await axiosInstance.delete<APIResponse<RemoveAvatarAPI['response']>>(ENDPOINTS.avatar)
  return processRemoveAvatarResponse(data)
}
