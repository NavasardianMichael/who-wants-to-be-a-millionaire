import type { ClassicOutcome, Prisma } from '@prisma/client'
import { Router } from 'express'
import { fail, ok } from '../lib/api-response.js'
import { isLifeline, LADDER, STAGES_COUNT } from '../lib/game.js'
import { isLocale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'
import { asInteger, asStringArray, isUuid } from '../lib/request.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { rateLimit } from '../middleware/rateLimit.js'

/**
 * Classic results, synced from the device's outbox. **Personal only** — they never reach a
 * leaderboard, so they are trusted as reported, with only shape and plausibility checks.
 */
export const classicRouter = Router()

classicRouter.use(requireAuth)

const OUTCOMES: readonly ClassicOutcome[] = ['won', 'walked', 'lost', 'timeout']
const MAX_GAMES_PER_SYNC = 50

type SyncedGame = Prisma.ClassicGameCreateManyInput

/** The winnings a game can legitimately report: any ladder rung, the safe havens, or nothing. */
const VALID_WINNINGS = new Set<number>([0, ...LADDER])

const readGame = (raw: unknown, userId: string): SyncedGame | null => {
  const game = (raw ?? {}) as Record<string, unknown>
  if (typeof game.clientId !== 'string' || !isUuid(game.clientId)) return null
  if (!isLocale(game.locale)) return null
  if (!OUTCOMES.includes(game.outcome as ClassicOutcome)) return null

  const reachedStage = asInteger(game.reachedStage, 0, STAGES_COUNT)
  const winnings = asInteger(game.winnings, 0, LADDER[LADDER.length - 1])
  if (reachedStage === undefined || winnings === undefined || !VALID_WINNINGS.has(winnings)) return null

  const playedAt = new Date(String(game.playedAt))
  if (Number.isNaN(playedAt.getTime()) || playedAt.getTime() > Date.now() + 60_000) return null

  return {
    userId,
    clientId: game.clientId,
    locale: game.locale,
    reachedStage,
    winnings,
    outcome: game.outcome as ClassicOutcome,
    lifelinesUsed: asStringArray(game.lifelinesUsed, 4, isLifeline),
    settings: typeof game.settings === 'object' && game.settings !== null ? (game.settings as Prisma.InputJsonObject) : {},
    playedAt,
  }
}

/** POST /classic/sync — `{ games: [...] }`. Idempotent: a game synced twice is stored once. */
classicRouter.post(
  '/sync',
  rateLimit('classic:sync', { limit: 60, windowMs: 60 * 60 * 1000 }),
  asyncHandler(async (req, res) => {
    const userId = req.session!.userId
    const raw = Array.isArray(req.body?.games) ? req.body.games.slice(0, MAX_GAMES_PER_SYNC) : null
    if (!raw) return fail(res, 'games must be an array', 400)

    const games = raw.map((game: unknown) => readGame(game, userId)).filter(Boolean) as SyncedGame[]
    const { count } = await prisma.classicGame.createMany({ data: games, skipDuplicates: true })

    // Accepted ids are returned even when already stored, so the outbox can drop them.
    return ok(res, { stored: count, acceptedClientIds: games.map(({ clientId }) => clientId) })
  })
)

/** GET /classic/history — recent games and the personal best. */
classicRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const userId = req.session!.userId
    const [recent, best] = await Promise.all([
      prisma.classicGame.findMany({ where: { userId }, orderBy: { playedAt: 'desc' }, take: 20 }),
      prisma.classicGame.findFirst({ where: { userId }, orderBy: [{ winnings: 'desc' }, { playedAt: 'asc' }] }),
    ])

    const toEntry = (game: (typeof recent)[number]) => ({
      clientId: game.clientId,
      locale: game.locale,
      reachedStage: game.reachedStage,
      winnings: game.winnings,
      outcome: game.outcome,
      lifelinesUsed: game.lifelinesUsed,
      playedAt: game.playedAt.toISOString(),
    })

    return ok(res, { recent: recent.map(toEntry), best: best ? toEntry(best) : null })
  })
)
