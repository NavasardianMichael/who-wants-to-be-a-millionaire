import { type BadgeId, type RankedMode, SERVER_BADGES } from '../lib/game.js'
import { prisma } from '../lib/prisma.js'

/**
 * Badges the server awards from runs it refereed. Every other badge is earned on the device
 * (it covers offline and guest play) and merged in by `POST /badges/sync`.
 */
const RUN_THRESHOLDS: Record<RankedMode, [number, BadgeId][]> = {
  marathon: [
    [10, 'marathon10'],
    [25, 'marathon25'],
    [50, 'marathon50'],
    [100, 'marathon100'],
  ],
  timeAttack: [
    [15, 'timeAttack15'],
    [30, 'timeAttack30'],
  ],
}

export const runBadges = (mode: RankedMode, correctCount: number): BadgeId[] =>
  RUN_THRESHOLDS[mode].filter(([threshold]) => correctCount >= threshold).map(([, badge]) => badge)

/** Stores what is new and returns only that, so the client can celebrate it. */
export const awardBadges = async (userId: string, badgeIds: readonly BadgeId[]): Promise<BadgeId[]> => {
  if (!badgeIds.length) return []
  const owned = await prisma.userBadge.findMany({
    where: { userId, badgeId: { in: [...badgeIds] } },
    select: { badgeId: true },
  })
  const ownedIds = new Set(owned.map(({ badgeId }) => badgeId))
  const fresh = badgeIds.filter((badgeId) => !ownedIds.has(badgeId))
  if (!fresh.length) return []

  await prisma.userBadge.createMany({
    data: fresh.map((badgeId) => ({ userId, badgeId })),
    skipDuplicates: true,
  })
  return fresh
}

/** Client-earned badges are accepted; server-only ones are not the client's to claim. */
export const isClientBadge = (badgeId: BadgeId): boolean => !SERVER_BADGES.includes(badgeId)
