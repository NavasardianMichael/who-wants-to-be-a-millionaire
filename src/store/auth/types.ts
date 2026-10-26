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
  logout: () => Promise<void>
}
