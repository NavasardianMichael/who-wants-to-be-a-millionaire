import type { Category } from './game'

/** Every internal path, locale-free. `@i18n/navigation` adds the prefix. */
export const ROUTES = {
  home: '/',
  play: '/play',
  marathon: '/marathon',
  timeAttack: '/time-attack',
  leaderboard: '/leaderboard',
  categories: '/categories',
  badges: '/badges',
  rules: '/rules',
  about: '/about',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',
  profile: '/profile',
  settings: '/settings',
  signIn: '/sign-in',
} as const

export type RouteKey = keyof typeof ROUTES

/** Public pages, each emitted once per locale into the sitemap. */
export const INDEXABLE_ROUTES: readonly RouteKey[] = [
  'home',
  'play',
  'marathon',
  'timeAttack',
  'leaderboard',
  'categories',
  'badges',
  'rules',
  'about',
  'privacy',
  'terms',
  'contact',
]

/** URL slugs for the category landing pages (`/categories/film-tv`). */
export const CATEGORY_SLUGS: Record<Category, string> = {
  general: 'general-knowledge',
  history: 'history',
  geography: 'geography',
  science: 'science',
  nature: 'nature',
  literature: 'literature',
  art: 'art',
  music: 'music',
  filmTv: 'film-and-tv',
  sports: 'sports',
  technology: 'technology',
  food: 'food-and-drink',
  mythology: 'mythology',
  language: 'language-and-words',
  popCulture: 'pop-culture',
  localCulture: 'local-culture',
}

export const categoryPath = (category: Category): string => `${ROUTES.categories}/${CATEGORY_SLUGS[category]}`

export const categoryFromSlug = (slug: string): Category | undefined =>
  (Object.entries(CATEGORY_SLUGS) as [Category, string][]).find(([, value]) => value === slug)?.[0]
