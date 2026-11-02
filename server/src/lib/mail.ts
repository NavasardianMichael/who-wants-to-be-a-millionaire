import { config } from '../config.js'

/**
 * The only client for the mail engine (shared with bookie), and the only module that reads
 * `MAIL_API_KEY`. Two endpoints, and the split is a real boundary:
 *
 * - `/mail/internal/send` reaches **us** (the contact form): the engine owns the recipient,
 *   so it cannot be aimed anywhere else.
 * - `/mail/external/send` reaches **a user** at an address they hold (account emails).
 *
 * Replies to an external send reach the engine's owner, not us — so no mail may ask its reader
 * to reply. The key never leaves this module: not returned, not put in an error, not logged.
 */
const MAIL_TIMEOUT_MS = 10_000

/**
 * Every external send goes out as `Millionaire <millionaire@…>`: the engine owns the
 * domain, only the part before `@` is ours. Fixed for every kind of mail, since mailbox
 * providers build reputation per sender.
 */
const EXTERNAL_SENDER = { fromName: 'Millionaire', mailFromPrefix: 'millionaire' } as const

export type InternalMailPayload = {
  subject?: string
  body?: string
  senderEmail?: string
  firstName?: string
  lastName?: string
  /** Free-form context shown beside the message. Keep it small and non-sensitive. */
  details?: Record<string, unknown>
}

export type ExternalMailPayload = {
  to: string
  subject: string
  /** Both, so text-only clients render. */
  text: string
  html: string
}

export type MailResult =
  | { ok: true; messageId?: string }
  /** `status: 0` means the request never left — not configured, timed out, or DNS. */
  | { ok: false; status: number; message: string }

type MailEngineResponse = {
  success?: boolean
  message?: string
  messageId?: string
  errors?: { field?: string; message?: string }[]
}

/** False in local dev, where `.env.example` ships an empty key on purpose. */
export const isMailConfigured = (): boolean => Boolean(config.mail.apiUrl && config.mail.apiKey)

const describeFailure = (status: number, parsed: MailEngineResponse | null): string => {
  const fields = parsed?.errors?.map((each) => [each.field, each.message].filter(Boolean).join(': ')).filter(Boolean)
  const detail = fields?.length ? ` (${fields.join('; ')})` : ''
  return `${parsed?.message ?? `Mail engine responded ${status}`}${detail}`
}

const send = async (kind: 'internal' | 'external', payload: object): Promise<MailResult> => {
  if (!isMailConfigured()) return { ok: false, status: 0, message: 'Mail engine is not configured' }

  let response: Response
  try {
    // Joined by hand rather than `new URL(path, base)`, which would discard a base path.
    response = await fetch(`${config.mail.apiUrl}/mail/${kind}/send`, {
      method: 'POST',
      // JSON is UTF-8 by spec; said explicitly so no engine guesses otherwise for non-Latin copy.
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'x-api-key': config.mail.apiKey },
      body: JSON.stringify({ appId: config.mail.appId, ...payload }),
      signal: AbortSignal.timeout(MAIL_TIMEOUT_MS),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mail request failed'
    console.error(`[mail] ${kind} send did not complete: ${message}`)
    return { ok: false, status: 0, message }
  }

  const parsed = (await response.json().catch(() => null)) as MailEngineResponse | null
  if (!response.ok || parsed?.success === false) {
    const message = describeFailure(response.status, parsed)
    // Status and the engine's message only — never the headers, which carry the key.
    console.error(`[mail] ${kind} send failed: ${response.status} ${message}`)
    return { ok: false, status: response.status, message }
  }
  return { ok: true, messageId: parsed?.messageId }
}

export const sendInternalMail = (payload: InternalMailPayload): Promise<MailResult> => send('internal', payload)

/**
 * Mail about the reader's own account. Unconfigured is normal in dev, where the mail prints
 * here instead, links included; in production it is an outage, and the caller must not
 * pretend the mail went.
 */
export const sendAccountMail = async (label: string, payload: ExternalMailPayload): Promise<MailResult> => {
  if (!isMailConfigured()) {
    if (config.nodeEnv === 'production') {
      console.error(`[mail] ${label} not sent: MAIL_API_URL or MAIL_API_KEY is empty`)
      return { ok: false, status: 0, message: 'Mail engine is not configured' }
    }
    console.log(`[mail] ${label} for ${payload.to}\n${payload.text}`)
    return { ok: true }
  }
  return send('external', { ...EXTERNAL_SENDER, ...payload })
}

export const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
