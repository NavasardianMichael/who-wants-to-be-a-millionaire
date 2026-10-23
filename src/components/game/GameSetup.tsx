'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Play, Settings2, Trophy } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { useGameSessionStore } from '@store/game/session/store'
import { useSettingsStore } from '@store/settings/store'
import { useOnline } from '@hooks/useOnline'
import {
  CATEGORIES,
  type GameMode,
  isCategory,
  LADDER,
  type Lifeline,
  LIFELINES,
  MARATHON_RULES,
  TIME_ATTACK_RULES,
} from '@constants/game'
import { cn } from '@helpers/cn'
import { DEFAULT_SETTINGS, DIFFICULTIES, type Difficulty, isDefaultSettings, TIMER_OPTIONS, type TimerSetting } from '@helpers/game/settings'
import { formatMoney } from '@helpers/money'
import { GoogleSignInButton } from '@components/layout/GoogleSignInButton'
import { Button } from '@components/ui/Button'
import { Chip } from '@components/ui/Chip'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { SegmentedControl } from '@components/ui/SegmentedControl'
import { Toggle } from '@components/ui/Toggle'

/**
 * Everything before the first question: ranked or practice (Marathon / Time Attack), the
 * custom settings, and the start button. Server-rendered with the defaults, so the page
 * already shows a complete, playable setup before any JavaScript runs.
 */
export const GameSetup = ({ mode }: { mode: GameMode }) => {
  const t = useTranslations()
  const locale = useLocale()
  const settings = useSettingsStore.use.game()
  const setGameSettings = useSettingsStore.use.setGameSettings()
  const resetGameSettings = useSettingsStore.use.resetGameSettings()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const googleAvailable = useAuthStore.use.googleAvailable()
  const startGame = useGameSessionStore.use.startGame()
  const error = useGameSessionStore.use.error()
  const isPending = useGameSessionStore.use.isPending()

  const rankable = mode !== 'classic'
  const [ranked, setRanked] = useState(rankable)
  const online = useOnline()
  const [showSettings, setShowSettings] = useState(false)

  // `?category=history` from a category landing page preselects that category (the dot on
  // "Game settings" shows it is customised). Read once from `window.location` rather than
  // useSearchParams, which would need a Suspense boundary.
  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category')
    if (isCategory(category)) setGameSettings({ categories: [category] })
  }, [setGameSettings])

  const canRank = rankable && Boolean(user) && online
  const playRanked = ranked && canRank

  const start = () =>
    startGame({ mode, locale, ranked: playRanked, settings: playRanked ? DEFAULT_SETTINGS : settings })

  const toggleCategory = (category: (typeof CATEGORIES)[number]) => {
    const next = settings.categories.includes(category)
      ? settings.categories.filter((each) => each !== category)
      : [...settings.categories, category]
    setGameSettings({ categories: next })
  }

  const toggleLifeline = (lifeline: Lifeline, on: boolean) =>
    setGameSettings({ lifelines: on ? [...settings.lifelines, lifeline] : settings.lifelines.filter((each) => each !== lifeline) })

  const timerLabel = (option: TimerSetting) =>
    option === 'classic' ? t('Settings.timerClassic') : option === 'off' ? t('Settings.timerOff') : t('Common.secondsShort', { count: option })

  const rulesValues = {
    top: formatMoney(LADDER[LADDER.length - 1], locale),
    seconds: mode === 'timeAttack' ? TIME_ATTACK_RULES.durationSeconds : MARATHON_RULES.questionSeconds,
    penalty: TIME_ATTACK_RULES.wrongPenaltySeconds,
  }

  return (
    <div className='panel-gold mx-auto flex w-full max-w-2xl animate-rise flex-col gap-6 p-5 sm:p-8'>
      <div className='flex flex-col items-center gap-2 text-center'>
        <p className='text-caption font-bold tracking-[0.25em] text-spot-300 uppercase'>
          {t(`Modes.${mode}.tagline`, { seconds: TIME_ATTACK_RULES.durationSeconds })}
        </p>
        <p className='max-w-lg text-mist'>{t(`Modes.${mode}.rules`, rulesValues)}</p>
      </div>

      {rankable && (
        <div className='flex flex-col items-center gap-3'>
          <SegmentedControl
            label={t('Leaderboard.mode')}
            value={playRanked ? 'ranked' : 'practice'}
            onChange={(value) => setRanked(value === 'ranked')}
            options={[
              { value: 'ranked', label: t('Modes.ranked') },
              { value: 'practice', label: t('Modes.practice') },
            ]}
          />
          <p className='text-center text-body-sm text-mist'>
            {ranked && !online
              ? t('Modes.offlineUnranked')
              : ranked && isResolved && !user
                ? t('Modes.signInForRanked')
                : playRanked
                  ? t('Modes.rankedHint')
                  : t('Modes.practiceHint')}
          </p>
          {ranked && isResolved && !user && online && googleAvailable && <GoogleSignInButton />}
        </div>
      )}

      {!playRanked && (
        <div className='rounded-2xl border border-spot-300/15 bg-studio-950/40'>
          <button
            type='button'
            onClick={() => setShowSettings((value) => !value)}
            aria-expanded={showSettings}
            className='flex min-h-12 w-full items-center gap-2 px-4 font-semibold text-ivory'
          >
            <Settings2 aria-hidden className='size-5 text-spot-300' />
            <span className='flex-1 text-start'>{t('Settings.gameTitle')}</span>
            {!isDefaultSettings(settings) && <span className='size-2 rounded-full bg-gold-400' aria-hidden />}
            <ChevronDown aria-hidden className={cn('size-5 transition-transform', showSettings && 'rotate-180')} />
          </button>

          {showSettings && (
            <div className='flex flex-col gap-6 border-t border-spot-300/10 p-4'>
              <fieldset className='flex flex-col gap-3'>
                <legend className='mb-1 font-semibold'>{t('Settings.categories')}</legend>
                <p className='-mt-2 text-body-sm text-mist'>{t('Settings.categoriesHint')}</p>
                <div className='flex flex-wrap gap-2'>
                  <Chip
                    label={t('Settings.allCategories')}
                    selected={settings.categories.length === 0}
                    onToggle={() => setGameSettings({ categories: [] })}
                  />
                  {CATEGORIES.map((category) => (
                    <Chip
                      key={category}
                      label={t(`Categories.names.${category}`)}
                      selected={settings.categories.includes(category)}
                      onToggle={() => toggleCategory(category)}
                    />
                  ))}
                </div>
              </fieldset>

              <div className='flex flex-col gap-2'>
                <span className='font-semibold'>{t('Settings.difficulty')}</span>
                <SegmentedControl<Difficulty>
                  label={t('Settings.difficulty')}
                  value={settings.difficulty}
                  onChange={(difficulty) => setGameSettings({ difficulty })}
                  options={DIFFICULTIES.map((value) => ({
                    value,
                    label: t(`Settings.difficulty${value[0]!.toUpperCase()}${value.slice(1)}`),
                  }))}
                />
              </div>

              {mode !== 'timeAttack' && (
                <div className='flex flex-col gap-2'>
                  <span className='font-semibold'>{t('Settings.timer')}</span>
                  <SegmentedControl<TimerSetting>
                    label={t('Settings.timer')}
                    size='sm'
                    value={settings.timer}
                    onChange={(timer) => setGameSettings({ timer })}
                    options={TIMER_OPTIONS.map((value) => ({ value, label: timerLabel(value) }))}
                  />
                  {settings.timer === 'classic' && mode === 'classic' && (
                    <p className='text-caption text-mist'>{t('Settings.timerClassicHint')}</p>
                  )}
                </div>
              )}

              {mode !== 'timeAttack' && (
                <fieldset className='flex flex-col gap-3'>
                  <legend className='mb-1 font-semibold'>{t('Settings.lifelines')}</legend>
                  {LIFELINES.map((lifeline) => (
                    <Toggle
                      key={lifeline}
                      label={t(`Lifelines.${lifeline}`)}
                      description={t(`Lifelines.${lifeline}Description`)}
                      checked={settings.lifelines.includes(lifeline)}
                      onChange={(on) => toggleLifeline(lifeline, on)}
                    />
                  ))}
                </fieldset>
              )}

              <Button variant='ghost' size='sm' onClick={resetGameSettings} className='self-start'>
                {t('Settings.reset')}
              </Button>
            </div>
          )}
        </div>
      )}

      {Boolean(error) && <ErrorAlert error={error} message={t('Game.error')} />}

      <Button
        size='lg'
        fullWidth
        onClick={start}
        loading={isPending}
        icon={playRanked ? <Trophy aria-hidden className='size-6' /> : <Play aria-hidden className='size-6' />}
      >
        {rankable ? (playRanked ? t('Game.startRanked') : t('Game.startPractice')) : t('Game.startGame')}
      </Button>
      <p className='hidden text-center text-caption text-mist-dim lg:block'>{t('Game.keyboardHint')}</p>
    </div>
  )
}
