import { Router } from 'express'
import { fail, ok } from '../lib/api-response.js'
import { type BadgeId, isBadgeId } from '../lib/game.js'
import { prisma } from '../lib/prisma.js'
import { asStringArray } from '../lib/request.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { awardBadges, isClientBadge } from '../services/badges.js'

export const badgesRouter = Router()

badgesRouter.use(requireAuth)

badgesRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const badges = await prisma.userBadge.findMany({ where: { userId: req.session!.userId }, orderBy: { earnedAt: 'asc' } })
    return ok(res, badges.map(({ badgeId, earnedAt }) => ({ badgeId, earnedAt: earnedAt.toISOString() })))
  })
)

/**
 * POST /badges/sync — badges earned on the device (guest or offline play) merged into the
 * account. Server-only badges are ignored: those come from refereed runs.
 */
badgesRouter.post(
  '/sync',
  asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body?.badgeIds)) return fail(res, 'badgeIds must be an array', 400)
    const badgeIds = (asStringArray(req.body.badgeIds, 40, isBadgeId) as BadgeId[]).filter(isClientBadge)

    const awarded = await awardBadges(req.session!.userId, badgeIds)
    const all = await prisma.userBadge.findMany({ where: { userId: req.session!.userId }, orderBy: { earnedAt: 'asc' } })
    return ok(res, {
      awarded,
      badges: all.map(({ badgeId, earnedAt }) => ({ badgeId, earnedAt: earnedAt.toISOString() })),
    })
  })
)
