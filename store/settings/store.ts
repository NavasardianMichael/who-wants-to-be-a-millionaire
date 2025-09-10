import { DIFFICULTY_LEVELS, LANGUAGES } from '@/constants/settings'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { SettingsState, SettingsStateActions } from './types'

const initialState: SettingsState = {
  language: LANGUAGES[0],
  difficulty: DIFFICULTY_LEVELS[2],
}

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
