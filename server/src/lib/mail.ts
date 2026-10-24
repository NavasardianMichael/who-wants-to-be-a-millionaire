import { config } from '../config.js'

/**
 * The only client for the mail engine (shared with bookie), and the only module that reads
 * `MAIL_API_KEY`. This app sends one kind of mail — the contact form, to our own inbox — so
 * only the engine's **internal** endpoint is wired: it has no `to`, it can reach nobody else.
 *
 * The key never leaves this module: not returned, not put in an error, not logged.
 */
const MAIL_TIMEOUT_MS = 10_000

export type InternalMailPayload = {
  subject?: string
  body?: string
  senderEmail?: string
  firstName?: string
  lastName?: string
  /** Free-form context shown beside the message. Keep it small and non-sensitive. */
  details?: Record<string, unknown>
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

export const sendInternalMail = async (payload: InternalMailPayload): Promise<MailResult> => {
  if (!isMailConfigured()) return { ok: false, status: 0, message: 'Mail engine is not configured' }

  let response: Response
  try {
    // Joined by hand rather than `new URL(path, base)`, which would discard a base path.
    response = await fetch(`${config.mail.apiUrl}/mail/internal/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.mail.apiKey },
      body: JSON.stringify({ appId: config.mail.appId, ...payload }),
      signal: AbortSignal.timeout(MAIL_TIMEOUT_MS),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mail request failed'
    console.error(`[mail] internal send did not complete: ${message}`)
    return { ok: false, status: 0, message }
  }

  const parsed = (await response.json().catch(() => null)) as MailEngineResponse | null
  if (!response.ok || parsed?.success === false) {
    const message = describeFailure(response.status, parsed)
    // Status and the engine's message only — never the headers, which carry the key.
    console.error(`[mail] internal send failed: ${response.status} ${message}`)
    return { ok: false, status: response.status, message }
  }
  return { ok: true, messageId: parsed?.messageId }
}

export const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
