import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { LADDER, LIFELINES, MARATHON_RULES, TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { formatMoney } from '@helpers/money'
import { breadcrumbSchema } from '@linkedDataSchema/index'
import { PrizeLadder } from '@components/game/PrizeLadder'
import { JsonLd } from '@components/seo/JsonLd'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { PageHeader } from '@components/ui/layout/PageHeader'
import { Prose } from '@components/ui/layout/Prose'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.rules, title: t('rulesTitle'), description: t('rulesDescription') })
}

export default async function RulesPage() {
  const [t, locale] = await Promise.all([getTranslations(), currentLocale()])
  const values = {
    first: formatMoney(LADDER[0], locale),
    top: formatMoney(LADDER[LADDER.length - 1], locale),
    havenOne: formatMoney(LADDER[4], locale),
    havenTwo: formatMoney(LADDER[9], locale),
    penalty: TIME_ATTACK_RULES.wrongPenaltySeconds,
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: t('Nav.home'), path: ROUTES.home },
          { name: t('Rules.title'), path: ROUTES.rules },
        ])}
      />
      <PageHeader title={t('Rules.title')} subtitle={t('Rules.intro')} />
      <div className='container-page grid items-start gap-10 pb-6 lg:grid-cols-[1fr_20rem]'>
        <Prose className='px-0 sm:px-0'>
          <h2>{t('Rules.classicTitle')}</h2>
          <p>{t('Rules.classicBody1', values)}</p>
          <p>{t('Rules.classicBody2')}</p>
          <h2>{t('Rules.safeHavensTitle')}</h2>
          <p>{t('Rules.safeHavensBody', values)}</p>
          <h2>{t('Rules.walkAwayTitle')}</h2>
          <p>{t('Rules.walkAwayBody')}</p>
          <h2>{t('Rules.timerTitle')}</h2>
          <p>{t('Rules.timerBody')}</p>
          <h2>{t('Rules.lifelinesTitle')}</h2>
          <p>{t('Rules.lifelinesBody')}</p>
          <ul>
            {LIFELINES.map((lifeline) => (
              <li key={lifeline}>
                <strong>{t(`Lifelines.${lifeline}`)}</strong> — {t(`Lifelines.${lifeline}Description`)}
              </li>
            ))}
          </ul>
          <h2>{t('Rules.marathonTitle')}</h2>
          <p>{t('Rules.marathonBody', { ...values, seconds: MARATHON_RULES.questionSeconds })}</p>
          <h2>{t('Rules.timeAttackTitle')}</h2>
          <p>{t('Rules.timeAttackBody', { ...values, seconds: TIME_ATTACK_RULES.durationSeconds })}</p>
          <h2>{t('Rules.rankedTitle')}</h2>
          <p>{t('Rules.rankedBody')}</p>
          <h2>{t('Rules.questionsTitle')}</h2>
          <p>{t('Rules.questionsBody')}</p>
          <div className='mt-4'>
            <ButtonLink href={ROUTES.play}>{t('Common.playNow')}</ButtonLink>
          </div>
        </Prose>
        <PrizeLadder locale={locale} currentStage={0} answered={0} title={t('Game.ladder')} safeHavenLabel={t('Game.safeHaven')} />
      </div>
    </>
  )
}
