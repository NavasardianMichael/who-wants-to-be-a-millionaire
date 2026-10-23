import type { GameSettings } from '@helpers/game/settings'

export type SettingsState = {
  game: GameSettings
  /** Download the current language's pack automatically after the first game. */
  autoDownloadPack: boolean
  isHydrated: boolean
}

export type SettingsActions = {
  hydrateSettings: () => void
  setGameSettings: (payload: Partial<GameSettings>) => void
  resetGameSettings: () => void
  setAutoDownloadPack: (value: boolean) => void
}
