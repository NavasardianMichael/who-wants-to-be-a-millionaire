import { Globe2, Play, Sparkles, WifiOff } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { BADGE_IDS, LADDER } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { formatMoney } from '@helpers/money'
import { gameSchema, websiteSchema } from '@linkedDataSchema/index'
import { BadgeMedal } from '@components/badges/BadgeMedal'
import { CategoryGrid } from '@components/marketing/CategoryGrid'
import { FaqSection } from '@components/marketing/FaqSection'
import { HowToPlay } from '@components/marketing/HowToPlay'
import { LeaderboardTeaser } from '@components/marketing/LeaderboardTeaser'
import { LifelineShowcase } from '@components/marketing/LifelineShowcase'
import { ModeCards } from '@components/marketing/ModeCards'
import { StudioPreview } from '@components/marketing/StudioPreview'
import { JsonLd } from '@components/seo/JsonLd'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Card } from '@components/ui/layout/Card'
import { Section } from '@components/ui/layout/Section'

/** Static per locale, refreshed every 5 minutes for the leaderboard teaser. */
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.home, title: t('homeTitle'), description: t('homeDescription') })
}

export default async function HomePage() {
  const locale = await currentLocale()
  const t = await getTranslations()

  const showcase = BADGE_IDS.filter((_, index) => index % 3 === 0).slice(0, 6)

  return (
    <>
      <JsonLd data={websiteSchema(locale, t('Common.appName'), t('Seo.homeDescription'))} />
      <JsonLd data={gameSchema(locale, t('Common.appName'), t('Seo.homeDescription'), ROUTES.home)} />

      {/* Hero */}
      <section className='container-page grid items-center gap-10 pt-10 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-16'>
        <div className='flex animate-rise flex-col items-center gap-6 text-center lg:items-start lg:text-start'>
          <p className='rounded-tag border border-spot-300/30 bg-studio-900/60 px-4 py-1.5 text-caption font-bold tracking-[0.08em] text-spot-300 uppercase sm:tracking-[0.18em]'>
            {t('Home.eyebrow')}
          </p>
          <h1 className='text-display font-black text-gold-gradient'>{t('Home.heroTitle')}</h1>
          <div className='flex w-full max-w-xl flex-col gap-3'>
            <h2 className='eyebrow'>{t('Home.modesTitle')}</h2>
            <ModeCards locale={locale} compact />
          </div>
        </div>
        <StudioPreview
          question={t('Home.faq3Question')}
          options={[
            formatMoney(LADDER[0], locale),
            formatMoney(LADDER[4], locale),
            formatMoney(LADDER[9], locale),
            formatMoney(LADDER[14], locale),
          ]}
        />
      </section>

      <Section id='how' title={t('Home.howTitle')}>
        <HowToPlay />
      </Section>

      <Section id='lifelines' title={t('Home.lifelinesTitle')} subtitle={t('Home.lifelinesSubtitle')}>
        <LifelineShowcase />
      </Section>

      <Section id='hall-of-fame' title={t('Home.leaderboardTitle')} subtitle={t('Home.leaderboardSubtitle')}>
        <div className='grid gap-4 md:grid-cols-2'>
          <LeaderboardTeaser mode='marathon' />
          <LeaderboardTeaser mode='timeAttack' />
        </div>
      </Section>

      <Section className='grid gap-4 md:grid-cols-2'>
        <Card tone='gold' className='flex flex-col gap-3'>
          <Globe2 aria-hidden className='size-8 text-gold-300' />
          <h2 className='text-h3 font-extrabold text-gold-200'>{t('Home.cultureTitle')}</h2>
          <p className='text-mist'>{t('Home.cultureBody')}</p>
        </Card>
        <Card className='flex flex-col gap-3'>
          <WifiOff aria-hidden className='size-8 text-spot-300' />
          <h2 className='text-h3 font-extrabold text-ivory'>{t('Home.offlineTitle')}</h2>
          <p className='text-mist'>{t('Home.offlineBody')}</p>
        </Card>
      </Section>

      <Section id='categories' title={t('Home.categoriesTitle')} subtitle={t('Home.categoriesSubtitle')}>
        <CategoryGrid />
      </Section>

      <Section id='badges' title={t('Home.badgesTitle')} subtitle={t('Home.badgesSubtitle', { count: BADGE_IDS.length })}>
        <ul className='flex flex-wrap justify-center gap-6 sm:justify-start'>
          {showcase.map((badgeId) => (
            <li key={badgeId} className='flex w-28 flex-col items-center gap-2 text-center'>
              <BadgeMedal badgeId={badgeId} earned size='lg' />
              <span className='text-body-sm font-semibold'>{t(`Badges.items.${badgeId}.name`)}</span>
            </li>
          ))}
        </ul>
        <ButtonLink href={ROUTES.badges} variant='ghost' className='mt-6'>
          <Sparkles aria-hidden className='size-5' /> {t('Home.viewBadges')}
        </ButtonLink>
      </Section>

      <Section id='faq' title={t('Home.faqTitle')} align='center'>
        <FaqSection locale={locale} />
      </Section>

      <section className='container-page py-12'>
        <Card tone='gold' className='flex flex-col items-center gap-5 py-12 text-center'>
          <h2 className='text-h1 font-black text-gold-gradient'>{t('Home.heroTitle')}</h2>
          <ButtonLink href={ROUTES.play} size='lg'>
            <Play aria-hidden className='size-6' /> {t('Common.playNow')}
          </ButtonLink>
        </Card>
      </section>
    </>
  )
}
