import { type Response, Router } from 'express'
import { config } from '../config.js'
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
import { buildWebUrl, isAllowedReturnPath, localeOfPath } from '../lib/return-path.js'
import { setSessionCookie } from '../lib/session.js'
import { asyncHandler } from '../middleware/error.js'

/**
 * Google sign-in. A verified Google identity matches an account (by Google id, then by email)
 * or creates one on the spot, and the browser is redirected back to the page it started from.
 * Every branch ends in a top-level redirect, so these routes speak in redirects rather than
 * the JSON envelope.
 */
export const googleRouter = Router()

googleRouter.use(passportInitialize())

/** Failures land back where the flow started, with a stable `?authError=` code the web app translates. */
const redirectBack = (res: Response, returnPath: string | null, params: Record<string, string>): void => {
  res.redirect(buildWebUrl(config.corsOrigin, returnPath ?? `/${localeOfPath(returnPath)}`, params))
}

/** GET /identity/google — initiate. */
googleRouter.get(
  '/',
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

/**
 * Finds the account for a verified identity, or creates it.
 *
 * Linking to an existing account by email is safe only because Google has just proved control
 * of the address. If that account's own address was never verified, whoever registered it
 * may not own the inbox — they could have pre-registered the victim's address and be waiting
 * for them to sign in with Google. So the sign-in **claims** it: the unverified password is
 * cleared and `tokenVersion` bumped, which signs out any session the squatter holds.
 */
const resolveUser = async (identity: GoogleIdentity, locale: string) => {
  const byGoogleId = await prisma.user.findUnique({ where: { googleId: identity.googleId } })
  if (byGoogleId) {
    return prisma.user.update({ where: { id: byGoogleId.id }, data: { googleAvatarUrl: identity.avatarUrl ?? null } })
  }

  const byEmail = await prisma.user.findUnique({ where: { email: identity.email } })
  if (byEmail) {
    const claim = !byEmail.emailVerifiedAt
    // The same address under a new Google id (the user recreated their Google account): the
    // account follows the address, and sessions minted for the old identity end.
    const replacesGoogleId = byEmail.googleId !== null
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: identity.googleId,
        googleAvatarUrl: identity.avatarUrl ?? null,
        emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
        emailVerifyTokenHash: null,
        emailVerifyExpiresAt: null,
        ...(claim ? { passwordHash: null, passwordResetTokenHash: null, passwordResetExpiresAt: null } : {}),
        ...(claim || replacesGoogleId ? { tokenVersion: { increment: 1 } } : {}),
      },
    })
  }

  return prisma.user.create({
    data: {
      email: identity.email,
      googleId: identity.googleId,
      displayName: identity.displayName,
      googleAvatarUrl: identity.avatarUrl ?? null,
      emailVerifiedAt: new Date(),
      locale,
    },
  })
}

/** GET /identity/google/callback */
googleRouter.get(
  '/callback',
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
