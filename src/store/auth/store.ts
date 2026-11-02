import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { getHealthAPI, getMeAPI, loginAPI, logoutAPI, registerAPI } from '@api/identity/main'
import { appendSelectors } from '@store/appendSelectors'
import { trackEvent } from '@helpers/analytics'
import { reportError } from '@helpers/reportError'
import { AuthActions, AuthState } from './types'

const initialState: AuthState = {
  user: null,
  isResolved: false,
  googleAvailable: false,
  isPending: false,
  error: null,
}

export const useAuthStoreBase = create<AuthState & AuthActions>()(
  immer(
    combine(
      initialState,
      (set): AuthActions => ({
        setAuthState: (payload) => {
          set((state) => ({ ...state, ...payload }))
        },
        setUser: (user) => {
          set((state) => {
            state.user = user
          })
        },
        /** Health and session in parallel; a 401 from `/me` simply means "guest". */
        resolveSession: async () => {
          set((state) => {
            state.isPending = true
          })
          try {
            const [health, user] = await Promise.allSettled([getHealthAPI(), getMeAPI()])
            set((state) => {
              state.googleAvailable = health.status === 'fulfilled' && health.value.google
              state.user = user.status === 'fulfilled' ? user.value : null
            })
          } finally {
            set((state) => {
              state.isPending = false
              state.isResolved = true
            })
          }
        },
        login: async (payload) => {
          set((state) => {
            state.isPending = true
          })
          try {
            const user = await loginAPI(payload)
            set((state) => {
              state.user = user
            })
            trackEvent('login', { method: 'password' })
            return user
          } finally {
            set((state) => {
              state.isPending = false
            })
          }
        },
        register: async (payload) => {
          set((state) => {
            state.isPending = true
          })
          try {
            const result = await registerAPI(payload)
            trackEvent('sign_up', { method: 'password' })
            return result
          } finally {
            set((state) => {
              state.isPending = false
            })
          }
        },
        logout: async () => {
          try {
            await logoutAPI()
          } catch (error) {
            reportError(error, 'auth:logout', { silent: true })
          }
          set((state) => {
            state.user = null
          })
        },
      })
    )
  )
)

export const useAuthStore = appendSelectors(useAuthStoreBase)
