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
  isSidebarOpen: boolean
}

type Lifelines = {
  current: Lifeline | null
  fiftyFifty: Partial<Record<AnswerOptionSerialNumber, boolean>> | null
  askAudience: Record<AnswerOptionSerialNumber, number> | null
  phoneAFriend: AnswerOptionSerialNumber | null
  switchQuestion: boolean | null
}

type Quiz = {
  id: number
  question: string
  options: string[]
  answeredOptionSerialNumber: AnswerOptionSerialNumber | null
  correctOptionSerialNumber: AnswerOptionSerialNumber
}

export type SoundAPI = {
  id: string
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  unload: () => Promise<void>
  setMutedStatus: (isMuted: boolean) => Promise<void>
  toggleMutedStatus: () => Promise<void>
  playSoundByIdOnEnd: (id: SoundAPI['id']) => void
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
  setLifelineNonAvailable: (lifeline: Lifeline) => void
  setCurrentLifeline: (lifeline: Lifelines['current']) => void
  initSound: (
    uri: string,
    options?: { loop?: boolean; playOnInit?: boolean }
  ) => Promise<SoundAPI>
  playSoundById: (id: SoundAPI['id']) => void
  setIsSidebarOpen: (isOpen: boolean) => void
  setIsActiveSoundMuted: (isMuted: GameState['sound']['isMuted']) => void
  toggleActiveSoundMuted: () => void
  setAnsweredOptionSerialNumber: (
    serialNumber: AnswerOptionSerialNumber
  ) => void

  setFiftyFiftyLifeline: () => void
  setAskAudienceLifeline: () => void
  setPhoneAFriendLifeline: () => void
  setSwitchQuestionLifeline: () => void
}
