import { DIFFICULTY_LEVELS } from '@/constants/settings'
import { LANGUAGES } from '@/services/translations/constants'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { SettingsState, SettingsStateActions } from './types'

const initialState: SettingsState = {
  language: LANGUAGES.en,
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
