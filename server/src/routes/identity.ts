import { type Response, Router } from 'express'
import { config } from '../config.js'
import { ok } from '../lib/api-response.js'
import {
  ensureGoogleStrategy,
  GOOGLE_ERROR,
  GOOGLE_STRATEGY,
  type GoogleIdentity,
  passport,
  passportInitialize,
} from '../lib/google-oauth.js'
import { prisma } from '../lib/prisma.js'
import { asTrimmedString } from '../lib/request.js'
import { isAllowedReturnPath, localeOfPath } from '../lib/return-path.js'
import { clearSessionCookie, setSessionCookie } from '../lib/session.js'
import { toSessionUser } from '../mappers/entities.js'
import { asyncHandler } from '../middleware/error.js'

/**
 * Google-only sign-in. There is no registration form: a verified Google identity either
 * matches an account (by Google id, then by email) or creates one on the spot, and the
 * browser is redirected back to the page it started from.
 */
export const identityRouter = Router()

identityRouter.use('/google', passportInitialize())

const webUrl = (path: string, params: Record<string, string> = {}): string => {
  const origin = config.corsOrigin.endsWith('/') ? config.corsOrigin : `${config.corsOrigin}/`
  const url = new URL(path.replace(/^\/+/, ''), origin)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.toString()
}

/** Failures land back where the flow started, with a stable `?authError=` code the web app translates. */
const redirectBack = (res: Response, returnPath: string | null, params: Record<string, string>): void => {
  res.redirect(webUrl(returnPath ?? `/${localeOfPath(returnPath)}`, params))
}

/** GET /identity/google — initiate. */
identityRouter.get(
  '/google',
  asyncHandler(async (req, res) => {
    const raw = asTrimmedString(req.query.returnPath)
    const returnPath = raw && isAllowedReturnPath(raw) ? raw : null

    if (!ensureGoogleStrategy()) return redirectBack(res, returnPath, { authError: GOOGLE_ERROR.unavailable })

    // An object `state` is the documented way into a custom store; a string would bypass it.
    const options = {
      session: false,
      state: { returnPath },
      prompt: 'select_account',
    } as unknown as Parameters<typeof passport.authenticate>[1]

    return passport.authenticate(GOOGLE_STRATEGY, options)(req, res, () => undefined)
  })
)

const failureCode = (info: unknown): string => {
  const message = (info as { message?: string } | undefined)?.message
  const known = Object.values(GOOGLE_ERROR) as string[]
  return message && known.includes(message) ? message : GOOGLE_ERROR.exchangeFailed
}

/** Finds the account for a verified identity, or creates it. */
const resolveUser = async (identity: GoogleIdentity, locale: string) => {
  const byGoogleId = await prisma.user.findUnique({ where: { googleId: identity.googleId } })
  if (byGoogleId) {
    return prisma.user.update({ where: { id: byGoogleId.id }, data: { googleAvatarUrl: identity.avatarUrl ?? null } })
  }

  // The same address under a new Google id (the user recreated their Google account):
  // Google has just proved control of it, so the account follows the address.
  const byEmail = await prisma.user.findUnique({ where: { email: identity.email } })
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: identity.googleId, googleAvatarUrl: identity.avatarUrl ?? null, tokenVersion: { increment: 1 } },
    })
  }

  return prisma.user.create({
    data: {
      email: identity.email,
      googleId: identity.googleId,
      displayName: identity.displayName,
      googleAvatarUrl: identity.avatarUrl ?? null,
      locale,
    },
  })
}

/** GET /identity/google/callback */
identityRouter.get(
  '/google/callback',
  asyncHandler(async (req, res, next) => {
    if (!ensureGoogleStrategy()) return redirectBack(res, null, { authError: GOOGLE_ERROR.unavailable })
    if (req.query.error) return redirectBack(res, null, { authError: GOOGLE_ERROR.denied })

    return passport.authenticate(
      GOOGLE_STRATEGY,
      { session: false },
      (err: unknown, identity: GoogleIdentity | false, info: unknown) => {
        const returnPath = req.oauthFlow?.returnPath ?? null
        if (err) return next(err)
        if (!identity) return redirectBack(res, returnPath, { authError: failureCode(info) })

        resolveUser(identity, localeOfPath(returnPath))
          .then((user) => {
            setSessionCookie(res, { userId: user.id, tokenVersion: user.tokenVersion })
            redirectBack(res, returnPath, { signedIn: '1' })
          })
          .catch(next)
      }
    )(req, res, next)
  })
)

/**
 * GET /identity/me — a guest probe, run on every page load. A guest gets `null` with a 200,
 * not a 401: being signed out is a normal state, and a 401 here would log a console error
 * in every guest's browser.
 */
identityRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = req.session ? await prisma.user.findUnique({ where: { id: req.session.userId } }) : null
    return ok(res, user ? toSessionUser(user) : null)
  })
)

identityRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  ok(res, true)
})
