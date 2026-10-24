import type { MetadataRoute } from 'next'
import { ROUTES } from '@constants/routes'
import { absoluteUrl } from '@helpers/url'

/**
 * Every page is locale-prefixed, so each private path needs the `*` wildcard. Robots is a
 * crawling hint, never an access control — the API guards the data itself.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [`/*${ROUTES.profile}`, `/*${ROUTES.settings}`, `/*${ROUTES.signIn}`, '/monitoring'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
