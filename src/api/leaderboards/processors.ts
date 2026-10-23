import { unwrapValue } from '@api/unwrap'
import { GetLeaderboardAPI } from './types'

export const processLeaderboardResponse: GetLeaderboardAPI['processor'] = unwrapValue
