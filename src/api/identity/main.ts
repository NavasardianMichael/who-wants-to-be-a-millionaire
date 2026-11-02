import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { getPublicApiUrl } from '@helpers/url'
import { ENDPOINTS } from './endpoints'
import {
  processForgotPasswordResponse,
  processHealthResponse,
  processLoginResponse,
  processLogoutResponse,
  processMeResponse,
  processRegisterResponse,
  processResendVerificationResponse,
  processResetPasswordResponse,
  processSendPasswordLinkResponse,
  processVerifyEmailResponse,
} from './processors'
import {
  ForgotPasswordAPI,
  GetHealthAPI,
  GetMeAPI,
  LoginAPI,
  LogoutAPI,
  RegisterAPI,
  ResendVerificationAPI,
  ResetPasswordAPI,
  SendPasswordLinkAPI,
  VerifyEmailAPI,
} from './types'

export const getHealthAPI: GetHealthAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetHealthAPI['response']>>(ENDPOINTS.health)
  return processHealthResponse(data)
}

export const getMeAPI: GetMeAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<GetMeAPI['response']>>(ENDPOINTS.me)
  return processMeResponse(data)
}

export const logoutAPI: LogoutAPI['api'] = async () => {
  const { data } = await axiosInstance.post<APIResponse<LogoutAPI['response']>>(ENDPOINTS.logout)
  return processLogoutResponse(data)
}

/** Creates the account inactive; the emailed link activates it. */
export const registerAPI: RegisterAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<RegisterAPI['response']>>(ENDPOINTS.register, payload)
  return processRegisterResponse(data)
}

export const loginAPI: LoginAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<LoginAPI['response']>>(ENDPOINTS.login, payload)
  return processLoginResponse(data)
}

export const resendVerificationAPI: ResendVerificationAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<ResendVerificationAPI['response']>>(
    ENDPOINTS.resendVerification,
    payload
  )
  return processResendVerificationResponse(data)
}

/** Activates the account; signs nobody in. */
export const verifyEmailAPI: VerifyEmailAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<VerifyEmailAPI['response']>>(ENDPOINTS.verifyEmail, payload)
  return processVerifyEmailResponse(data)
}

export const forgotPasswordAPI: ForgotPasswordAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<ForgotPasswordAPI['response']>>(ENDPOINTS.forgotPassword, payload)
  return processForgotPasswordResponse(data)
}

/** Sets the new password and signs this browser in; every other session ends. */
export const resetPasswordAPI: ResetPasswordAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<ResetPasswordAPI['response']>>(ENDPOINTS.resetPassword, payload)
  return processResetPasswordResponse(data)
}

/** Mails the signed-in account a link to set or change its password. */
export const sendPasswordLinkAPI: SendPasswordLinkAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<SendPasswordLinkAPI['response']>>(ENDPOINTS.passwordLink, payload)
  return processSendPasswordLinkResponse(data)
}

/** Where the Google button navigates; the API sends the browser back to `returnPath`. */
export const googleSignInUrl = (returnPath: string): string =>
  `${getPublicApiUrl()}${ENDPOINTS.googleSignIn}?returnPath=${encodeURIComponent(returnPath)}`
