'use client'

import { useEffect } from 'react'
import { LogIn, Play, Settings2, Trophy } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { useGameSessionStore } from '@store/game/session/store'
import { useSettingsStore } from '@store/settings/store'
import { useOnline } from '@hooks/useOnline'
import { type GameMode, isCategory, LADDER, MARATHON_RULES, TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { isDefaultSettings } from '@helpers/game/settings'
import { formatMoney } from '@helpers/money'
import { AppLink, ButtonLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'

/**
 * Everything before the first question: the mode's rules and the start button,
 * server-rendered so the page is playable before any JavaScript runs.
 *
 * Classic plays the player's saved settings (edited on the Settings page; a note here says
 * when they differ from the defaults). Marathon and Time Attack are always refereed by the
 * server on the standard rules, so they need a connection — offline they say so instead of
 * offering a start that would fail — and an account, so every run can reach the leaderboard:
 * a signed-out player gets a way to sign in where the start button would be. Classic plays
 * without one.
 */
export const GameSetup = ({ mode }: { mode: GameMode }) => {
  const t = useTranslations()
  const locale = useLocale()
  const settings = useSettingsStore.use.game()
  const setGameSettings = useSettingsStore.use.setGameSettings()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const startGame = useGameSessionStore.use.startGame()
  const error = useGameSessionStore.use.error()
  const isPending = useGameSessionStore.use.isPending()
  const online = useOnline()

  const ranked = mode !== 'classic'
  const needsSignIn = ranked && isResolved && !user
  // Until the session resolves, a ranked start could still turn out to need an account.
  const blocked = ranked && (!online || !user)

  // `?category=history` from a category landing page plays that category. Read once from
  // `window.location` rather than useSearchParams, which would need a Suspense boundary.
  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category')
    if (mode === 'classic' && isCategory(category)) setGameSettings({ categories: [category] })
  }, [mode, setGameSettings])

  const rulesValues = {
    top: formatMoney(LADDER[LADDER.length - 1], locale),
    seconds: mode === 'timeAttack' ? TIME_ATTACK_RULES.durationSeconds : MARATHON_RULES.questionSeconds,
    minutes: MARATHON_RULES.questionSeconds / 60,
    penalty: TIME_ATTACK_RULES.wrongPenaltySeconds,
  }

  return (
    <div className='panel-gold mx-auto flex w-full max-w-2xl animate-rise flex-col gap-6 p-5 sm:p-8'>
      <div className='flex flex-col items-center gap-2 text-center'>
        <p className='eyebrow'>{t(`Modes.${mode}.tagline`, { seconds: TIME_ATTACK_RULES.durationSeconds })}</p>
        <p className='max-w-lg text-mist'>{t(`Modes.${mode}.rules`, rulesValues)}</p>
      </div>

      {ranked ? (
        <p className='flex justify-center gap-2 text-center text-body-sm text-mist'>
          <Trophy aria-hidden className='size-4 shrink-0 text-gold-300' />
          <span>{!online ? t('Modes.needsConnection') : needsSignIn ? t('Modes.signInRequired') : t('Modes.rankedHint')}</span>
        </p>
      ) : (
        !isDefaultSettings(settings) && (
          <p className='flex items-center justify-center gap-2 text-center text-body-sm text-mist'>
            <Settings2 aria-hidden className='size-4 shrink-0 text-gold-300' />
            {t('Settings.customised')}
            <AppLink href={ROUTES.settings} className='font-semibold text-gold-200 underline-offset-4 hover:underline'>
              {t('Settings.change')}
            </AppLink>
          </p>
        )
      )}

      {Boolean(error) && <ErrorAlert error={error} message={t('Game.error')} />}

      {needsSignIn ? (
        <ButtonLink href={ROUTES.signIn} size='lg' fullWidth>
          <LogIn aria-hidden className='size-6 rtl:-scale-x-100' />
          {t('Common.signIn')}
        </ButtonLink>
      ) : (
        <Button
          size='lg'
          fullWidth
          onClick={() => startGame({ mode, locale, settings })}
          loading={isPending}
          disabled={blocked}
          icon={ranked ? <Trophy aria-hidden className='size-6' /> : <Play aria-hidden className='size-6' />}
        >
          {t('Game.startGame')}
        </Button>
      )}
      <p className='hidden text-center text-caption text-mist-dim lg:block'>{t('Game.keyboardHint')}</p>
    </div>
  )
}
