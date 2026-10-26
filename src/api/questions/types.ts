import { Endpoint } from '@interfaces/api'
import { OfflinePack, Question } from '@interfaces/entities'
import type { Category, Level } from '@constants/game'

export type GetQuestionBatchAPI = Endpoint<{
  payload: {
    locale: string
    counts: Partial<Record<Level, number>>
    categories: Category[]
    excludeIds: string[]
  }
  response: Question[]
  processed: Question[]
}>

export type SampleQuestion = Omit<Question, 'fallback'>

export type GetCategorySamplesAPI = Endpoint<{
  payload: { locale: string; category: Category }
  response: SampleQuestion[]
  processed: SampleQuestion[]
}>

export type GetOfflinePackAPI = Endpoint<{ payload: { locale: string }; response: OfflinePack; processed: OfflinePack }>

export type ReportQuestionAPI = Endpoint<{ payload: { id: string; reason?: string }; response: boolean; processed: boolean }>
