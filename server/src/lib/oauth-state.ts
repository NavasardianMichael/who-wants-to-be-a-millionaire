import type { Request } from 'express'
import jwt from 'jsonwebtoken'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'

/**
 * A cookie-backed `state` store for `passport-oauth2` (same design as bookie).
 *
 * Passport's own stores need `express-session`, which this server does not have, and the
 * fallback `NullStore` means no nonce and no PKCE — a callback that accepts any
 * attacker-supplied `code`. This keeps the nonce, the PKCE verifier and the flow context in
 * a short-lived signed cookie; the callback's `state` must match the nonce in *this
 * browser's* cookie.
 */
export type OAuthFlowContext = {
  /** Already vetted by `isAllowedReturnPath` at initiate time. */
  returnPath: string | null
}

type OAuthFlowCookie = OAuthFlowContext & { nonce: string; verifier: string }

const COOKIE_PATH = '/identity/google'

const cookieOptions = () => ({
  httpOnly: true,
  // `lax`, not `strict`: Google returns the user via a top-level GET navigation.
  sameSite: 'lax' as const,
  secure: config.nodeEnv === 'production',
  path: COOKIE_PATH,
})

const nonceMatches = (received: string, expected: string): boolean => {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * **The parameter counts are load-bearing.** passport-oauth2 dispatches on `store.length`
 * and `verify.length`: five parameters on `store` hand over the PKCE verifier, four on
 * `verify` pass `meta`. Do not remove the unused ones.
 */
export const oauthStateStore = {
  store(
    req: Request,
    verifier: string,
    state: unknown,
    _meta: unknown,
    callback: (err: Error | null, state?: string) => void
  ): void {
    const context = (state ?? {}) as Partial<OAuthFlowContext>
    const nonce = randomBytes(32).toString('base64url')
    const payload: OAuthFlowCookie = { nonce, verifier, returnPath: context.returnPath ?? null }

    try {
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: Math.floor(config.oauthFlowTtlMs / 1000) })
      req.res?.cookie(config.oauthCookieName, token, { ...cookieOptions(), maxAge: config.oauthFlowTtlMs })
    } catch (error) {
      return callback(error as Error)
    }

    return callback(null, nonce)
  },

  /** Clears the cookie first and unconditionally — the flow is single-use. */
  verify(
    req: Request,
    state: string,
    _meta: unknown,
    callback: (err: Error | null, ok?: string | false, info?: { message: string }) => void
  ): void {
    const raw = req.cookies?.[config.oauthCookieName] as string | undefined
    req.res?.clearCookie(config.oauthCookieName, cookieOptions())

    if (!raw) return callback(null, false, { message: 'google_state_missing' })

    let payload: OAuthFlowCookie
    try {
      payload = jwt.verify(raw, config.jwtSecret) as OAuthFlowCookie
    } catch {
      return callback(null, false, { message: 'google_state_missing' })
    }

    if (typeof state !== 'string' || !state || !nonceMatches(state, payload.nonce)) {
      return callback(null, false, { message: 'google_state_mismatch' })
    }

    req.oauthFlow = { returnPath: payload.returnPath }
    return callback(null, payload.verifier)
  },
}
