import type { User } from '@prisma/client'
import type { LeaderboardRow } from '../services/leaderboard.js'

/**
 * Database rows → the shapes the web app reads. Avatars: an uploaded one (a path under
 * `/uploads`, which the web app prefixes with the API origin) wins over Google's photo.
 */
export const avatarOf = (user: { avatarPath: string | null; googleAvatarUrl: string | null }): string | null =>
  user.avatarPath ?? user.googleAvatarUrl ?? null

export const toSessionUser = (user: User) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: avatarOf(user),
  hasUploadedAvatar: Boolean(user.avatarPath),
  locale: user.locale,
  createdAt: user.createdAt.toISOString(),
})

export type SessionUser = ReturnType<typeof toSessionUser>

export const toLeaderboardEntry = (row: LeaderboardRow) => ({
  rank: row.rank,
  userId: row.userId,
  displayName: row.displayName,
  avatarUrl: avatarOf(row),
  score: row.score,
  totalAnswerMs: row.totalAnswerMs,
  locale: row.locale,
  finishedAt: row.finishedAt.toISOString(),
})
