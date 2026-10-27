import { LOCALE_LABELS, LOCALES } from '@i18n/config'
import { languageName } from '@i18n/languageNames'
import { localePath } from '@i18n/pathname'
import { APP_NAME, SHOW_TITLE } from '@constants/app'
import { INDEXABLE_ROUTES, ROUTES } from '@constants/routes'
import { absoluteUrl } from '@helpers/url'

/**
 * `/llms.txt` (llmstxt.org): the site in plain Markdown for answer engines. Its point is the
 * language list — each locale's home page under the show's local title and "… in Armenian",
 * so "Armenian Who Wants to Be a Millionaire game" has one obvious answer. Built from the
 * catalogues at build time; the extension keeps the proxy from locale-prefixing it.
 */
export const dynamic = 'force-static'

const PAGE_LABELS: Partial<Record<(typeof INDEXABLE_ROUTES)[number], string>> = {
  play: 'Classic — 15 questions to the million, four lifelines, two safe havens',
  marathon: 'Marathon — endless, harder every five answers, one mistake ends the run (ranked)',
  timeAttack: 'Time Attack — as many answers as possible against the clock (ranked)',
  leaderboard: 'Leaderboard — Marathon and Time Attack rankings',
  rules: 'Rules — the money ladder, safe havens and lifelines',
  badges: 'Badges',
  about: 'About',
}

export async function GET(): Promise<Response> {
  const languages = await Promise.all(
    LOCALES.map(async (locale) => {
      const messages = (await import(`../../messages/${locale}.json`)).default
      const english = languageName(locale, 'en')
      const native = LOCALE_LABELS[locale] === english ? '' : ` (${LOCALE_LABELS[locale]})`
      return `- [${english}${native} — ${messages.Home.heroTitle}](${absoluteUrl(localePath(locale, ROUTES.home))}): ${SHOW_TITLE} game in ${english}, free online`
    })
  )

  const pages = INDEXABLE_ROUTES.flatMap((key) =>
    PAGE_LABELS[key] ? [`- [${PAGE_LABELS[key]}](${absoluteUrl(localePath('en', ROUTES[key]))})`] : []
  )

  const body = [
    `# ${APP_NAME} — ${SHOW_TITLE} in ${LOCALES.length} languages`,
    '',
    `> A free online quiz game in the format of the TV show "${SHOW_TITLE}": 15 questions to the million, four lifelines (50:50, Ask the Audience, Phone a Friend, Switch the Question) and two safe havens. Questions are written natively in each language by artificial intelligence, not translated, and include the local culture. Free, no sign-up, works offline as an installable app. An independent fan-made game, not affiliated with the TV show.`,
    '',
    `Every language has its own home page; the path prefix is the language code (${absoluteUrl('/hy')} is Armenian, ${absoluteUrl('/ru')} Russian).`,
    '',
    '## Play in your language',
    '',
    ...languages,
    '',
    '## Game modes and pages (English; every language has the same paths)',
    '',
    ...pages,
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
