import passport from 'passport'
import { type Profile, Strategy as GoogleStrategy } from 'passport-google-oauth20'
import type { StateStore } from 'passport-oauth2'
import { oauthStateStore } from './oauth-state.js'
import { isEmail, MAX_EMAIL_LENGTH } from './request.js'
import { config, isGoogleOAuthConfigured } from '../config.js'

/**
 * Google sign-in on `passport-google-oauth20`, with a state nonce + PKCE
 * (`lib/oauth-state.ts`) and an explicit `email_verified` gate.
 *
 * No ID token is involved: passport fetches the profile server-to-server with an access
 * token this server obtained using the client secret, so the response is already scoped to
 * us. If Google One Tap is ever added, that reasoning no longer holds.
 */
export type GoogleIdentity = {
  /** Google's `sub` — the account key. */
  googleId: string
  email: string
  displayName: string
  avatarUrl?: string
}

export const GOOGLE_STRATEGY = 'google'

/** Stable `?error=` codes the web app translates. */
export const GOOGLE_ERROR = {
  unavailable: 'google_unavailable',
  denied: 'google_denied',
  stateMissing: 'google_state_missing',
  stateMismatch: 'google_state_mismatch',
  exchangeFailed: 'google_exchange_failed',
  emailUnverified: 'google_email_unverified',
} as const

/** Google has been observed sending the string `"true"`; compared explicitly, never coerced. */
const isVerifiedFlag = (value: unknown): boolean => value === true || value === 'true'

const MAX_DISPLAY_NAME = 24

const pickDisplayName = (profile: Profile, email: string): string => {
  const name = profile.name?.givenName?.trim() || profile.displayName?.trim() || email.split('@')[0] || 'Player'
  return name.slice(0, MAX_DISPLAY_NAME)
}

/** Turns a Google profile into an identity, or rejects it. Exported for unit tests. */
export const readGoogleProfile = (profile: Profile): GoogleIdentity | null => {
  const googleId = profile.id?.trim()
  if (!googleId) return null

  const primary = profile.emails?.[0]
  const email = primary?.value?.trim().toLowerCase()
  if (!email || email.length > MAX_EMAIL_LENGTH || !isEmail(email)) return null

  if (!isVerifiedFlag(primary?.verified) && !isVerifiedFlag(profile._json?.email_verified)) return null

  const avatarUrl = profile.photos?.[0]?.value?.trim()
  return { googleId, email, displayName: pickDisplayName(profile, email), avatarUrl: avatarUrl || undefined }
}

let registered = false

/** Registers the strategy lazily, so a clone with blank credentials still boots. */
export const ensureGoogleStrategy = (): boolean => {
  if (!isGoogleOAuthConfigured()) return false
  if (registered) return true

  passport.use(
    GOOGLE_STRATEGY,
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.redirectUri,
        scope: ['profile', 'email'],
        // `@types/passport-oauth2`'s StateStore lacks the 5-parameter PKCE overload the
        // runtime actually calls — see lib/oauth-state.ts.
        store: oauthStateStore as unknown as StateStore,
        pkce: true,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const identity = readGoogleProfile(profile)
        if (!identity) return done(null, false, { message: GOOGLE_ERROR.emailUnverified })
        return done(null, identity)
      }
    )
  )

  registered = true
  return true
}

export const passportInitialize = () => passport.initialize()

export { default as passport } from 'passport'
