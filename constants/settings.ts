import { LANGUAGES } from '@/services/translations/constants'
import { Language } from '@/types/settings'

export const LANGUAGE_NAMES: Record<Language, string> = {
  [LANGUAGES.en]: 'English',
  [LANGUAGES.am]: 'Հայերեն',
  [LANGUAGES.ru]: 'Русский',
}

export const DIFFICULTY_LEVELS = [
  'Very easy',
  'Easy',
  'Medium',
  'Hard',
  'Very hard',
]
