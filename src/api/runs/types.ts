import { Endpoint } from '@interfaces/api'
import { RunAnswerResult, RunLifelineResult, RunView } from '@interfaces/entities'
import type { Lifeline, RankedMode } from '@constants/game'

export type StartRunAPI = Endpoint<{ payload: { mode: RankedMode; locale: string }; response: RunView; processed: RunView }>

export type GetRunAPI = Endpoint<{ payload: { id: string }; response: RunView; processed: RunView }>

export type AnswerRunAPI = Endpoint<{
  payload: { id: string; questionId: string; index: number | null }
  response: RunAnswerResult
  processed: RunAnswerResult
}>

export type RunLifelineAPI = Endpoint<{
  payload: { id: string; lifeline: Lifeline }
  response: RunLifelineResult
  processed: RunLifelineResult
}>
