import { axiosInstance } from '@api/axiosInstance'
import { APIResponse } from '@interfaces/api'
import { API_QUESTIONS_TIMEOUT_MS } from '@constants/app'
import { ENDPOINTS } from './endpoints'
import {
  processAnswerRunResponse,
  processGetRunResponse,
  processRunLifelineResponse,
  processStartRunResponse,
} from './processors'
import { AnswerRunAPI, GetRunAPI, RunLifelineAPI, StartRunAPI } from './types'

export const startRunAPI: StartRunAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<StartRunAPI['response']>>(ENDPOINTS.runs, payload, {
    timeout: API_QUESTIONS_TIMEOUT_MS,
  })
  return processStartRunResponse(data)
}

export const getRunAPI: GetRunAPI['api'] = async ({ id }) => {
  const { data } = await axiosInstance.get<APIResponse<GetRunAPI['response']>>(ENDPOINTS.run(id))
  return processGetRunResponse(data)
}

export const answerRunAPI: AnswerRunAPI['api'] = async ({ id, questionId, index }) => {
  const { data } = await axiosInstance.post<APIResponse<AnswerRunAPI['response']>>(
    ENDPOINTS.answer(id),
    { questionId, index },
    { timeout: API_QUESTIONS_TIMEOUT_MS }
  )
  return processAnswerRunResponse(data)
}

export const runLifelineAPI: RunLifelineAPI['api'] = async ({ id, lifeline }) => {
  const { data } = await axiosInstance.post<APIResponse<RunLifelineAPI['response']>>(
    ENDPOINTS.lifeline(id),
    { lifeline },
    { timeout: API_QUESTIONS_TIMEOUT_MS }
  )
  return processRunLifelineResponse(data)
}
