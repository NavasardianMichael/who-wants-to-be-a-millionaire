import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { isLocale, LOCALE_COOKIE, RETIRED_LOCALES } from '@i18n/config'
import { matchAcceptLanguage } from '@i18n/matchAcceptLanguage'
import { splitLocaleFromPathname } from '@i18n/pathname'
import { routing } from '@i18n/routing'

/**
 * Next 16 renamed Middleware to Proxy. Two jobs, in order (bookie's design):
 *
 * 1. **Send unprefixed traffic to a locale** — `/play` becomes `/hy/play` for an Armenian
 *    browser — chosen from the `NEXT_LOCALE` cookie, then `Accept-Language`
 *    (`matchAcceptLanguage`, which beats next-intl's own negotiation for real users).
 * 2. **Hand off to next-intl**, which validates the prefix.
 *
 * There is no auth guard here: the profile and settings pages render a sign-in prompt
 * themselves, and every protected API route checks the session on its own.
 */
const handleI18nRouting = createMiddleware(routing)

/** Extension-less metadata routes; without this list `/icon` would 307 to `/en/icon`. */
const LOCALE_AGNOSTIC = new Set(['/icon', '/apple-icon', '/icon-maskable', '/opengraph-image', '/monitoring'])

/** `/tr/play` → `/play`: a retired locale's prefix is dropped, then negotiated like any unprefixed URL. */
const stripRetiredLocale = (pathname: string) => {
  const [, first, ...rest] = pathname.split('/')
  return RETIRED_LOCALES.includes(first) ? `/${rest.join('/')}` : pathname
}

const negotiateLocale = (request: NextRequest) => {
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(chosen)) return chosen
  return matchAcceptLanguage(request.headers.get('accept-language'))
}

/**
 * The redirect target depends on who is asking, so a shared cache must neither store nor
 * replay it. 307, never 308: a permanent redirect would pin a visitor to the first language
 * they ever negotiated.
 */
const personalizedRedirect = (target: URL) => {
  const response = NextResponse.redirect(target)
  response.headers.set('Vary', 'Accept-Language, Cookie')
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export function proxy(request: NextRequest) {
  const { locale, pathname } = splitLocaleFromPathname(request.nextUrl.pathname)

  if (LOCALE_AGNOSTIC.has(pathname)) {
    if (!locale) return NextResponse.next()
    const target = request.nextUrl.clone()
    target.pathname = pathname
    return NextResponse.rewrite(target)
  }

  if (!locale) {
    const target = request.nextUrl.clone()
    const negotiated = negotiateLocale(request)
    const rest = stripRetiredLocale(pathname)
    target.pathname = rest === '/' ? `/${negotiated}` : `/${negotiated}${rest}`
    return personalizedRedirect(target)
  }

  return handleI18nRouting(request)
}

/** Every page route; skips Next internals and anything with a file extension (`/sw.js`, audio, packs). */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)'],
}
