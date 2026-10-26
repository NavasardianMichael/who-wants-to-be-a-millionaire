import type { Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export type SessionPayload = {
  userId: string
  /**
   * The `User.tokenVersion` this cookie was minted against. `middleware/auth.ts` refuses the
   * cookie once the row has moved on — the only revocation a stateless JWT has.
   */
  tokenVersion: number
}

const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' })
}

/** `jwt.verify` returns `string | JwtPayload`, so the shape is checked rather than asserted. */
export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    if (typeof decoded !== 'object' || decoded === null) return null

    const { userId, tokenVersion } = decoded as Partial<SessionPayload>
    if (typeof userId !== 'string' || typeof tokenVersion !== 'number') return null

    return { userId, tokenVersion }
  } catch {
    return null
  }
}

/** Shared with `clearSessionCookie`: a browser only overwrites a cookie whose name, path and domain match. */
const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.nodeEnv === 'production',
  path: '/',
  ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
})

export function setSessionCookie(res: Response, payload: SessionPayload) {
  res.cookie(config.cookieName, signSession(payload), {
    ...sessionCookieOptions(),
    maxAge: COOKIE_MAX_AGE_MS,
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.cookieName, sessionCookieOptions())
}
