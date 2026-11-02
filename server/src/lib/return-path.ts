/**
 * Open-redirect guard for `?returnPath=`. Import-free so it is unit-testable.
 *
 * Only a same-origin, locale-prefixed path is accepted: `/en/play`, `/hy/profile?x=1`.
 * Anything that could leave the origin — `//evil.com`, `/\evil.com`, a scheme, a control
 * character — is refused.
 */
const LOCALE_PATTERN = /^[a-z]{2,3}$|^[a-z]{2}-[A-Z]{2}$/

/** The first path segment: `/hy/play?x=1` → `hy`. */
const firstSegment = (value: string): string => value.slice(1).split(/[/?#]/, 1)[0] ?? ''

export const isAllowedReturnPath = (value: string): boolean => {
  if (value.length > 512) return false
  if (!value.startsWith('/') || value.startsWith('//')) return false
  // Control characters and backslashes (`/\evil.com` is protocol-relative to some browsers).
  for (const char of value) {
    if (char === '\\' || char.charCodeAt(0) < 0x20) return false
  }
  return LOCALE_PATTERN.test(firstSegment(value))
}

/** `/hy/play` → `hy`; falls back to `en`. */
export const localeOfPath = (value: string | null): string => {
  if (!value?.startsWith('/')) return 'en'
  const segment = firstSegment(value)
  return LOCALE_PATTERN.test(segment) ? segment : 'en'
}

/** Pages the account emails link to, under the reader's locale — twins of `ROUTES` on the web. */
export const ACCOUNT_PATH = {
  verifyEmail: '/verify-email',
  resetPassword: '/reset-password',
  forgotPassword: '/forgot-password',
} as const

/** The query both emailed links carry (`TOKEN_QUERY` on the web). */
export const TOKEN_QUERY = 'token'

export const buildWebUrl = (origin: string, path: string, params: Record<string, string> = {}): string => {
  const url = new URL(path.replace(/^\/+/, ''), origin.endsWith('/') ? origin : `${origin}/`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.toString()
}
