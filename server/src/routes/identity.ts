import { type Response, Router } from 'express'
import { googleRouter } from './identity-google.js'
import { mailLocale, sendPasswordChangedNotice, sendPasswordResetLink, sendVerificationLink } from '../lib/account-mail.js'
import { fail, ok } from '../lib/api-response.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { DEFAULT_LOCALE, isLocale } from '../lib/locales.js'
import { hashPassword, needsRehash, validatePassword, verifyDummyPassword, verifyPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { asDisplayName, asEmail } from '../lib/request.js'
import { clearSessionCookie, setSessionCookie } from '../lib/session.js'
import { hashUrlToken } from '../lib/token.js'
import { toSessionUser } from '../mappers/entities.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'

/**
 * Two ways in, one account per address: Google (`identity-google.ts`) and email + password.
 * A password sign-up has no session until its emailed verification link is opened. Every
 * failure the player can fix carries an `ERROR_CODE` the web app translates.
 */
export const identityRouter = Router()

identityRouter.use('/google', googleRouter)

/**
 * Argon2 holds 64 MiB per hash, so these limiters are load-bearing, not decorative. Login is
 * keyed on IP + address: one attacker cannot lock a player out from elsewhere.
 */
const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 })
const registerLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 })
const mailLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })
const tokenLimiter = createRateLimiter({ limit: 20, windowMs: 15 * 60 * 1000 })

const limited = (res: Response, retryAfterSeconds: number): void => {
  res.setHeader('Retry-After', String(retryAfterSeconds))
  fail(res, 'Too many attempts', 429, 429)
}

const mailFailed = (res: Response): void => fail(res, 'Email could not be sent', 503, 503)

const readToken = (value: unknown): string => (typeof value === 'string' && value.length <= 128 ? value : '')

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

/**
 * POST /identity/register — creates the account inactive and mails its verification link.
 * Answers with the address the link went to, for the "check your inbox" screen.
 */
identityRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const verdict = registerLimiter(req.ip ?? 'unknown')
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const email = asEmail(req.body?.email)
    if (!email) return fail(res, 'A valid email is required', 400, 400)
    const displayName = asDisplayName(req.body?.displayName)
    if (!displayName) return fail(res, 'displayName must be 2-24 characters', ERROR_CODE.invalidDisplayName, 400)
    const password = validatePassword(req.body?.password, { email })
    if (!password.ok) return fail(res, password.message, ERROR_CODE.weakPassword, 400)

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) return fail(res, 'An account with this email already exists', ERROR_CODE.emailTaken, 409)

    const locale = isLocale(req.body?.locale) ? req.body.locale : DEFAULT_LOCALE
    const user = await prisma.user.create({
      data: { email, displayName, locale, passwordHash: await hashPassword(req.body.password as string) },
    })
    // Undone when the link cannot go, so trying again is a fresh sign-up rather than
    // "email taken" on a dead account.
    const undo = () => prisma.user.delete({ where: { id: user.id } })
    const sent = await sendVerificationLink(user, locale).catch(async (error: unknown) => {
      await undo()
      throw error
    })
    if (!sent.ok) {
      await undo()
      return mailFailed(res)
    }
    return ok(res, { email: user.email }, 201)
  })
)

/** POST /identity/login */
identityRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = asEmail(req.body?.email)
    const password = typeof req.body?.password === 'string' ? (req.body.password as string).slice(0, 256) : ''

    const verdict = loginLimiter(`${req.ip ?? 'unknown'}:${email ?? ''}`)
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const user = email ? await prisma.user.findUnique({ where: { email } }) : null

    // The same hashing time for "no such account" and "wrong password", so timing tells nothing.
    if (!user?.passwordHash) {
      await verifyDummyPassword(password)
      if (user?.googleId) return fail(res, 'This account signs in with Google', ERROR_CODE.googleOnlyAccount, 401)
      return fail(res, 'Invalid email or password', ERROR_CODE.invalidCredentials, 401)
    }
    if (!(await verifyPassword(user.passwordHash, password))) {
      return fail(res, 'Invalid email or password', ERROR_CODE.invalidCredentials, 401)
    }

    if (needsRehash(user.passwordHash)) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } })
    }
    // Only after the password matched, so this answer reveals nothing a stranger could not already learn.
    if (!user.emailVerifiedAt) return fail(res, 'Email is not verified', ERROR_CODE.emailNotVerified, 403)

    setSessionCookie(res, { userId: user.id, tokenVersion: user.tokenVersion })
    return ok(res, toSessionUser(user))
  })
)

/**
 * POST /identity/email/resend — a fresh verification link. Always answers ok, so it cannot be
 * used to learn which addresses have accounts; mails only an unverified password account.
 */
identityRouter.post(
  '/email/resend',
  asyncHandler(async (req, res) => {
    const verdict = mailLimiter(req.ip ?? 'unknown')
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const email = asEmail(req.body?.email)
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null
    if (user?.passwordHash && !user.emailVerifiedAt) {
      const sent = await sendVerificationLink(user, mailLocale(req.body?.locale, user.locale))
      if (!sent.ok) return mailFailed(res)
    }
    return ok(res, true)
  })
)

/**
 * POST /identity/email/verify — opening the emailed link activates the account, and only
 * that: no session is issued, the player signs in next. Single use, and the page asks for a
 * click before calling this, so a mail scanner that prefetches the link cannot spend it.
 */
identityRouter.post(
  '/email/verify',
  asyncHandler(async (req, res) => {
    const verdict = tokenLimiter(req.ip ?? 'unknown')
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const token = readToken(req.body?.token)
    const user = token ? await prisma.user.findUnique({ where: { emailVerifyTokenHash: hashUrlToken(token) } }) : null
    if (!user?.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
      return fail(res, 'Verification link is invalid or expired', ERROR_CODE.verifyTokenInvalid, 400)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date(), emailVerifyTokenHash: null, emailVerifyExpiresAt: null },
    })
    return ok(res, { email: user.email })
  })
)

/** POST /identity/password/forgot — always answers ok, so it cannot be used to learn which addresses have accounts. */
identityRouter.post(
  '/password/forgot',
  asyncHandler(async (req, res) => {
    const verdict = mailLimiter(req.ip ?? 'unknown')
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const email = asEmail(req.body?.email)
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null
    if (user) {
      const sent = await sendPasswordResetLink(user, mailLocale(req.body?.locale, user.locale))
      if (!sent.ok) return mailFailed(res)
    }
    return ok(res, true)
  })
)

/**
 * POST /identity/password/link — the signed-in way to set a password (a Google account's
 * first) or change one: the same one-hour, single-use link as a forgotten password, so it
 * takes the mailbox, not just an unlocked session.
 */
identityRouter.post(
  '/password/link',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req.session!
    const verdict = mailLimiter(userId)
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    const sent = await sendPasswordResetLink(user, mailLocale(req.body?.locale, user.locale))
    if (!sent.ok) return mailFailed(res)
    return ok(res, true)
  })
)

/**
 * POST /identity/password/reset — sets the new password, signs out every other session and
 * signs this browser in. The link came through the inbox, so it proves the address too: an
 * account that never opened its verification link is activated here.
 */
identityRouter.post(
  '/password/reset',
  asyncHandler(async (req, res) => {
    const verdict = tokenLimiter(req.ip ?? 'unknown')
    if (!verdict.allowed) return limited(res, verdict.retryAfterSeconds)

    const token = readToken(req.body?.token)
    const user = token ? await prisma.user.findUnique({ where: { passwordResetTokenHash: hashUrlToken(token) } }) : null
    if (!user?.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return fail(res, 'Reset link is invalid or expired', ERROR_CODE.resetTokenInvalid, 400)
    }

    const check = validatePassword(req.body?.password, { email: user.email })
    if (!check.ok) return fail(res, check.message, ERROR_CODE.weakPassword, 400)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(req.body.password as string),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        emailVerifyTokenHash: null,
        emailVerifyExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    })
    setSessionCookie(res, { userId: updated.id, tokenVersion: updated.tokenVersion })
    // Not awaited: the notice must not hold up, or fail, the reset itself.
    void sendPasswordChangedNotice(updated, mailLocale(req.body?.locale, updated.locale)).catch((error: unknown) =>
      console.error('[identity] password-changed notice failed', error)
    )
    return ok(res, toSessionUser(updated))
  })
)

identityRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  ok(res, true)
})
