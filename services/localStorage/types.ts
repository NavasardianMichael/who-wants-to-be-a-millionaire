import { QuizItem } from '@/store/game/types'
import { SettingsState } from '@/store/settings/types'
import { Language } from '../../types/settings'

export type LocalStorageData = {
  language: SettingsState['language']
  difficulty: SettingsState['difficulty']
  askedQuestionHashesByLanguage: Record<Language, QuizItem['question'][]>
}
