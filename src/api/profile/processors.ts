import { unwrapValue } from '@api/unwrap'
import { GetProfileAPI, RemoveAvatarAPI, UpdateProfileAPI, UploadAvatarAPI } from './types'

export const processProfileResponse: GetProfileAPI['processor'] = unwrapValue
export const processUpdateProfileResponse: UpdateProfileAPI['processor'] = unwrapValue
export const processUploadAvatarResponse: UploadAvatarAPI['processor'] = unwrapValue
export const processRemoveAvatarResponse: RemoveAvatarAPI['processor'] = unwrapValue
