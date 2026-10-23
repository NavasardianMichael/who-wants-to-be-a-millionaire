import {
  CATEGORIES,
  type Category,
  isCategory,
  isLifeline,
  type Level,
  levelForCorrectCount,
  type Lifeline,
  LIFELINES,
  MARATHON_RULES,
  STAGE_LEVELS,
  TIME_ATTACK_RULES,
} from '@constants/game'

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

/** `classic` = the show's pacing: 30 s for Q1–5, 45 s for Q6–10, no limit for Q11–15. */
export const TIMER_OPTIONS = ['classic', 'off', 15, 30, 45, 60] as const
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
  timer: 'classic',
  lifelines: [...LIFELINES],
}

/** Ranked runs are only ranked when nothing has been customised. */
export const isDefaultSettings = (settings: GameSettings): boolean =>
  settings.categories.length === 0 &&
  settings.difficulty === 'normal' &&
  settings.timer === DEFAULT_SETTINGS.timer &&
  settings.lifelines.length === LIFELINES.length

const DIFFICULTY_SHIFT: Record<Difficulty, number> = { easy: -1, normal: 0, hard: 1 }

const clampLevel = (level: number): Level => Math.min(5, Math.max(1, level)) as Level

export const classicLevel = (stage: number, difficulty: Difficulty): Level =>
  clampLevel((STAGE_LEVELS[stage - 1] ?? 5) + DIFFICULTY_SHIFT[difficulty])

export const practiceLevel = (mode: 'marathon' | 'timeAttack', correctCount: number, difficulty: Difficulty): Level => {
  const every = mode === 'marathon' ? MARATHON_RULES.levelUpEvery : TIME_ATTACK_RULES.levelUpEvery
  return clampLevel(levelForCorrectCount(correctCount, every) + DIFFICULTY_SHIFT[difficulty])
}

/** Seconds for a Classic question, or null for no limit. */
export const classicSeconds = (stage: number, timer: TimerSetting): number | null => {
  if (timer === 'off') return null
  if (timer === 'classic') return stage <= 5 ? 30 : stage <= 10 ? 45 : null
  return timer
}

/** Marathon practice: the classic preset means the ranked pace. */
export const marathonSeconds = (timer: TimerSetting): number | null => {
  if (timer === 'off') return null
  if (timer === 'classic') return MARATHON_RULES.questionSeconds
  return timer
}

/** Settings read back from storage are untrusted — keep only what still parses. */
export const sanitizeSettings = (raw: unknown): GameSettings => {
  const value = (raw ?? {}) as Partial<Record<keyof GameSettings, unknown>>
  const categories = Array.isArray(value.categories) ? value.categories.filter(isCategory) : []
  const lifelines = Array.isArray(value.lifelines) ? value.lifelines.filter(isLifeline) : DEFAULT_SETTINGS.lifelines
  return {
    categories: categories.length === CATEGORIES.length ? [] : categories,
    difficulty: DIFFICULTIES.includes(value.difficulty as Difficulty) ? (value.difficulty as Difficulty) : 'normal',
    timer: TIMER_OPTIONS.includes(value.timer as TimerSetting) ? (value.timer as TimerSetting) : 'classic',
    lifelines,
  }
}
