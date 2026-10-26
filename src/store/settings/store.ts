import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { STORAGE_KEYS } from '@constants/app'
import { DEFAULT_SETTINGS, sanitizeSettings } from '@helpers/game/settings'
import { readJson, writeJson } from '@helpers/storage'
import { SettingsActions, SettingsState } from './types'

const initialState: SettingsState = {
  game: DEFAULT_SETTINGS,
  isHydrated: false,
}

const persist = (state: SettingsState) => writeJson(STORAGE_KEYS.settings, { game: state.game })

export const useSettingsStoreBase = create<SettingsState & SettingsActions>()(
  immer(
    combine(
      initialState,
      (set, get): SettingsActions => ({
        hydrateSettings: () => {
          const stored = readJson<{ game?: unknown }>(STORAGE_KEYS.settings, {})
          set((state) => {
            state.game = sanitizeSettings(stored.game)
            state.isHydrated = true
          })
        },
        setGameSettings: (payload) => {
          set((state) => {
            state.game = sanitizeSettings({ ...state.game, ...payload })
          })
          persist(get())
        },
        resetGameSettings: () => {
          set((state) => {
            state.game = DEFAULT_SETTINGS
          })
          persist(get())
        },
      })
    )
  )
)

export const useSettingsStore = appendSelectors(useSettingsStoreBase)
