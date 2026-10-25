import type { MetadataRoute } from 'next'
import { DEFAULT_LOCALE } from '@i18n/config'
import { localePath } from '@i18n/pathname'
import { APP_NAME } from '@constants/app'
import { ROUTES } from '@constants/routes'
import { STUDIO } from '@styles/tokens'

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Stable identity: changing the landing page must not install a second copy.
    id: '/',
    name: APP_NAME,
    short_name: 'Millionaire',
    description: 'The quiz show game in 80 languages: 15 questions to the million, Marathon and Time Attack.',
    lang: DEFAULT_LOCALE,
    dir: 'ltr',
    // localePrefix is 'always', so '/' is a redirect; a start_url that redirects can loop.
    start_url: localePath(DEFAULT_LOCALE, ROUTES.home),
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'any',
    launch_handler: { client_mode: ['navigate-existing', 'auto'] },
    background_color: STUDIO[950],
    theme_color: STUDIO[950],
    categories: ['games', 'entertainment', 'education'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Classic', url: localePath(DEFAULT_LOCALE, ROUTES.play), icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'Marathon', url: localePath(DEFAULT_LOCALE, ROUTES.marathon), icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'Time Attack', url: localePath(DEFAULT_LOCALE, ROUTES.timeAttack), icons: [{ src: '/icon', sizes: '512x512' }] },
    ],
  }
}
