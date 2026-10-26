import { unwrapValue } from '@api/unwrap'
import { GetMyBadgesAPI, SyncBadgesAPI } from './types'

export const processMyBadgesResponse: GetMyBadgesAPI['processor'] = unwrapValue
export const processSyncBadgesResponse: SyncBadgesAPI['processor'] = unwrapValue
