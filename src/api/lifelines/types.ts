import { Endpoint } from '@interfaces/api'
import { FriendAnswer } from '@interfaces/entities'
import type { Level } from '@constants/game'

export type PhoneAFriendAPI = Endpoint<{
  payload: {
    locale: string
    question: string
    options: string[]
    correctIndex: number
    removed: number[]
    level: Level
  }
  response: FriendAnswer
  processed: FriendAnswer
}>
