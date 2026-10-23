import type { BreadcrumbList, FAQPage, ItemList, VideoGame, WebSite, WithContext } from 'schema-dts'
import type { Locale } from '@i18n/config'
import { localePath } from '@i18n/pathname'
import { APP_NAME, AUTHOR } from '@constants/app'
import { absoluteUrl } from '@helpers/url'

/**
 * JSON-LD builders. Every URL is absolute and locale-prefixed, matching the page's canonical.
 * Typed with `schema-dts`, so a misspelt property is a compile error rather than a silently
 * ignored field.
 */
export const websiteSchema = (locale: Locale, description: string): WithContext<WebSite> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  url: absoluteUrl(localePath(locale, '/')),
  inLanguage: locale,
  description,
  author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
})

export const gameSchema = (locale: Locale, name: string, description: string, path: string): WithContext<VideoGame> => ({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name,
  description,
  url: absoluteUrl(localePath(locale, path)),
  inLanguage: locale,
  genre: ['Quiz', 'Trivia'],
  gamePlatform: ['Web browser', 'Android', 'iOS', 'Windows', 'macOS'],
  applicationCategory: 'GameApplication',
  operatingSystem: 'Any',
  playMode: 'SinglePlayer',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
})

export const faqSchema = (items: { question: string; answer: string }[]): WithContext<FAQPage> => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
})

export const breadcrumbSchema = (locale: Locale, crumbs: { name: string; path: string }[]): WithContext<BreadcrumbList> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(({ name, path }, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name,
    item: absoluteUrl(localePath(locale, path)),
  })),
})

export const leaderboardSchema = (name: string, entries: { rank: number; displayName: string; score: number }[]): WithContext<ItemList> => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  numberOfItems: entries.length,
  itemListElement: entries.map(({ rank, displayName, score }) => ({
    '@type': 'ListItem',
    position: rank,
    name: `${displayName} — ${score}`,
  })),
})
