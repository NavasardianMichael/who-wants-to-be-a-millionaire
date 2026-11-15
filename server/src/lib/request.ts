import { isIPv4, isIPv6 } from 'node:net'

/**
 * Body-reading helpers shared by the routers. The server carries no schema validator, so
 * every route hand-reads `req.body` through these.
 */

/** `undefined` for anything that is not a non-empty string once trimmed. */
export const asTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

/** Trimmed, then capped — for free text whose length is not itself the signal. */
export const asBoundedString = (value: unknown, max: number): string | undefined =>
  asTrimmedString(value)?.slice(0, max)

export const asInteger = (value: unknown, min: number, max: number): number | undefined => {
  const parsed = typeof value === 'string' ? Number(value) : value
  if (typeof parsed !== 'number' || !Number.isInteger(parsed)) return undefined
  return parsed >= min && parsed <= max ? parsed : undefined
}

/** Keeps the strings of an array that pass `accept`, capped at `max` entries. */
export const asStringArray = (value: unknown, max: number, accept: (item: string) => boolean = () => true): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && accept(item)).slice(0, max)
    : []

/** RFC 5321's limit on a full address. */
export const MAX_EMAIL_LENGTH = 254

/** Shape check only — Google has already verified the address. Length runs first to bound the regex. */
export const isEmail = (value: string): boolean =>
  value.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: string): boolean => UUID_PATTERN.test(value)

/** A leaderboard name; mirrored by the profile and sign-up forms. */
export const DISPLAY_NAME_LIMITS = { min: 2, max: 24 } as const

/**
 * `undefined` unless 2–24 characters once trimmed, with no control or zero-width characters —
 * they make two names look identical on the board.
 */
export const asDisplayName = (value: unknown): string | undefined => {
  const name = asBoundedString(value, DISPLAY_NAME_LIMITS.max + 1)
  if (!name || name.length < DISPLAY_NAME_LIMITS.min || name.length > DISPLAY_NAME_LIMITS.max) return undefined
  return /[\p{Cc}\p{Cf}]/u.test(name) ? undefined : name
}

/** Lower-cased, so `Ann@x.com` and `ann@x.com` are one account (the column is citext too). */
export const asEmail = (value: unknown): string | undefined => {
  const email = asTrimmedString(value)?.toLowerCase()
  return email && isEmail(email) ? email : undefined
}

const expandIpv6 = (ip: string): string[] => {
  const [head = '', tail = ''] = ip.split('::')
  const start = head ? head.split(':') : []
  const end = tail ? tail.split(':') : []
  return [...start, ...Array<string>(Math.max(0, 8 - start.length - end.length)).fill('0'), ...end]
}

/**
 * The address rate limits are keyed on (`trust proxy` is 1, so `req.ip` is the client behind
 * nginx). An IPv6 client is its /64 — one household or phone gets a whole /64 and could
 * otherwise rotate through it without end — and an IPv4-mapped address (`::ffff:1.2.3.4`) is
 * the IPv4 address itself.
 */
export const clientAddress = (req: { ip?: string | undefined }): string => {
  const ip = (req.ip ?? '').split('%')[0] ?? ''
  if (!ip) return 'unknown'
  const mapped = ip.toLowerCase().startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ''
  if (isIPv4(mapped)) return mapped
  if (!isIPv6(ip)) return ip
  const prefix = expandIpv6(ip)
    .slice(0, 4)
    .map((group) => parseInt(group, 16).toString(16))
    .join(':')
  return `${prefix}::/64`
}

/**
 * A request from this host itself, judged on the raw `req.ip`: the web app's server-side
 * renders reach the API on 127.0.0.1, past nginx, so they carry no visitor's address.
 */
export const isLoopback = (req: { ip?: string | undefined }): boolean => {
  const ip = (req.ip ?? '').toLowerCase()
  return ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')
}
