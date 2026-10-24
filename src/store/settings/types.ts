import type { GameSettings } from '@helpers/game/settings'

export type SettingsState = {
  game: GameSettings
  isHydrated: boolean
}

export type SettingsActions = {
  hydrateSettings: () => void
  setGameSettings: (payload: Partial<GameSettings>) => void
  resetGameSettings: () => void
}
