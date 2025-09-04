import { LIFELINES, QUESTION_STAGES, SOUNDS_URIS } from '@/constants/game';

export type QuestionStage = (typeof QUESTION_STAGES)[number]

export type Lifeline = typeof LIFELINES[keyof typeof LIFELINES]

export type AnswerOptionSerialNumber = 1 | 2 | 3 | 4

export type SoundId = typeof SOUNDS_URIS[keyof typeof SOUNDS_URIS]