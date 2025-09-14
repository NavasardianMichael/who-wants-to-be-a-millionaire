import { LANGUAGES } from '@/services/translations/constants'
import { Language } from '@/types/settings'

export const LANGUAGE_NAMES: Record<Language, string> = {
  [LANGUAGES.en]: 'English',
  [LANGUAGES.am]: 'Armenian (Հայերեն)',
  [LANGUAGES.ru]: 'Russian (Русский)',
}

export const DIFFICULTY_LEVELS = [
  'Very easy',
  'Easy',
  'Medium',
  'Hard',
  'Very hard',
]
