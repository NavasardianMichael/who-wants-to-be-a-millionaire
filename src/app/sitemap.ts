import type { MetadataRoute } from 'next'
import { LOCALES } from '@i18n/config'
import { localePath } from '@i18n/pathname'
import { CATEGORIES } from '@constants/game'
import { categoryPath, INDEXABLE_ROUTES, type RouteKey,ROUTES } from '@constants/routes'
import { absoluteUrl } from '@helpers/url'

const CHANGE_FREQUENCY: Partial<Record<RouteKey, MetadataRoute.Sitemap[number]['changeFrequency']>> = {
  home: 'daily',
  leaderboard: 'hourly',
  play: 'weekly',
  marathon: 'weekly',
  timeAttack: 'weekly',
  categories: 'weekly',
  badges: 'monthly',
  rules: 'monthly',
  about: 'yearly',
  privacy: 'yearly',
  terms: 'yearly',
}

const PRIORITY: Partial<Record<RouteKey, number>> = { home: 1, play: 0.9, marathon: 0.8, timeAttack: 0.8, leaderboard: 0.7 }

/**
 * Every public page × 80 locales, each entry carrying the full `hreflang` set so crawlers
 * see one page in 80 languages rather than 80 competing near-duplicates. Category landing
 * pages are included: 16 × 50 more URLs with real sample questions on them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const entry = (path: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number) => {
    const languages = Object.fromEntries(LOCALES.map((locale) => [locale, absoluteUrl(localePath(locale, path))]))
    return LOCALES.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    }))
  }

  return [
    ...INDEXABLE_ROUTES.flatMap((key) => entry(ROUTES[key], CHANGE_FREQUENCY[key], PRIORITY[key] ?? 0.5)),
    ...CATEGORIES.flatMap((category) => entry(categoryPath(category), 'weekly', 0.6)),
  ]
}
