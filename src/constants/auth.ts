/**
 * Email + password rules the forms check before the API does. Each mirrors the server, pinned
 * by `tests/unit/server/password.spec.ts`.
 */

/** `PASSWORD_POLICY` in `server/src/lib/password.ts`. */
export const PASSWORD_LIMITS = { min: 8, max: 128 } as const

/** `validatePassword`: long enough, with a letter and a digit of any script. */
export const isStrongPassword = (value: string): boolean =>
  value.length >= PASSWORD_LIMITS.min && value.length <= PASSWORD_LIMITS.max && /\p{L}/u.test(value) && /\p{N}/u.test(value)

/** `DISPLAY_NAME_LIMITS` in `server/src/lib/request.ts`. */
export const DISPLAY_NAME_LIMITS = { min: 2, max: 24 } as const

/** `ERROR_CODE` in `server/src/lib/error-codes.ts`: the failures the auth forms explain in their own words. */
export const AUTH_ERROR_CODE = {
  emailTaken: 4001,
  invalidCredentials: 4002,
  weakPassword: 4003,
  resetTokenInvalid: 4004,
  googleOnlyAccount: 4005,
  emailNotVerified: 4006,
  verifyTokenInvalid: 4007,
  invalidDisplayName: 4008,
} as const

export type AuthErrorKey = keyof typeof AUTH_ERROR_CODE

/** The query the emailed links carry (`TOKEN_QUERY` on the server). */
export const TOKEN_QUERY = 'token'
