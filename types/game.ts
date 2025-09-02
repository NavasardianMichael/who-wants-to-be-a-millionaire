import { LIFELINES, QUESTION_STAGES } from '@/constants/game';

export type QuestionStage = (typeof QUESTION_STAGES)[number]

export type Lifeline = typeof LIFELINES[keyof typeof LIFELINES]