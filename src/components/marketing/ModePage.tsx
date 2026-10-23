import { getTranslations } from 'next-intl/server'
import { currentLocale } from '@i18n/metadata'
import { type GameMode, LADDER, MARATHON_RULES, TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { formatMoney } from '@helpers/money'
import { breadcrumbSchema, gameSchema } from '@linkedDataSchema/index'
import { GameScreen } from '@components/game/GameScreen'
import { PrizeLadder } from '@components/game/PrizeLadder'
import { JsonLd } from '@components/seo/JsonLd'
import { Section } from '@components/ui/layout/Section'
import { LeaderboardTeaser } from './LeaderboardTeaser'
import { LifelineShowcase } from './LifelineShowcase'
import { ModeCards } from './ModeCards'

const PATHS: Record<GameMode, string> = { classic: ROUTES.play, marathon: ROUTES.marathon, timeAttack: ROUTES.timeAttack }

/**
 * A game page: the game first (its setup panel is server-rendered with the defaults), then —
 * below the fold, for players who scroll and for crawlers — the mode's full rules, the ladder
 * or leaderboard, the lifelines, and the other modes.
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

      <div className='container-page pt-4 pb-10 sm:pt-6'>
        <h1 className='mb-4 text-center font-display text-h3 font-black tracking-wide text-gold-gradient uppercase sm:mb-6 sm:text-h2'>
          {t(`Modes.${mode}.name`)}
        </h1>
        <GameScreen mode={mode} />
      </div>

      <Section id='about-mode' title={t(`Modes.${mode}.name`)} subtitle={t(`Modes.${mode}.description`, values)} as='h2'>
        <div className='grid items-start gap-8 lg:grid-cols-[1fr_22rem]'>
          <div className='flex flex-col gap-6 text-mist'>
            {mode === 'classic' && (
              <>
                <p>{t('Rules.classicBody1', values)}</p>
                <p>{t('Rules.classicBody2')}</p>
                <h3 className='font-display text-h3 font-bold text-ivory'>{t('Rules.safeHavensTitle')}</h3>
                <p>{t('Rules.safeHavensBody', values)}</p>
                <h3 className='font-display text-h3 font-bold text-ivory'>{t('Rules.walkAwayTitle')}</h3>
                <p>{t('Rules.walkAwayBody')}</p>
                <h3 className='font-display text-h3 font-bold text-ivory'>{t('Rules.timerTitle')}</h3>
                <p>{t('Rules.timerBody')}</p>
              </>
            )}
            {mode === 'marathon' && <p>{t('Rules.marathonBody', values)}</p>}
            {mode === 'timeAttack' && <p>{t('Rules.timeAttackBody', values)}</p>}
            {mode !== 'classic' && (
              <>
                <h3 className='font-display text-h3 font-bold text-ivory'>{t('Rules.rankedTitle')}</h3>
                <p>{t('Rules.rankedBody')}</p>
              </>
            )}
            <h3 className='font-display text-h3 font-bold text-ivory'>{t('Rules.questionsTitle')}</h3>
            <p>{t('Rules.questionsBody')}</p>
          </div>
          {mode === 'classic' ? (
            <PrizeLadder locale={locale} currentStage={0} answered={0} title={t('Game.ladder')} safeHavenLabel={t('Game.safeHaven')} />
          ) : (
            <LeaderboardTeaser mode={mode} limit={10} />
          )}
        </div>
      </Section>

      {mode !== 'timeAttack' && (
        <Section id='lifelines' title={t('Home.lifelinesTitle')} subtitle={t('Home.lifelinesSubtitle')}>
          <LifelineShowcase />
        </Section>
      )}

      <Section id='other-modes' title={t('Home.modesTitle')}>
        <ModeCards locale={locale} exclude={mode} />
      </Section>
    </>
  )
}
