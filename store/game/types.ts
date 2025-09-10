import { FetchQuizItemAPI } from '@/api/getQuestions'
import { OptionSerialNumber, QuestionStage } from '@/types/game'

export type GameState = {
  pendingQuizItemStage: number | null
  currentQuestionStage: QuestionStage
  quiz: QuizItem[]
  isSidebarOpen: boolean
}

export type QuizItem = {
  id: number
  question: string
  options: string[]
  answeredOptionSerialNumber: OptionSerialNumber | null
  correctOptionSerialNumber: OptionSerialNumber
}

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void
  setIsSidebarOpen: (isOpen: boolean) => void
  setAnsweredOptionSerialNumber: (
    serialNumber: OptionSerialNumber | null
  ) => void
  initNextQuizItem: (
    payload: FetchQuizItemAPI['payload']
  ) => Promise<QuizItem['question']>
}
