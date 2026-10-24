import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { isUuid } from './request.js'
import { config } from '../config.js'

const GUEST_COOKIE = 'millionaire_guest'
const GUEST_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

/**
 * Who owns a ranked run: a signed-in user, or a guest. Nobody needs an account to play
 * Marathon or Time Attack — the server referees every run the same way — but only a user's
 * runs reach the leaderboard, which needs a name to show.
 */
export type RunOwner = { userId: string; guestId?: never } | { guestId: string; userId?: never }

/**
 * The guest's id: an httpOnly cookie holding a random UUID. It is a bearer secret (122
 * random bits) that only ties a browser to its own runs; it carries no identity and grants
 * nothing else. Created on the first guest run.
 */
const guestIdFor = (req: Request, res: Response): string => {
  const existing = req.cookies?.[GUEST_COOKIE]
  if (typeof existing === 'string' && isUuid(existing)) return existing
  const id = randomUUID()
  res.cookie(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/runs',
    maxAge: GUEST_MAX_AGE_MS,
    ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
  })
  return id
}

export const runOwnerFor = (req: Request, res: Response): RunOwner =>
  req.session ? { userId: req.session.userId } : { guestId: guestIdFor(req, res) }
