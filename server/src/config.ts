import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveCookieDomain } from './lib/cookie-domain.js'

import './load-env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nodeEnv = process.env.NODE_ENV ?? 'development'
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:7006'

const asNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Every `process.env` read lives here. Secrets are read by exactly one module each. */
export const config = {
  port: Number(process.env.PORT ?? 9006),
  /** Every interface in dev (a phone on the LAN can reach it); production sets 127.0.0.1. */
  host: process.env.HOST ?? '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
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
   * Gemini. `key` is read only by `lib/gemini.ts`. Empty disables generation: every request
   * is served from the pool and, when that runs dry, from the seeded English bank.
   */
  gemini: {
    key: process.env.GEMINI_KEY ?? '',
    /** A second, blind "answer it yourself" pass that drops questions the checker disagrees with. */
    verifyQuestions: process.env.VERIFY_QUESTIONS === 'true',
  },
  /** The background job that keeps every busy (locale, level) bucket stocked. */
  poolRefill: {
    enabled: process.env.POOL_REFILL_ENABLED !== 'false',
    intervalMs: asNumber(process.env.POOL_REFILL_INTERVAL_MS, 5 * 60 * 1000),
    /** Unserved questions a bucket should hold before the job leaves it alone. */
    targetPerBucket: asNumber(process.env.POOL_REFILL_TARGET, 60),
    /** Gemini calls per tick — the free quota is per minute and per day, so this stays small. */
    maxCallsPerTick: asNumber(process.env.POOL_REFILL_MAX_CALLS, 4),
  },
  /**
   * The mail engine shared with bookie, for the contact form. `apiKey` is read only by
   * `lib/mail.ts`. Empty disables sending: in dev the message is printed instead.
   */
  mail: {
    apiUrl: (process.env.MAIL_API_URL ?? '').replace(/\/+$/, ''),
    apiKey: process.env.MAIL_API_KEY ?? '',
    appId: process.env.MAIL_APP_ID ?? 'millionaire',
  },
}

export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(config.google.clientId && config.google.clientSecret && config.google.redirectUri)

export const isGeminiConfigured = (): boolean => Boolean(config.gemini.key)
