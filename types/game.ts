import {
  LIFELINES,
  OPTIONS_SERIAL_NUMBERS,
  QUESTION_STAGES,
  SAFE_HAVEN_STAGES,
} from '@/constants/game'
import { SOUNDS_URIS } from '@/constants/sound'

export type QuestionStage = (typeof QUESTION_STAGES)[number]

export type SafeHavenStage = (typeof SAFE_HAVEN_STAGES)[number]

export type Lifeline = (typeof LIFELINES)[keyof typeof LIFELINES]

export type OptionSerialNumber = (typeof OPTIONS_SERIAL_NUMBERS)[number]

export type SoundId = (typeof SOUNDS_URIS)[keyof typeof SOUNDS_URIS]
