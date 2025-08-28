import { Difficulty, Language } from '@/types/settings'

export type SettingsState = {
  language: Language
  difficulty: Difficulty
}

export type SettingsStateActions = {
  setSettingsState: (state: Partial<SettingsState>) => void
}
