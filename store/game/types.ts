import { LIFELINES } from '@/constants/game'
import { QuestionStage } from '@/types/game'

export type GameState = {
  currentQuestionStage: QuestionStage
  lifelines: LifeLines
}

export type LifeLines = Record<(typeof LIFELINES)[number], boolean>

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
}
