import {} from '@/helpers/game'
import {
  getAnswerWithGuaranteedProbability,
  getGuaranteedProbabilityByStage,
  getIncorrectOptionsSerialNumbersList,
  getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer,
  sliceArrayContainingCorrectAnswer,
} from '@/helpers/lifeline'
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
        setFiftyFiftyLifeline: ({
          correctOptionSerialNumber,
          currentQuestionStage,
        }) => {
          set((prevState) => {
            const randomIncorrectOptions = sliceArrayContainingCorrectAnswer(
              correctOptionSerialNumber,
            )
            prevState.fiftyFifty = randomIncorrectOptions
          })
        },
        setAskAudienceLifeline: ({
          correctOptionSerialNumber,
          currentQuestionStage,
        }) => {
          set((prevState) => {
            const guaranteedProbability =
              getGuaranteedProbabilityByStage(currentQuestionStage)
            const probabilities =
              getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer(
                correctOptionSerialNumber,
                guaranteedProbability,
                getIncorrectOptionsSerialNumbersList(prevState.fiftyFifty),
              )

            prevState.askAudience = probabilities
          })
        },
        setPhoneAFriendLifeline: ({
          correctOptionSerialNumber,
          currentQuestionStage,
        }) => {
          set((prevState) => {
            const guaranteedProbability =
              getGuaranteedProbabilityByStage(currentQuestionStage)
            const optionSerialNumber = getAnswerWithGuaranteedProbability(
              correctOptionSerialNumber,
              guaranteedProbability,
              getIncorrectOptionsSerialNumbersList(prevState.fiftyFifty),
            )
            prevState.phoneAFriend = {
              suggestedOptionSerialNumber: optionSerialNumber,
            }
          })
        },
        setSwitchQuestionLifeline: async (payload) => {
          set((prevState) => {
            prevState.switchQuestion = {
              waitingToSwitchQuizItem:
                payload.waitingToSwitchQuizItem ??
                prevState.switchQuestion?.waitingToSwitchQuizItem ??
                false,
              wouldAnswer:
                payload.wouldAnswer ??
                prevState.switchQuestion?.wouldAnswer ??
                null,
            }
          })
        },
      }
    }),
  ),
)
