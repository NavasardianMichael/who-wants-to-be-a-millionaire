import { DIFFICULTY_LEVELS, LANGUAGES } from '@/constants/settings'
import { LOCAL_STORAGE_KEYS } from '@/services/localStorage/constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { SettingsState, SettingsStateActions } from './types'

const initialState: SettingsState = {
  language:
    (await AsyncStorage.getItem(LOCAL_STORAGE_KEYS.language)) || LANGUAGES[0],
  difficulty:
    (await AsyncStorage.getItem(LOCAL_STORAGE_KEYS.difficulty)) ||
    DIFFICULTY_LEVELS[2],
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
