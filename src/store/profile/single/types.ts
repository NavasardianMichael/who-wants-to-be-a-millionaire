import type { ClassicHistory } from '@api/classic/types'
import type { Profile } from '@interfaces/entities'
import { StateCommonProps } from '@interfaces/store'

export type ProfileState = StateCommonProps & {
  profile: Profile | null
  history: ClassicHistory | null
  isSaving: boolean
  saveError: unknown
}

export type ProfileActions = {
  getProfile: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<boolean>
  uploadAvatar: (file: Blob) => Promise<boolean>
  removeAvatar: () => Promise<boolean>
}
