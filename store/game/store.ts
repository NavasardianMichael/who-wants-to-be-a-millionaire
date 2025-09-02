import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, GameStateActions } from './types'

const initialState: GameState = {
  currentQuestionStage: 1,
  lifelines: {
    current: null,
    available: {
      fiftyFifty: true,
      askAudience: true,
      phoneAFriend: true,
      switchQuestion: true,
    }
  },
  quiz: [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      answerSerialNumber: 3
    }
  ],
  currentSound: null,
}



export const useGameStore = create<GameState & GameStateActions>()(
  immer(
    combine(
      initialState,
      (set): GameStateActions => ({
        setGameState: async (payload) => {
          set((prevState) => {
            return {
              ...prevState,
              ...payload,
            }
          })
        },
        setLifelineNonAvailable: async (payload) => {
          set((prevState) => {
            prevState.lifelines.available[payload] = false
          })
        },
        setCurrentLifeline: async (payload) => {
          set((prevState) => {
            prevState.lifelines.current = payload
          })
        },
        setCurrentSound: async (payload) => {
          set((prevState) => {
            prevState.currentSound = payload
          })
        },
        stopCurrentSound: async () => {
          set(async (prevState) => {
            await prevState.currentSound?.stop()
          })
        },
        playCurrentSound: async () => {
          set(async (prevState) => {
            await prevState.currentSound?.play()
          })
        },
      })
    )
  )
)
