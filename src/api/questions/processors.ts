import { unwrapValue } from '@api/unwrap'
import { GetCategorySamplesAPI, GetOfflinePackAPI, GetQuestionBatchAPI, ReportQuestionAPI } from './types'

export const processQuestionBatchResponse: GetQuestionBatchAPI['processor'] = unwrapValue
export const processCategorySamplesResponse: GetCategorySamplesAPI['processor'] = unwrapValue
export const processOfflinePackResponse: GetOfflinePackAPI['processor'] = unwrapValue
export const processReportQuestionResponse: ReportQuestionAPI['processor'] = unwrapValue
