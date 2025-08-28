import { DIFFICULTY_LEVELS, LANGUAGES } from '@/constants/settings';

export type Language = (typeof LANGUAGES)[number]

export type Difficulty = (typeof DIFFICULTY_LEVELS)[number]
