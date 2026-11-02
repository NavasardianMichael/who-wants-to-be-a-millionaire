import { unwrapValue } from '@api/unwrap'
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

export const processHealthResponse: GetHealthAPI['processor'] = unwrapValue
export const processMeResponse: GetMeAPI['processor'] = unwrapValue
export const processLogoutResponse: LogoutAPI['processor'] = unwrapValue
export const processRegisterResponse: RegisterAPI['processor'] = unwrapValue
export const processLoginResponse: LoginAPI['processor'] = unwrapValue
export const processResendVerificationResponse: ResendVerificationAPI['processor'] = unwrapValue
export const processVerifyEmailResponse: VerifyEmailAPI['processor'] = unwrapValue
export const processForgotPasswordResponse: ForgotPasswordAPI['processor'] = unwrapValue
export const processResetPasswordResponse: ResetPasswordAPI['processor'] = unwrapValue
export const processSendPasswordLinkResponse: SendPasswordLinkAPI['processor'] = unwrapValue
