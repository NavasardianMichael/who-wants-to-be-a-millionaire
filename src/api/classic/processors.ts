import { unwrapValue } from '@api/unwrap'
import { GetClassicHistoryAPI, SyncClassicAPI } from './types'

export const processSyncClassicResponse: SyncClassicAPI['processor'] = unwrapValue
export const processClassicHistoryResponse: GetClassicHistoryAPI['processor'] = unwrapValue
