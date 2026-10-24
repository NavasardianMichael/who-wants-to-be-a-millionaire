import { unwrapValue } from '@api/unwrap'
import { SendContactMessageAPI } from './types'

export const processSendContactMessageResponse: SendContactMessageAPI['processor'] = unwrapValue
