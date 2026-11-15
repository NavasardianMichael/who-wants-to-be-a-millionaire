import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveCookieDomain } from './lib/cookie-domain.js'

import './load-env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nodeEnv = process.env.NODE_ENV ?? 'development'
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:7006'

/**
 * The web app's message catalogues, which also hold the account emails' copy (`Email.*`):
 * `src/messages` in the repo, `messages/` beside `dist/` in the release (`build-api-release.mjs`).
 */
const messagesDir = [
  path.join(__dirname, '../../messages'),
  path.join(__dirname, '../../src/messages'),
  path.join(__dirname, '../../../src/messages'),
].find((candidate) => existsSync(path.join(candidate, 'en.json')))

const asNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const DEV_JWT_SECRET = 'dev-secret-change-me'

/**
 * Production refuses to start on a missing or guessable secret: anyone could sign a session
 * with it. Generate one with `openssl rand -hex 64`.
 */
const readJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET ?? ''
  if (nodeEnv !== 'production') return secret || DEV_JWT_SECRET
  if (secret.length < 32 || secret.startsWith('change-me') || secret === DEV_JWT_SECRET) {
    throw new Error('JWT_SECRET must be a random value of at least 32 characters in production (openssl rand -hex 64)')
  }
  return secret
}

/** Every `process.env` read lives here. Secrets are read by exactly one module each. */
export const config = {
  port: Number(process.env.PORT ?? 9006),
  /** Every interface in dev (a phone on the LAN can reach it); production sets 127.0.0.1. */
  host: process.env.HOST ?? '0.0.0.0',
  /** Signs the session cookie. The dev default is local only; production must set its own. */
  jwtSecret: readJwtSecret(),
  corsOrigin,
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? path.join(__dirname, '../uploads')),
  nodeEnv,
  cookieName: 'millionaire_session',
  /**
   * `Domain` on the session cookie. Empty means host-only, which local dev wants. In
   * production the web app and the API are different hosts, so the cookie is scoped to the
   * web host (which covers `api.<web host>`) — see `lib/cookie-domain.ts`.
   */
  cookieDomain: process.env.COOKIE_DOMAIN ?? deriveCookieDomain(nodeEnv, corsOrigin),
  /** Cookie holding an in-flight Google OAuth flow. Scoped to `/identity/google`. */
  oauthCookieName: 'millionaire_oauth',
  oauthFlowTtlMs: 10 * 60 * 1000,
  /** The emails state these in words (`Email.verifyFooter`, `Email.resetFooter`): change both together. */
  emailVerifyTtlMs: 48 * 60 * 60 * 1000,
  passwordResetTtlMs: 60 * 60 * 1000,
  messagesDir: messagesDir ?? '',
  /**
   * Google OAuth. `clientSecret` is read only by `lib/google-oauth.ts`. Empty values disable
   * sign-in instead of throwing: `/health` reports `google: false` and the web app hides
   * the button.
   */
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:9006/identity/google/callback',
  },
  /**
   * AI question writing. Which provider runs is chosen in code (`lib/ai/index.ts`); each key is
   * read only by its provider (`lib/ai/gemini.ts`, `lib/ai/openrouter.ts`). The active
   * provider's key empty disables generation: every request is served from the pool and,
   * when that runs dry, from the seeded English bank.
   */
  ai: {
    /** A second, blind "answer it yourself" pass that drops questions the checker disagrees with. */
    verifyQuestions: process.env.VERIFY_QUESTIONS === 'true',
  },
  gemini: {
    key: process.env.GEMINI_KEY ?? '',
  },
  openrouter: {
    key: process.env.OPENROUTER_KEY ?? '',
  },
  /**
   * The background job that keeps every busy (locale, level) bucket stocked ahead of demand.
   * Off unless `POOL_REFILL_ENABLED="true"`, in every environment: the pools are seeded by
   * hand, and AI writes only when a player has nothing unseen left (`getQuestionBatch`,
   * under `liveGeneration`). Stocking ahead would buy questions while unseen ones remain.
   */
  poolRefill: {
    enabled: process.env.POOL_REFILL_ENABLED === 'true',
    intervalMs: asNumber(process.env.POOL_REFILL_INTERVAL_MS, 5 * 60 * 1000),
    /** Unserved questions a bucket should hold before the job leaves it alone. */
    targetPerBucket: asNumber(process.env.POOL_REFILL_TARGET, 60),
    /** AI calls per tick — the free quota is per minute and per day, so this stays small. */
    maxCallsPerTick: asNumber(process.env.POOL_REFILL_MAX_CALLS, 4),
  },
  /**
   * The ceiling on AI batches started by player requests (a bucket with nothing unseen left),
   * enforced by `lib/generationBudget.ts`. Past it the request is served from what exists.
   * A new language's first game alone can start 5 (one per level).
   */
  /**
   * Ranked questions that have done their job move to Classic (`jobs/rankedGraduation.ts`).
   * Never the other way: a Classic question's answer is public.
   */
  rankedGraduation: {
    /** Ranked serves before a question may leave; by then most regulars have met it. */
    minServes: asNumber(process.env.RANKED_GRADUATION_MIN_SERVES, 20),
    /** Questions each (locale, level) reserve always keeps; Marathon lives at level 5. */
    keepPerBucket: asNumber(process.env.RANKED_GRADUATION_KEEP, 150),
  },
  liveGeneration: {
    perHour: asNumber(process.env.AI_LIVE_GENERATIONS_PER_HOUR, 60),
    perPlayerPerHour: asNumber(process.env.AI_LIVE_GENERATIONS_PER_PLAYER_PER_HOUR, 10),
  },
  /**
   * Phone a Friend calls the model once per use, signed in or not. Past this many a day the
   * friend speaks from the translated template instead (`services/phoneAFriend.ts`).
   */
  friendCallsPerDay: asNumber(process.env.AI_FRIEND_CALLS_PER_DAY, 2000),
  /**
   * The mail engine shared with bookie: the contact form, and account emails (verification,
   * password links). `apiKey` is read only by `lib/mail.ts`. Empty disables sending: in dev
   * the mail is printed instead, links included.
   */
  mail: {
    apiUrl: (process.env.MAIL_API_URL ?? '').replace(/\/+$/, ''),
    apiKey: process.env.MAIL_API_KEY ?? '',
    appId: process.env.MAIL_APP_ID ?? 'millionaire',
  },
}

export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(config.google.clientId && config.google.clientSecret && config.google.redirectUri)