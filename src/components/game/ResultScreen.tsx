'use client'

import { useEffect } from 'react'
import { Award, Home, RotateCcw, Share2, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import type { GameEnd } from '@store/game/session/types'
import { toast } from '@store/toast/store'
import type { GameMode } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { trackEvent } from '@helpers/analytics'
import { formatMoney } from '@helpers/money'
import { reportError } from '@helpers/reportError'
import { BadgeMedal } from '@components/badges/BadgeMedal'
import { Emblem } from '@components/brand/Emblem'
import { GoogleSignInButton } from '@components/layout/GoogleSignInButton'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { CONFETTI_COLORS } from '@styles/tokens'
import { MoneyCounter } from './MoneyCounter'

export type ResultScreenProps = {
  end: GameEnd
  mode: GameMode
  ranked: boolean
  onPlayAgain: () => void
}

/** A burst of gold from both lower corners; loaded on demand, skipped under reduced motion. */
const celebrate = async () => {
  const confetti = (await import('canvas-confetti')).default
  const fire = (originX: number, angle: number) =>
    confetti({ particleCount: 90, angle, spread: 60, startVelocity: 55, origin: { x: originX, y: 0.9 }, colors: CONFETTI_COLORS, scalar: 1.1 })
  fire(0.1, 60)
  fire(0.9, 120)
  setTimeout(() => confetti({ particleCount: 140, spread: 110, origin: { y: 0.4 }, colors: CONFETTI_COLORS }), 450)
}

export const ResultScreen = ({ end, mode, ranked, onPlayAgain }: ResultScreenProps) => {
  const t = useTranslations()
  const locale = useLocale()
  const reduce = useReducedMotion()
  const user = useAuthStore.use.user()
  const googleAvailable = useAuthStore.use.googleAvailable()

  const amount = formatMoney(end.winnings, locale)
  const isClassic = mode === 'classic'
  const titleKey = isClassic ? `${end.outcome === 'ended' ? 'lost' : end.outcome}Title` : end.outcome === 'timeout' ? 'timeoutTitle' : 'endedTitle'
  const body = isClassic
    ? t(`Result.${end.outcome === 'ended' ? 'lost' : end.outcome}Body`, { amount })
    : t('Result.endedBody', { count: end.score })

  useEffect(() => {
    if (reduce) return
    if (end.outcome === 'won' || end.isPersonalBest) celebrate().catch((error: unknown) => reportError(error, 'confetti', { silent: true }))
  }, [end.outcome, end.isPersonalBest, reduce])

  const share = async () => {
    const text = isClassic
      ? t('Result.shareText', { amount })
      : t('Result.shareScoreText', { score: end.score, mode: t(`Modes.${mode}.name`) })
    const url = window.location.href.split('?')[0]
    trackEvent('share_result', { mode })
    try {
      if (navigator.share) await navigator.share({ text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        toast(t('Common.copied'), 'success')
      }
    } catch (error) {
      // A dismissed share sheet rejects too; that is not an error worth showing.
      reportError(error, 'share', { silent: true })
    }
  }

  return (
    <motion.section
      aria-labelledby='result-title'
      initial={reduce ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className='panel-gold mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-6 text-center sm:p-10'
    >
      <Emblem className={end.outcome === 'won' ? 'size-24 animate-float' : 'size-20'} />
      <h2 id='result-title' className='text-h1 font-black text-gold-gradient'>
        {t(`Result.${titleKey}`)}
      </h2>

      {isClassic ? (
        <p className='font-display text-display font-black text-shimmer tabular'>
          <MoneyCounter amount={end.winnings} locale={locale} />
        </p>
      ) : (
        <p className='flex flex-col items-center'>
          <span className='font-display text-display font-black text-shimmer tabular'>{end.score}</span>
          <span className='text-caption font-bold tracking-[0.25em] text-spot-300 uppercase'>{t('Game.score')}</span>
        </p>
      )}

      <p className='max-w-md text-mist' aria-live='polite'>
        {body}
      </p>

      <div className='flex flex-wrap justify-center gap-2'>
        {end.isPersonalBest && (
          <span className='inline-flex items-center gap-1.5 rounded-full bg-gold-400/15 px-3 py-1 text-body-sm font-bold text-gold-200'>
            <Sparkles aria-hidden className='size-4' /> {t('Result.personalBest')}
          </span>
        )}
        {ranked && end.rank && (
          <span className='inline-flex items-center gap-1.5 rounded-full bg-spot-500/15 px-3 py-1 text-body-sm font-bold text-spot-100'>
            <Award aria-hidden className='size-4' /> {t('Result.rank', { rank: end.rank })}
          </span>
        )}
      </div>

      {end.newBadges.length > 0 && (
        <div className='flex w-full flex-col items-center gap-3 rounded-2xl border border-gold-400/30 bg-studio-950/50 p-4'>
          <p className='font-display font-bold text-gold-200'>{t('Result.newBadges', { count: end.newBadges.length })}</p>
          <ul className='flex flex-wrap justify-center gap-4'>
            {end.newBadges.map((badgeId, index) => (
              <li key={badgeId} className='flex w-24 flex-col items-center gap-1.5' style={{ animationDelay: `${index * 120}ms` }}>
                <BadgeMedal badgeId={badgeId} earned celebrate />
                <span className='text-caption font-semibold'>{t(`Badges.items.${badgeId}.name`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='flex w-full flex-col gap-3 sm:flex-row sm:justify-center'>
        <Button onClick={onPlayAgain} icon={<RotateCcw aria-hidden className='size-5' />}>
          {t('Common.playAgain')}
        </Button>
        <Button variant='outline' onClick={share} icon={<Share2 aria-hidden className='size-5' />}>
          {t('Common.share')}
        </Button>
      </div>
      <div className='flex flex-wrap justify-center gap-2'>
        {mode !== 'classic' && (
          <ButtonLink href={ROUTES.leaderboard} variant='ghost' size='sm'>
            {t('Result.viewLeaderboard')}
          </ButtonLink>
        )}
        <ButtonLink href={ROUTES.home} variant='ghost' size='sm'>
          <Home aria-hidden className='size-4' /> {t('Result.backHome')}
        </ButtonLink>
      </div>

      {!user && googleAvailable && (
        <div className='flex w-full flex-col items-center gap-3 border-t border-spot-300/10 pt-5'>
          <p className='text-body-sm text-mist'>{t('Result.signInToSave')}</p>
          <GoogleSignInButton />
        </div>
      )}
    </motion.section>
  )
}
