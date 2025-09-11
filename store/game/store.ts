import { fetchQuestion } from '@/api/getQuestions'
import { getAskedQuestionsByLanguage } from '@/services/localStorage/api'
import { OptionSerialNumber } from '@/types/game'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, GameStateActions, QuizItem } from './types'

const initialState: GameState = {
  pendingQuizItemStage: 1,
  currentQuestionStage: 1,
  quiz: [],
  isSidebarOpen: false,
}

export const useGameStore = create<GameState & GameStateActions>()(
  immer(
    combine(initialState, (set, get): GameStateActions => {
      return {
        setGameState: async (payload) => {
          set((prevState) => ({
            ...prevState,
            ...payload,
          }))
        },
        setIsSidebarOpen: async (isOpen) => {
          set((prevState) => {
            prevState.isSidebarOpen = isOpen
          })
        },
        setAnsweredOptionSerialNumber: (serialNumber) => {
          set((prevState) => {
            prevState.quiz[
              prevState.currentQuestionStage - 1
            ].answeredOptionSerialNumber = serialNumber
          })
        },
        initNextQuizItem: async ({ stage, difficulty, language }) => {
          return new Promise<QuizItem['question']>(async (resolve) => {
            set((prevState) => {
              prevState.pendingQuizItemStage = stage
            })
            const askedQuestionsByLanguage = await getAskedQuestionsByLanguage()
            const askedQuestions = askedQuestionsByLanguage?.[language] || []
            const quizItemResponse = await fetchQuestion({
              stage,
              difficulty,
              language,
              askedQuestions
            })
            if (!quizItemResponse) {
              throw new Error('Failed to fetch quiz item')
            }

            set((prevState) => {
              prevState.quiz[stage - 1] = {
                ...quizItemResponse,
                answeredOptionSerialNumber: null,
                correctOptionSerialNumber: (quizItemResponse.answerIndex +
                  1) as OptionSerialNumber,
                id: Date.now(),
              }
              prevState.pendingQuizItemStage = null
            })

            resolve(quizItemResponse.question)
          })
        },
      }
    })
  )
)
