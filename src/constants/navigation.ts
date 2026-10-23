import { ROUTES } from './routes'

/** Header navigation — the game modes first, as on the home page. `labelKey` is under `Nav`. */
export const PRIMARY_NAV = [
  { labelKey: 'classic', href: ROUTES.play },
  { labelKey: 'marathon', href: ROUTES.marathon },
  { labelKey: 'timeAttack', href: ROUTES.timeAttack },
  { labelKey: 'leaderboard', href: ROUTES.leaderboard },
  { labelKey: 'categories', href: ROUTES.categories },
] as const

/** Extra links in the mobile menu and the footer. */
export const SECONDARY_NAV = [
  { labelKey: 'badges', href: ROUTES.badges },
  { labelKey: 'rules', href: ROUTES.rules },
  { labelKey: 'settings', href: ROUTES.settings },
] as const

export const LEGAL_NAV = [
  { labelKey: 'about', href: ROUTES.about },
  { labelKey: 'privacy', href: ROUTES.privacy },
  { labelKey: 'terms', href: ROUTES.terms },
] as const
