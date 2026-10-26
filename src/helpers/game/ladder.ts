import { LADDER, SAFE_HAVEN_STAGES, STAGES_COUNT } from '@constants/game'

/**
 * Classic prize maths. `answered` is the number of questions answered correctly so far
 * (0..15); the stage being played is `answered + 1`.
 */
export const prizeForStage = (stage: number): number => LADDER[Math.min(Math.max(stage, 1), STAGES_COUNT) - 1]!

export const isSafeHaven = (stage: number): boolean => (SAFE_HAVEN_STAGES as readonly number[]).includes(stage)

/** What a wrong answer still pays: the highest safe haven already passed. */
export const guaranteedAmount = (answered: number): number => {
  const passed = SAFE_HAVEN_STAGES.filter((stage) => stage <= answered)
  return passed.length ? prizeForStage(passed[passed.length - 1]!) : 0
}

/** What walking away pays: everything banked so far. */
export const walkAwayAmount = (answered: number): number => (answered > 0 ? prizeForStage(answered) : 0)

/** The prize on the line for the current question. */
export const playingFor = (answered: number): number => prizeForStage(answered + 1)
