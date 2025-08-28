import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, SettingsState, SettingsStateActions } from './types'

const initialState: GameState = {}

export const useSettingsStore = create<SettingsState & SettingsStateActions>()(
  immer(
    combine(
      initialState,
      (set): SettingsStateActions => ({
        setSettingsState: async (payload) => {
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
