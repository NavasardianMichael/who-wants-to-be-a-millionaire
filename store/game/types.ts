import { AnswerOptionSerialNumber, Lifeline, QuestionStage } from '@/types/game'

export type GameState = {
  currentQuestionStage: QuestionStage
  lifelines: Lifelines
  quiz: Quiz[]
  sound: {
    apiById: Record<string, SoundAPI>
    activeIdsStack: SoundAPI['id'][]
    isMuted: boolean
  }
}

type Lifelines = {
  current: Lifeline | null
  available: Record<Lifeline, boolean>
}

type Quiz = {
  id: number;
  question: string;
  options: string[];
  answeredOptionSerialNumber: AnswerOptionSerialNumber | null;
  correctOptionSerialNumber: AnswerOptionSerialNumber;
}

export type SoundAPI = {
  id: string;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  unload: () => Promise<void>;
  setMutedStatus: (isMuted: boolean) => Promise<void>;
  toggleMutedStatus: () => Promise<void>;
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
  setLifelineNonAvailable: (lifeline: Lifeline) => void
  setCurrentLifeline: (lifeline: Lifelines['current']) => void
  initSound: (uri: string, options?: { loop?: boolean, playOnInit?: boolean }) => void
  playSoundById: (id: SoundAPI['id']) => void
  setIsSoundMuted: (id: SoundAPI['id'], isMuted: GameState['sound']['isMuted']) => void
  setIsActiveSoundMuted: (isMuted: GameState['sound']['isMuted']) => void
  toggleActiveSoundMuted: () => void
  // stopCurrentSound: () => void
  // playCurrentSound: () => void
}
