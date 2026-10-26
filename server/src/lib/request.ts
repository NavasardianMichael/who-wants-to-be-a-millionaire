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
