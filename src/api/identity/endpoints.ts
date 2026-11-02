export const ENDPOINTS = {
  health: '/health',
  me: '/identity/me',
  logout: '/identity/logout',
  register: '/identity/register',
  login: '/identity/login',
  resendVerification: '/identity/email/resend',
  verifyEmail: '/identity/email/verify',
  forgotPassword: '/identity/password/forgot',
  resetPassword: '/identity/password/reset',
  passwordLink: '/identity/password/link',
  /** A top-level navigation, not an XHR: the API redirects to Google and back. */
  googleSignIn: '/identity/google',
} as const
