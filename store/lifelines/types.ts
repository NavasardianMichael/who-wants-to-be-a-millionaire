import { Nullable } from '@/types/commons'
import { Lifeline, OptionSerialNumber } from '@/types/game'

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
    wouldAnswer: OptionSerialNumber
  }>
}

export type QuizItem = {
  id: number
  question: string
  options: string[]
  answeredOptionSerialNumber: OptionSerialNumber | null
  correctOptionSerialNumber: OptionSerialNumber
}

export type LifelinesStateActions = {
  setLifelinesState: (state: Partial<LifelinesState>) => void
  setFiftyFiftyLifeline: (correctOptionSerialNumber: OptionSerialNumber) => void
  setAskAudienceLifeline: (
    correctOptionSerialNumber: OptionSerialNumber
  ) => void
  setPhoneAFriendLifeline: (
    correctOptionSerialNumber: OptionSerialNumber
  ) => void
  setSwitchQuestionLifeline: (
    correctOptionSerialNumber: OptionSerialNumber
  ) => void
}
