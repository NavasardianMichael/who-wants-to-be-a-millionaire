/**
 * The English brand: the web manifest (one per site) and JSON-LD `alternateName`. Everything a
 * visitor reads uses the translated `Common.appName`.
 */
export const APP_NAME = 'Millionaire Quiz'

export const SITE_URL_FALLBACK = 'http://localhost:7006'

export const API_URL_FALLBACK = 'http://localhost:9006'

export const API_REQUEST_TIMEOUT_MS = 30_000
/** Generating a fresh batch with Gemini can take a while on a cold bucket. */
export const API_QUESTIONS_TIMEOUT_MS = 60_000
export const API_UPLOAD_TIMEOUT_MS = 120_000

export const AUTHOR = {
  name: 'Michael Navasardyan',
  url: 'https://www.linkedin.com/in/michael-navasardyan/',
} as const

/** Every localStorage key in one place, namespaced so nothing collides on a shared origin. */
export const STORAGE_KEYS = {
  settings: 'millionaire:settings',
  audio: 'millionaire:audio',
  seenQuestions: 'millionaire:seen-questions',
  classicBest: 'millionaire:classic-best',
  /** The value keeps its first name so bests saved before the rename survive. */
  personalBests: 'millionaire:practice-bests',
  badges: 'millionaire:badges',
  stats: 'millionaire:stats',
  pwaInstalledAt: 'millionaire:pwa-installed',
  iosHintClosedAt: 'millionaire:ios-hint-closed',
} as const

/** How many question ids the device remembers to avoid repeats. */
export const SEEN_QUESTIONS_LIMIT = 300

export const IDB_NAME = 'millionaire'
export const IDB_VERSION = 1
