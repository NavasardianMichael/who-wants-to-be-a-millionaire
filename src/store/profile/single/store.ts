import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { getClassicHistoryAPI } from '@api/classic/main'
import { getProfileAPI, removeAvatarAPI, updateProfileAPI, uploadAvatarAPI } from '@api/profile/main'
import { appendSelectors } from '@store/appendSelectors'
import { useAuthStoreBase } from '@store/auth/store'
import type { SessionUser } from '@interfaces/entities'
import { ProfileActions, ProfileState } from './types'

const initialState: ProfileState = {
  profile: null,
  history: null,
  isPending: false,
  error: null,
  isSaving: false,
  saveError: null,
}

export const useProfileStoreBase = create<ProfileState & ProfileActions>()(
  immer(
    combine(initialState, (set): ProfileActions => {
      /** A write that returns the updated user keeps the header (auth store) in step too. */
      const save = async (request: () => Promise<SessionUser>): Promise<boolean> => {
        set((state) => {
          state.isSaving = true
          state.saveError = null
        })
        try {
          const user = await request()
          useAuthStoreBase.getState().setUser(user)
          set((state) => {
            if (state.profile) state.profile.user = user
          })
          return true
        } catch (error) {
          set((state) => {
            state.saveError = error
          })
          return false
        } finally {
          set((state) => {
            state.isSaving = false
          })
        }
      }

      return {
        getProfile: async () => {
          set((state) => {
            state.isPending = true
            state.error = null
          })
          try {
            const [profile, history] = await Promise.all([getProfileAPI(), getClassicHistoryAPI()])
            set((state) => {
              state.profile = profile
              state.history = history
            })
          } catch (error) {
            set((state) => {
              state.error = error
            })
          } finally {
            set((state) => {
              state.isPending = false
            })
          }
        },
        updateDisplayName: (displayName) => save(() => updateProfileAPI({ displayName })),
        uploadAvatar: (file) => save(() => uploadAvatarAPI({ file })),
        removeAvatar: () => save(() => removeAvatarAPI()),
      }
    })
  )
)

export const useProfileStore = appendSelectors(useProfileStoreBase)
