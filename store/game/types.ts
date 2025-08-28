import { Difficulty } from '@/app/types/difficulty'
import { Language } from '@/app/types/languages'

export type GameState = {
  language: Language
  difficulty: Difficulty
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
}
