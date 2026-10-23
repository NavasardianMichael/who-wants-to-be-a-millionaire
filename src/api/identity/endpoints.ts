export const ENDPOINTS = {
  health: '/health',
  me: '/identity/me',
  logout: '/identity/logout',
  /** A top-level navigation, not an XHR: the API redirects to Google and back. */
  googleSignIn: '/identity/google',
} as const
