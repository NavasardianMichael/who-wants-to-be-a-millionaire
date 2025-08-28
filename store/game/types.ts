import { QuestionStage } from '@/types/game'

export type GameState = {
  currentQuestionStage: QuestionStage
  lifelines: LifeLines
}

export type LifeLines = {
  fiftyFifty: boolean
  askAudience: boolean
  phoneAFriend: boolean
  switchQuestion: boolean
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
}
