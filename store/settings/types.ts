import { Difficulty } from '@/app/types/difficulty'
import { Language } from '@/app/types/languages'

export type SettingsState = {
  language: Language
  difficulty: Difficulty
}

export type SettingsStateActions = {
  setSettingsState: (state: Partial<SettingsState>) => void
}
