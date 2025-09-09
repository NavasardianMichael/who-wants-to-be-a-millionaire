import { QUESTIONS_MOCK } from '@/constants/questionsMock'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, GameStateActions } from './types'

const initialState: GameState = {
  currentQuestionStage: 1,
  quiz: QUESTIONS_MOCK,
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
      }
    })
  )
)
