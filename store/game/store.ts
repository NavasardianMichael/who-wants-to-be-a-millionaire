import { getQuiz } from '@/api/getQuiz'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, GameStateActions } from './types'

const initialState: GameState = {
  isPending: false,
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
        initQuiz: async ({ language }) => {
          set({ isPending: true })
          return new Promise<GameState['quiz']>(async (resolve) => {
            const quiz = await getQuiz({ language })
            set((prevState) => {
              prevState.quiz = quiz || []
            })

            set({ isPending: false })
            resolve(quiz ?? [])
          })
        },
      }
    })
  )
)
