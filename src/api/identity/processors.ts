import { unwrapValue } from '@api/unwrap'
import { GetHealthAPI, GetMeAPI, LogoutAPI } from './types'

export const processHealthResponse: GetHealthAPI['processor'] = unwrapValue
export const processMeResponse: GetMeAPI['processor'] = unwrapValue
export const processLogoutResponse: LogoutAPI['processor'] = unwrapValue
