import { unwrapValue } from '@api/unwrap'
import { AnswerRunAPI, GetRunAPI, RunLifelineAPI, StartRunAPI } from './types'

export const processStartRunResponse: StartRunAPI['processor'] = unwrapValue
export const processGetRunResponse: GetRunAPI['processor'] = unwrapValue
export const processAnswerRunResponse: AnswerRunAPI['processor'] = unwrapValue
export const processRunLifelineResponse: RunLifelineAPI['processor'] = unwrapValue
