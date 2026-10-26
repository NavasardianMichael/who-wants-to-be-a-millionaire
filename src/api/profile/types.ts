import { Endpoint } from '@interfaces/api'
import { Profile, SessionUser } from '@interfaces/entities'

export type GetProfileAPI = Endpoint<{ payload: void; response: Profile; processed: Profile }>

export type UpdateProfileAPI = Endpoint<{
  payload: Partial<Pick<SessionUser, 'displayName' | 'locale'>>
  response: SessionUser
  processed: SessionUser
}>

export type UploadAvatarAPI = Endpoint<{ payload: { file: Blob }; response: SessionUser; processed: SessionUser }>

export type RemoveAvatarAPI = Endpoint<{ payload: void; response: SessionUser; processed: SessionUser }>
