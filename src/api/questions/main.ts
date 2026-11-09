import { cache } from 'react'
import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { API_QUESTIONS_TIMEOUT_MS } from '@constants/app'
import { ENDPOINTS } from './endpoints'
import {
  processCategorySamplesResponse,
  processOfflinePackResponse,
  processQuestionBatchResponse,
  processReportQuestionResponse,
  processReportShownQuestionsResponse,
} from './processors'
import { GetCategorySamplesAPI, GetOfflinePackAPI, GetQuestionBatchAPI, ReportQuestionAPI, ReportShownQuestionsAPI } from './types'

export const getQuestionBatchAPI: GetQuestionBatchAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<GetQuestionBatchAPI['response']>>(ENDPOINTS.batch, payload, {
    timeout: API_QUESTIONS_TIMEOUT_MS,
  })
  return processQuestionBatchResponse(data)
}

/** Dedupes generateMetadata + page fetches within one server render. */
const fetchSamples = cache(async (locale: string, category: string) => {
  const { data } = await axiosInstance.get<APIResponse<GetCategorySamplesAPI['response']>>(ENDPOINTS.samples, {
    params: { locale, category },
  })
  return processCategorySamplesResponse(data)
})

export const getCategorySamplesAPI: GetCategorySamplesAPI['api'] = async ({ locale, category }) =>
  fetchSamples(locale, category)

export const getOfflinePackAPI: GetOfflinePackAPI['api'] = async ({ locale }) => {
  const { data } = await axiosInstance.get<APIResponse<GetOfflinePackAPI['response']>>(
    `${ENDPOINTS.packs}/${encodeURIComponent(locale)}`,
    { timeout: API_QUESTIONS_TIMEOUT_MS }
  )
  return processOfflinePackResponse(data)
}

/** The questions a Classic game actually showed: counted as served, and remembered for a signed-in player. */
export const reportShownQuestionsAPI: ReportShownQuestionsAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<ReportShownQuestionsAPI['response']>>(ENDPOINTS.shown, payload)
  return processReportShownQuestionsResponse(data)
}

export const reportQuestionAPI: ReportQuestionAPI['api'] = async ({ id, reason }) => {
  const { data } = await axiosInstance.post<APIResponse<ReportQuestionAPI['response']>>(ENDPOINTS.report(id), { reason })
  return processReportQuestionResponse(data)
}
