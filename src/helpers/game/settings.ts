import {
  CATEGORIES,
  type Category,
  isCategory,
  isLifeline,
  type Level,
  type Lifeline,
  LIFELINES,
  STAGE_LEVELS,
} from '@constants/game'

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

/** `off`, or seconds per question. */
export const TIMER_OPTIONS = ['off', 30, 60, 180] as const
export type TimerSetting = (typeof TIMER_OPTIONS)[number]

export type GameSettings = {
  /** Empty means every category. */
  categories: Category[]
  difficulty: Difficulty
  timer: TimerSetting
  lifelines: Lifeline[]
}

export const DEFAULT_SETTINGS: GameSettings = {
  categories: [],
  difficulty: 'normal',
  timer: 'off',
  lifelines: [...LIFELINES],
}

/** Classic's settings as they come; the setup panel marks anything customised. */
export const isDefaultSettings = (settings: GameSettings): boolean =>
  settings.categories.length === 0 &&
  settings.difficulty === 'normal' &&
  settings.timer === DEFAULT_SETTINGS.timer &&
  settings.lifelines.length === LIFELINES.length

const DIFFICULTY_SHIFT: Record<Difficulty, number> = { easy: -1, normal: 0, hard: 1 }

const clampLevel = (level: number): Level => Math.min(5, Math.max(1, level)) as Level

export const classicLevel = (stage: number, difficulty: Difficulty): Level =>
  clampLevel((STAGE_LEVELS[stage - 1] ?? 5) + DIFFICULTY_SHIFT[difficulty])

/** Seconds for a Classic question, or null for no limit. */
export const classicSeconds = (timer: TimerSetting): number | null => (timer === 'off' ? null : timer)

/** Settings read back from storage are untrusted — keep only what still parses. */
export const sanitizeSettings = (raw: unknown): GameSettings => {
  const value = (raw ?? {}) as Partial<Record<keyof GameSettings, unknown>>
  const categories = Array.isArray(value.categories) ? value.categories.filter(isCategory) : []
  const lifelines = Array.isArray(value.lifelines) ? value.lifelines.filter(isLifeline) : DEFAULT_SETTINGS.lifelines
  return {
    categories: categories.length === CATEGORIES.length ? [] : categories,
    difficulty: DIFFICULTIES.includes(value.difficulty as Difficulty) ? (value.difficulty as Difficulty) : 'normal',
    timer: TIMER_OPTIONS.includes(value.timer as TimerSetting) ? (value.timer as TimerSetting) : DEFAULT_SETTINGS.timer,
    lifelines,
  }
}
