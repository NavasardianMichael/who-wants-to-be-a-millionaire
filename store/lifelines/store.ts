import {
  getAnswerWithGuaranteedProbability,
  getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer,
  sliceArrayContainingCorrectAnswer,
} from '@/helpers/game'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { LifelinesState, LifelinesStateActions } from './types'

const initialState: LifelinesState = {
  currentLifeline: null,
  lifelinesDisabled: false,
  lifelinesPending: false,
  fiftyFifty: null,
  askAudience: null,
  phoneAFriend: null,
  switchQuestion: null,
}

export const useLifelinesStore = create<
  LifelinesState & LifelinesStateActions
>()(
  immer(
    combine(initialState, (set, get): LifelinesStateActions => {
      return {
        setLifelinesState: async (payload) => {
          set((prevState) => ({
            ...prevState,
            ...payload,
          }))
        },
        setFiftyFiftyLifeline: (correctOptionSerialNumber) => {
          set((prevState) => {
            const randomIncorrectOptions = sliceArrayContainingCorrectAnswer(
              correctOptionSerialNumber
            )
            prevState.fiftyFifty = randomIncorrectOptions
          })
        },
        setAskAudienceLifeline: (correctOptionSerialNumber) => {
          set((prevState) => {
            const probabilities =
              getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer(
                correctOptionSerialNumber,
                70
              )
            prevState.askAudience = probabilities
          })
        },
        setPhoneAFriendLifeline: (correctOptionSerialNumber) => {
          set((prevState) => {
            const optionSerialNumber = getAnswerWithGuaranteedProbability(
              correctOptionSerialNumber,
              70
            )
            prevState.phoneAFriend = {
              suggestedOptionSerialNumber: optionSerialNumber,
            }
          })
        },
        setSwitchQuestionLifeline: () => {},
      }
    })
  )
)
