import { Nullable } from '@/types/commons'
import { Lifeline, OptionSerialNumber, QuestionStage } from '@/types/game'

export type LifelinesState = {
  currentLifeline: Lifeline | null
  lifelinesDisabled: boolean
  lifelinesPending: boolean
  fiftyFifty: Nullable<Partial<Record<OptionSerialNumber, boolean>>>
  askAudience: Nullable<Record<OptionSerialNumber, number>>
  phoneAFriend: Nullable<{
    suggestedOptionSerialNumber: OptionSerialNumber
  }>
  switchQuestion: Nullable<{
    waitingToSwitchQuizItem: boolean
    wouldAnswer: OptionSerialNumber | null
  }>
}

export type QuizItem = {
  id: number
  question: string
  options: string[]
  answeredOptionSerialNumber: OptionSerialNumber | null
  correctOptionSerialNumber: OptionSerialNumber
}

export type SingleLifelineActionPayload = {
  correctOptionSerialNumber: OptionSerialNumber
  currentQuestionStage: QuestionStage
}

export type LifelinesStateActions = {
  setLifelinesState: (state: Partial<LifelinesState>) => void
  setFiftyFiftyLifeline: (payload: SingleLifelineActionPayload) => void
  setAskAudienceLifeline: (payload: SingleLifelineActionPayload) => void
  setPhoneAFriendLifeline: (payload: SingleLifelineActionPayload) => void
  setSwitchQuestionLifeline: (
    payload: Partial<NonNullable<LifelinesState['switchQuestion']>>,
  ) => void
}
