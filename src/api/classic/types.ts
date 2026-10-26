import { Endpoint } from '@interfaces/api'
import { ClassicResult } from '@interfaces/entities'

export type SyncClassicResult = { stored: number; acceptedClientIds: string[] }

export type SyncClassicAPI = Endpoint<{
  payload: { games: ClassicResult[] }
  response: SyncClassicResult
  processed: SyncClassicResult
}>

export type ClassicHistory = { recent: ClassicResult[]; best: ClassicResult | null }

export type GetClassicHistoryAPI = Endpoint<{ payload: void; response: ClassicHistory; processed: ClassicHistory }>
