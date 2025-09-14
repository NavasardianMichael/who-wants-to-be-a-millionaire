import { SettingsState } from '@/store/settings/types'
import { QuestionStage, SafeHavenStage } from '@/types/game'
import { Language } from '../../types/settings'

export type LocalStorageData = {
  language: SettingsState['language']
  lastQuestionNumberBySafeHavenNumberByLanguage: Record<
    Language,
    Record<SafeHavenStage, QuestionStage | 0>
  >
}
