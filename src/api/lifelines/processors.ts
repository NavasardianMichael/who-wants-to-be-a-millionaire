import { unwrapValue } from '@api/unwrap'
import { PhoneAFriendAPI } from './types'

export const processPhoneAFriendResponse: PhoneAFriendAPI['processor'] = unwrapValue
