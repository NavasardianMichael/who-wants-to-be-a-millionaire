import type { MetadataRoute } from 'next'
import { createTranslator } from 'next-intl'
import { getDirection, isLocale, LOCALES } from '@i18n/config'
import { localePath } from '@i18n/pathname'
import { TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { STUDIO } from '@styles/tokens'

/**
 * One web manifest per locale, linked from that locale's layout: the installed app carries
 * the translated name and opens in the language it was installed from. `id` is shared, so
 * the site is still one app — installing from `/hy` and visiting `/en` is not a second copy.
 * A Route Handler rather than `app/manifest.ts`, which is root-only. The extension keeps the
 * proxy from touching it.
 */
export const dynamic = 'force-static'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

/** Captured by `pnpm pwa:screenshots`; Chrome's richer install dialog needs both form factors. */
const SCREENSHOTS = [
  { name: 'home', label: 'Common.tagline' },
  { name: 'game', label: 'Modes.classic.tagline' },
  { name: 'languages', label: 'Home.languagesTitle' },
  { name: 'categories', label: 'Seo.categoriesTitle' },
] as const

/** Phone shots listed ahead of the set above: the game, then the home screen with the three modes. */
const LEADING_MOBILE = [
  { name: 'mobile-game', label: 'Modes.classic.tagline' },
  { name: 'mobile-home', label: 'Common.tagline' },
] as const

const FORM_FACTORS = {
  narrow: { sizes: '780x1688' },
  wide: { sizes: '1920x1380' },
} as const

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }): Promise<Response> {
  const { lang } = await params
  // Not `notFound()`: thrown from this Route Handler it crashed `next build`'s static workers.
  if (!isLocale(lang)) return new Response(null, { status: 404 })

  const messages = (await import(`../../../messages/${lang}.json`)).default
  const t = createTranslator({ locale: lang, messages })
  const shortcut = (name: string, description: string, route: string) => ({
    name,
    description,
    url: localePath(lang, route),
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  })

  const manifest: MetadataRoute.Manifest = {
    // Stable identity: changing the landing page or the language must not install a second copy.
    id: '/',
    name: t('Common.appName'),
    short_name: t('Pwa.shortName'),
    description: t('Pwa.benefit'),
    lang,
    dir: getDirection(lang),
    start_url: localePath(lang, ROUTES.home),
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
    // English screens for every locale: one set to keep current instead of eighty.
    // The two phone shots come first; the home, game, languages and categories set follows.
    screenshots: [
      ...LEADING_MOBILE.map(({ name, label }) => ({
        src: `/screenshots/${name}-narrow.jpg`,
        sizes: FORM_FACTORS.narrow.sizes,
        type: 'image/jpeg' as const,
        form_factor: 'narrow' as const,
        label: t(label),
      })),
      ...Object.entries(FORM_FACTORS).flatMap(([formFactor, { sizes }]) =>
        SCREENSHOTS.map(({ name, label }) => ({
          src: `/screenshots/${name}-${formFactor}.jpg`,
          sizes,
          type: 'image/jpeg' as const,
          form_factor: formFactor as 'narrow' | 'wide',
          label: t(label),
        }))
      ),
    ],
    shortcuts: [
      shortcut(t('Modes.classic.name'), t('Modes.classic.tagline'), ROUTES.play),
      shortcut(t('Modes.marathon.name'), t('Modes.marathon.tagline'), ROUTES.marathon),
      shortcut(
        t('Modes.timeAttack.name'),
        t('Modes.timeAttack.tagline', { seconds: TIME_ATTACK_RULES.durationSeconds }),
        ROUTES.timeAttack
      ),
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  })
}
