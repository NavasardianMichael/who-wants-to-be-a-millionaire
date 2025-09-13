import { DIFFICULTY_LEVELS } from '@/constants/settings'
import { LANGUAGES } from '@/services/translations/constants'

export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES]

export type Difficulty = (typeof DIFFICULTY_LEVELS)[number]
