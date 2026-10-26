/**
 * The session cookie's `Domain`, derived from the web origin. Import-free so unit tests can
 * reach it without loading `.env`.
 *
 * - Not production → empty (host-only): dev serves web and API on `localhost`, and cookies
 *   ignore ports, so one host-only cookie already covers both.
 * - No dot in the hostname → empty: browsers reject `Domain=localhost`.
 * - Otherwise → the web origin's hostname, which covers itself and its `api.` subdomain.
 *   Deliberately not the registrable domain, which would hand the JWT to every sibling app.
 */
export const deriveCookieDomain = (nodeEnv: string, corsOrigin: string): string => {
  if (nodeEnv !== 'production') return ''

  try {
    const { hostname } = new URL(corsOrigin)
    return hostname.includes('.') ? hostname : ''
  } catch {
    return ''
  }
}
