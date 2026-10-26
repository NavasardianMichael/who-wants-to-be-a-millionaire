import { Router } from 'express'
import { fail, ok } from '../lib/api-response.js'
import { isRankedMode } from '../lib/game.js'
import { isLocale } from '../lib/locales.js'
import { asBoundedString, asInteger } from '../lib/request.js'
import { toLeaderboardEntry } from '../mappers/entities.js'
import { asyncHandler } from '../middleware/error.js'
import { getLeaderboard } from '../services/leaderboard.js'

export const leaderboardsRouter = Router()

const PAGE_SIZE = 20

/** GET /leaderboards?mode=&locale=&q=&period=&page= — public; the viewer's own row when signed in. */
leaderboardsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const mode = req.query.mode ?? 'marathon'
    if (!isRankedMode(mode)) return fail(res, 'mode must be marathon or timeAttack', 400)

    const locale = req.query.locale
    if (locale !== undefined && locale !== '' && !isLocale(locale)) return fail(res, 'Unsupported locale', 400)

    const { rows, total, viewer } = await getLeaderboard({
      mode,
      locale: isLocale(locale) ? locale : undefined,
      search: asBoundedString(req.query.q, 40),
      period: req.query.period === 'week' ? 'week' : 'all',
      page: asInteger(req.query.page, 1, 500) ?? 1,
      pageSize: PAGE_SIZE,
      viewerId: req.session?.userId,
    })

    // Signed-in responses carry the viewer's row, so they must not be shared by a cache.
    res.setHeader('Cache-Control', req.session ? 'private, no-store' : 'public, max-age=30')
    return ok(res, {
      entries: rows.map(toLeaderboardEntry),
      total,
      pageSize: PAGE_SIZE,
      viewer: viewer ? toLeaderboardEntry(viewer) : null,
    })
  })
)
