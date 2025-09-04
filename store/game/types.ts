import { Lifeline, QuestionStage } from '@/types/game'

export type GameState = {
  currentQuestionStage: QuestionStage
  lifelines: Lifelines
  quiz: Quiz[]
  currentSound: Sound | null
}

type Lifelines = {
  current: Lifeline | null
  available: Record<Lifeline, boolean>
}

type Quiz = {
  id: number;
  question: string;
  options: string[];
  answerSerialNumber: number;
}

type Sound = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  toggleMute: () => Promise<void>;
  isPlaying: boolean;
  isMuted: boolean;
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
  setLifelineNonAvailable: (lifeline: Lifeline) => void
  setCurrentLifeline: (lifeline: Lifelines['current']) => void
  setCurrentSound: (sound: GameState['currentSound']) => void
  stopCurrentSound: () => void
  playCurrentSound: () => void
}
