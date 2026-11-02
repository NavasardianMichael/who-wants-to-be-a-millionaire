import type { LoginPayload, RegisterPayload, RegisterResult } from '@api/identity/types'
import type { SessionUser } from '@interfaces/entities'
import { StateCommonProps } from '@interfaces/store'

export type AuthState = StateCommonProps & {
  user: SessionUser | null
  /** True once `/identity/me` has answered either way — until then, render neither "signed in" nor "signed out". */
  isResolved: boolean
  /** From `/health`: whether the API can offer Google sign-in at all. */
  googleAvailable: boolean
}

export type AuthActions = {
  setAuthState: (payload: Partial<AuthState>) => void
  setUser: (user: SessionUser | null) => void
  resolveSession: () => Promise<void>
  /** Rejects with the API's error, for the form to explain. */
  login: (payload: LoginPayload) => Promise<SessionUser>
  /** No session yet: resolves with where the verification link went. */
  register: (payload: RegisterPayload) => Promise<RegisterResult>
  logout: () => Promise<void>
}
