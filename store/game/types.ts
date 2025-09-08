import { Lifeline, OptionSerialNumber, QuestionStage } from '@/types/game'

export type GameState = {
  currentQuestionStage: QuestionStage
  lifelines: Lifelines
  quiz: QuizItem[]
  sound: {
    apiById: Record<string, SoundAPI>
    activeIdsStack: SoundAPI['id'][]
    isMuted: boolean
  }
  isSidebarOpen: boolean
}

type Nullable<T> = T | null

type Lifelines = {
  current: Lifeline | null
  disabled: boolean
  isPending: boolean
  fiftyFifty: Nullable<Partial<Record<OptionSerialNumber, boolean>>>
  askAudience: Nullable<Record<OptionSerialNumber, number>>
  phoneAFriend: Nullable<{
    suggestedOptionSerialNumber: OptionSerialNumber
  }>
  switchQuestion: Nullable<{
    wouldAnswer: OptionSerialNumber
  }>
}

export type QuizItem = {
  id: number
  question: string
  options: string[]
  answeredOptionSerialNumber: OptionSerialNumber | null
  correctOptionSerialNumber: OptionSerialNumber
}

export type SoundAPI = {
  id: string
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  unload: () => Promise<void>
  setMutedStatus: (isMuted: boolean) => Promise<void>
  toggleMutedStatus: () => Promise<void>
  onEnd: (callback: () => void) => void
  playSoundByIdOnEnd: (id: SoundAPI['id']) => void
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
  initSound: (
    uri: string,
    options?: { loop?: boolean; playOnInit?: boolean }
  ) => Promise<SoundAPI>
  playSoundById: (id: SoundAPI['id']) => void
  setIsSidebarOpen: (isOpen: boolean) => void
  setIsActiveSoundMuted: (isMuted: GameState['sound']['isMuted']) => void
  toggleActiveSoundMuted: () => void
  setAnsweredOptionSerialNumber: (
    serialNumber: OptionSerialNumber | null
  ) => void

  setCurrentLifeline: (lifeline: Lifelines['current']) => void
  setFiftyFiftyLifeline: () => void
  setAskAudienceLifeline: () => void
  setPhoneAFriendLifeline: () => void
  setSwitchQuestionLifeline: () => void
  setLifelinesDisabled: (isDisabled: boolean) => void
}
