import type { BadgeId, Category, Level, Lifeline, RankedMode } from '@constants/game'

/**
 * Entity shapes shared by the API layer, the stores and the components. They mirror what
 * the server's mappers return (`server/src/mappers/entities.ts`, `services/*`).
 */

/** A question with its answer — Classic and practice games only. */
export type Question = {
  id: string
  locale: string
  category: Category
  level: Level
  scope: 'global' | 'local'
  text: string
  options: string[]
  correctIndex: number
  explanation: string | null
  /** From the English bank because the locale's pool and the AI both came up short. */
  fallback: boolean
}

export type SessionUser = {
  id: string
  email: string
  displayName: string
  /** Absolute (Google) or an API path (`/uploads/...`) — resolve with `resolveAvatarUrl`. */
  avatarUrl: string | null
  hasUploadedAvatar: boolean
  locale: string
  createdAt: string
}

export type EarnedBadge = { badgeId: BadgeId; earnedAt: string }

export type RankSummary = { rank: number; score: number }

export type Profile = {
  user: SessionUser
  classic: { bestWinnings: number; bestStage: number; gamesPlayed: number }
  ranked: Record<RankedMode, RankSummary | null>
  badges: EarnedBadge[]
}

export type FriendConfidence = 'high' | 'medium' | 'low'

export type FriendAnswer = {
  friendName: string | null
  /** AI-written words, or null when the client should use its translated template. */
  message: string | null
  suggestedIndex: number
  confidence: FriendConfidence
}

/** A ranked run as the server shows it: never the answer. */
export type RunQuestion = {
  id: string
  text: string
  options: string[]
  category: Category
  level: Level
  removed: number[]
}

export type RunView = {
  id: string
  mode: RankedMode
  locale: string
  status: 'active' | 'finished'
  score: number
  correctCount: number
  level: Level
  lifelinesUsed: Lifeline[]
  lifelinesAllowed: Lifeline[]
  question: RunQuestion | null
  deadline: string | null
  endsAt: string | null
  serverNow: string
}

export type RunAnswerResult = {
  correct: boolean
  correctIndex: number
  explanation: string | null
  timedOut: boolean
  run: RunView
  badges: BadgeId[]
}

export type RunLifelineResult = {
  lifeline: Lifeline
  removed?: number[]
  votes?: number[]
  friend?: FriendAnswer
  run: RunView
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  displayName: string
  avatarUrl: string | null
  score: number
  totalAnswerMs: number
  locale: string
  finishedAt: string
}

export type LeaderboardPage = {
  entries: LeaderboardEntry[]
  total: number
  pageSize: number
  viewer: LeaderboardEntry | null
}

export type ClassicOutcome = 'won' | 'walked' | 'lost' | 'timeout'

export type ClassicResult = {
  clientId: string
  locale: string
  reachedStage: number
  winnings: number
  outcome: ClassicOutcome
  lifelinesUsed: Lifeline[]
  playedAt: string
  settings?: Record<string, unknown>
}

export type OfflinePack = {
  locale: string
  version: string
  questions: Omit<Question, 'fallback'>[]
}

export type HealthStatus = { status: 'ok'; google: boolean; gemini: boolean }
