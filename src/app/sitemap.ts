import type { MetadataRoute } from 'next'
import { LOCALES } from '@i18n/config'
import { localePath } from '@i18n/pathname'
import { INDEXABLE_ROUTES, ROUTES } from '@constants/routes'
import { absoluteUrl } from '@helpers/url'

/**
 * Every listed page × 80 locales, URLs only. The `hreflang` set lives in each page's `<head>`
 * (`pageMetadata`, with `x-default`); repeating it here made the file 80× larger and said
 * nothing new. No `lastModified`, `changeFrequency` or `priority`: Google ignores the last two,
 * and a date that moves on every deploy teaches it to ignore the first.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.flatMap((key) =>
    LOCALES.map((locale) => ({ url: absoluteUrl(localePath(locale, ROUTES[key])) }))
  )
}
