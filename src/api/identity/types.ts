import { Endpoint } from '@interfaces/api'
import { HealthStatus, SessionUser } from '@interfaces/entities'

export type GetHealthAPI = Endpoint<{ payload: void; response: HealthStatus; processed: HealthStatus }>

/** `null` for a guest. */
export type GetMeAPI = Endpoint<{ payload: void; response: SessionUser | null; processed: SessionUser | null }>

export type LogoutAPI = Endpoint<{ payload: void; response: boolean; processed: boolean }>

/** `locale` is the language of the verification email, and of the account. */
export type RegisterPayload = { displayName: string; email: string; password: string; locale: string }
/** No session yet: the account waits for its emailed link. `email` is where that link went. */
export type RegisterResult = { email: string }
export type RegisterAPI = Endpoint<{ payload: RegisterPayload; response: RegisterResult; processed: RegisterResult }>

export type LoginPayload = { email: string; password: string }
export type LoginAPI = Endpoint<{ payload: LoginPayload; response: SessionUser; processed: SessionUser }>

/** `locale` picks the email's language; the account's own is the fallback. */
export type EmailPayload = { email: string; locale: string }
export type ResendVerificationAPI = Endpoint<{ payload: EmailPayload; response: boolean; processed: boolean }>
export type ForgotPasswordAPI = Endpoint<{ payload: EmailPayload; response: boolean; processed: boolean }>

export type VerifyEmailResult = { email: string }
export type VerifyEmailAPI = Endpoint<{ payload: { token: string }; response: VerifyEmailResult; processed: VerifyEmailResult }>

export type ResetPasswordPayload = { token: string; password: string; locale: string }
export type ResetPasswordAPI = Endpoint<{ payload: ResetPasswordPayload; response: SessionUser; processed: SessionUser }>

export type SendPasswordLinkAPI = Endpoint<{ payload: { locale: string }; response: boolean; processed: boolean }>
