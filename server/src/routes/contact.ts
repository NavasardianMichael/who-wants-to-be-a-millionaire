import { Router } from 'express'
import { config } from '../config.js'
import { fail, ok } from '../lib/api-response.js'
import { escapeHtml, isMailConfigured, sendInternalMail } from '../lib/mail.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { asBoundedString, asTrimmedString, isEmail } from '../lib/request.js'
import { asyncHandler } from '../middleware/error.js'

/**
 * The contact page's only endpoint (bookie's design). Unauthenticated — the player who
 * cannot sign in is the one most likely to write — though `optionalAuth` still identifies
 * a signed-in sender.
 *
 * Nothing is stored: the inbox is the record, so a failed send is reported to the visitor
 * rather than kept silently.
 */
export const contactRouter = Router()

/** Mirrored by `CONTACT_LIMITS` on the client, which validates the same fields. */
const MAX_NAME_LENGTH = 60
const MAX_MESSAGE_LENGTH = 2000

/** Five an hour per IP: plenty for a person, far below the mail engine's shared quota. */
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })

/** Every value came from a request body, so it is escaped before going into our HTML. */
const htmlBodyFor = (message: string, email: string, locale: string | undefined): string =>
  [
    `<p><strong>Email</strong><br/>${escapeHtml(email)}</p>`,
    locale ? `<p><strong>Language</strong><br/>${escapeHtml(locale)}</p>` : '',
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  ].join('')

contactRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    // Honeypot: a field no person can see. Answered as a success, so a bot learns nothing.
    if (asTrimmedString(req.body?.website)) return ok(res, true)

    const name = asBoundedString(req.body?.name, MAX_NAME_LENGTH)
    const message = asBoundedString(req.body?.message, MAX_MESSAGE_LENGTH)
    const email = asTrimmedString(req.body?.email)?.toLowerCase()
    const locale = asBoundedString(req.body?.locale, 10)
    if (!name) return fail(res, 'Name is required')
    if (!message) return fail(res, 'Message is required')
    // A reply-to that cannot be replied to is worse than none, because it looks answerable.
    if (!email || !isEmail(email)) return fail(res, 'Valid email required')

    // Counted after validation: only a message about to be mailed spends from the budget.
    const verdict = limiter(req.ip ?? 'unknown')
    if (!verdict.allowed) {
      res.setHeader('Retry-After', String(verdict.retryAfterSeconds))
      return fail(res, 'Too many messages from this address. Please try again later.', 429, 429)
    }

    // Dev ships an empty key: print the message and report success. In production an
    // unconfigured engine is an outage and must not look like a delivered message.
    if (!isMailConfigured()) {
      if (config.nodeEnv === 'production') return fail(res, 'Contact is temporarily unavailable.', 503, 503)
      console.log(`[contact] ${name} <${email}> (${locale ?? '?'})\n${message}`)
      return ok(res, true)
    }

    const result = await sendInternalMail({
      subject: `Millionaire Quiz — contact form — ${name}`,
      body: htmlBodyFor(message, email, locale),
      senderEmail: email,
      firstName: name,
      details: { signedIn: Boolean(req.session), locale },
    })
    if (!result.ok) {
      const status = result.status === 429 ? 429 : 502
      return fail(res, 'We could not send your message. Please try again in a moment.', status, status)
    }
    return ok(res, true)
  })
)
