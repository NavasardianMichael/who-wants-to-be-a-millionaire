import { Prisma } from '@prisma/client'
import type { RankedMode } from '../lib/game.js'
import { prisma } from '../lib/prisma.js'

/**
 * One board per ranked mode: each player's **best** finished run, ranked by score, ties
 * broken by total answer time (faster first), then by who got there first.
 *
 * The language filter ranks only runs played in that language. The name search filters the
 * ranked list *after* ranking, so a player found by name still shows their real global rank.
 */
export type LeaderboardPeriod = 'all' | 'week'

export type LeaderboardQuery = {
  mode: RankedMode
  locale?: string
  search?: string
  period: LeaderboardPeriod
  page: number
  pageSize: number
  /** The signed-in viewer, whose own row is returned alongside the page. */
  viewerId?: string
}

export type LeaderboardRow = {
  rank: number
  userId: string
  displayName: string
  avatarPath: string | null
  googleAvatarUrl: string | null
  score: number
  totalAnswerMs: number
  locale: string
  finishedAt: Date
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** `%` and `_` are LIKE wildcards; a player searching for "a_b" means the literal name. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`)

const rankedSql = (query: LeaderboardQuery) => {
  const localeFilter = query.locale ? Prisma.sql`AND r.locale = ${query.locale}` : Prisma.empty
  const periodFilter =
    query.period === 'week' ? Prisma.sql`AND r."finishedAt" >= ${new Date(Date.now() - WEEK_MS)}` : Prisma.empty

  return Prisma.sql`
    WITH best AS (
      SELECT DISTINCT ON (r."userId")
        r."userId", r.score, r."totalAnswerMs", r.locale, r."finishedAt"
      FROM "Run" r
      WHERE r.mode = ${query.mode}::"GameMode" AND r.status = 'finished' AND r.score > 0
        AND r."userId" IS NOT NULL
        ${localeFilter} ${periodFilter}
      ORDER BY r."userId", r.score DESC, r."totalAnswerMs" ASC, r."finishedAt" ASC
    ),
    ranked AS (
      SELECT best.*,
        RANK() OVER (ORDER BY best.score DESC, best."totalAnswerMs" ASC, best."finishedAt" ASC)::int AS rank
      FROM best
    )
    SELECT ranked.rank, ranked."userId", u."displayName", u."avatarPath", u."googleAvatarUrl",
      ranked.score, ranked."totalAnswerMs", ranked.locale, ranked."finishedAt"
    FROM ranked
    JOIN "User" u ON u.id = ranked."userId"
  `
}

export const getLeaderboard = async (query: LeaderboardQuery) => {
  const base = rankedSql(query)
  const search = query.search ? Prisma.sql`WHERE board."displayName" ILIKE ${`%${escapeLike(query.search)}%`}` : Prisma.empty

  const [rows, totals, viewer] = await Promise.all([
    prisma.$queryRaw<LeaderboardRow[]>`
      SELECT * FROM (${base}) board ${search}
      ORDER BY board.rank ASC, board."displayName" ASC
      LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}
    `,
    prisma.$queryRaw<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM (${base}) board ${search}`,
    query.viewerId
      ? prisma.$queryRaw<LeaderboardRow[]>`SELECT * FROM (${base}) board WHERE board."userId" = ${query.viewerId}`
      : Promise.resolve([] as LeaderboardRow[]),
  ])

  return { rows, total: totals[0]?.total ?? 0, viewer: viewer[0] ?? null }
}

/** The viewer's best and rank in each mode, for the profile page. */
export const getRankSummary = async (userId: string, mode: RankedMode) => {
  const { viewer } = await getLeaderboard({ mode, period: 'all', page: 1, pageSize: 1, viewerId: userId })
  return viewer ? { rank: viewer.rank, score: viewer.score } : null
}
