import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, GameStateActions } from './types'

const initialState: GameState = {
  currentQuestionStage: 1,
  lifelines: {
    fiftyFifty: true,
    askAudience: true,
    phoneAFriend: true,
    switchQuestion: true
  },
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
      })
    )
  )
)
