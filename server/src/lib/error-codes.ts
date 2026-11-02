/**
 * Stable codes for the failures the web app explains in its own words: it picks translated
 * copy by code (`AUTH_ERROR_CODE` in `src/constants/auth.ts`, the twin, pinned by
 * `tests/unit/server/password.spec.ts`), never by the English message. Import-free.
 */
export const ERROR_CODE = {
  emailTaken: 4001,
  invalidCredentials: 4002,
  weakPassword: 4003,
  resetTokenInvalid: 4004,
  googleOnlyAccount: 4005,
  emailNotVerified: 4006,
  verifyTokenInvalid: 4007,
  invalidDisplayName: 4008,
} as const

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE]
