import { getTranslations } from 'next-intl/server'
import { currentLocale } from '@i18n/metadata'
import { type GameMode, LADDER, MARATHON_RULES, TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { formatMoney } from '@helpers/money'
import { breadcrumbSchema, gameSchema } from '@linkedDataSchema/index'
import { GameScreen } from '@components/game/GameScreen'
import { JsonLd } from '@components/seo/JsonLd'

const PATHS: Record<GameMode, string> = { classic: ROUTES.play, marathon: ROUTES.marathon, timeAttack: ROUTES.timeAttack }

/**
 * A game page is the game and nothing else: one screen under the header, no footer and
 * nothing to scroll to (`data-game-stage` hides the footer). The mode's rules live on the
 * rules page and the home page; its setup panel is server-rendered with the defaults.
 */
export const ModePage = async ({ mode }: { mode: GameMode }) => {
  const locale = await currentLocale()
  const t = await getTranslations()
  const path = PATHS[mode]
  const values = {
    first: formatMoney(LADDER[0], locale),
    top: formatMoney(LADDER[LADDER.length - 1], locale),
    havenOne: formatMoney(LADDER[4], locale),
    havenTwo: formatMoney(LADDER[9], locale),
    seconds: mode === 'marathon' ? MARATHON_RULES.questionSeconds : TIME_ATTACK_RULES.durationSeconds,
    minutes: MARATHON_RULES.questionSeconds / 60,
    penalty: TIME_ATTACK_RULES.wrongPenaltySeconds,
  }

  return (
    <>
      <JsonLd data={gameSchema(locale, `${t('Common.appName')} — ${t(`Modes.${mode}.name`)}`, t(`Modes.${mode}.description`, values), path)} />
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: t('Nav.home'), path: ROUTES.home },
          { name: t(`Modes.${mode}.name`), path },
        ])}
      />

      <div data-game-stage className='container-page'>
        <GameScreen mode={mode} />
      </div>
    </>
  )
}
