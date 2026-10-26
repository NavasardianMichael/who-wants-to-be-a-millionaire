import { Endpoint } from '@interfaces/api'
import { EarnedBadge } from '@interfaces/entities'
import type { BadgeId } from '@constants/game'

export type GetMyBadgesAPI = Endpoint<{ payload: void; response: EarnedBadge[]; processed: EarnedBadge[] }>

export type SyncBadgesResult = { awarded: BadgeId[]; badges: EarnedBadge[] }

export type SyncBadgesAPI = Endpoint<{
  payload: { badgeIds: BadgeId[] }
  response: SyncBadgesResult
  processed: SyncBadgesResult
}>
