'use client'

import { useCallback, useEffect, useState } from 'react'
import { Flag, Landmark, ListOrdered, LogOut } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { useGameSessionStore } from '@store/game/session/store'
import { useCountdown } from '@hooks/useCountdown'
import { type GameMode, MARATHON_RULES, OPTION_LETTERS, STAGES_COUNT, TIME_ATTACK_RULES } from '@constants/game'
import { cn } from '@helpers/cn'
import { guaranteedAmount, isSafeHaven, prizeForStage, walkAwayAmount } from '@helpers/game/ladder'
import { classicSeconds, marathonSeconds } from '@helpers/game/settings'
import { formatMoney } from '@helpers/money'
import { Emblem } from '@components/brand/Emblem'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { IconButton } from '@components/ui/IconButton'
import { Spinner } from '@components/ui/Spinner'
import { AnswerGrid } from './AnswerGrid'
import { AudiencePanel } from './AudiencePanel'
import { GameSetup } from './GameSetup'
import { LifelineBar } from './LifelineBar'
import { MoneyCounter } from './MoneyCounter'
import { PhoneCallPanel } from './PhoneCallPanel'
import { PrizeLadder } from './PrizeLadder'
import { QuestionPanel } from './QuestionPanel'
import { isReportable, ReportQuestionDialog } from './ReportQuestionDialog'
import { ResultScreen } from './ResultScreen'
import { TimerRing } from './TimerRing'

/**
 * The studio floor. Desktop: board on the left, the money ladder (or the run stats) always
 * visible on the right. Tablet: the ladder moves into a drawer. Phone: one column, answers
 * stacked within thumb reach, the ladder in a bottom sheet.
 */
export const GameScreen = ({ mode }: { mode: GameMode }) => {
  const t = useTranslations()
  const locale = useLocale()
  const reduce = useReducedMotion()
  const store = useGameSessionStore()
  const toggleMuted = useAudioStore.use.toggleMuted()
  const [ladderOpen, setLadderOpen] = useState(false)
  const [walkAwayOpen, setWalkAwayOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const {
    phase,
    question,
    stage,
    correctCount,
    selectedIndex,
    revealedCorrectIndex,
    lastAnswerCorrect,
    lifelinesAllowed,
    lifelinesUsed,
    busyLifeline,
    overlay,
    questionDeadline,
    runEndsAt,
    penaltyCount,
    ranked,
    source,
    end,
    error,
    settings,
  } = store

  const quitGame = store.quitGame

  // A game belongs to its page: leaving the page (or opening another mode) ends it.
  useEffect(() => {
    if (useGameSessionStore.getState().mode !== mode) quitGame()
    return () => quitGame()
  }, [mode, quitGame])

  const playing = phase === 'asking' || phase === 'selected'
  const timeUp = store.timeUp
  const questionRemaining = useCountdown(questionDeadline, timeUp, !playing || overlay?.type === 'phoneAFriend')
  const runRemaining = useCountdown(mode === 'timeAttack' ? runEndsAt : null, timeUp, phase === 'idle' || phase === 'ended')

  const questionTotalMs =
    mode === 'classic' && settings
      ? (classicSeconds(stage, settings.timer) ?? 0) * 1000
      : mode === 'marathon'
        ? (ranked ? MARATHON_RULES.questionSeconds : (settings && marathonSeconds(settings.timer)) || 0) * 1000
        : 0

  const onKey = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (document.querySelector('dialog[open]')) return
      const state = useGameSessionStore.getState()
      const key = event.key.toLowerCase()
      const letterIndex = ['a', 'b', 'c', 'd'].indexOf(key)
      const digitIndex = ['1', '2', '3', '4'].indexOf(key)
      const index = letterIndex >= 0 ? letterIndex : digitIndex
      if (index >= 0) state.selectOption(index)
      else if (key === 'enter' && state.phase === 'selected') void state.confirmAnswer()
      else if (key === 'escape') state.cancelSelection()
      else if (key === 'l' && mode === 'classic') setLadderOpen((open) => !open)
      else if (key === 'm') toggleMuted()
      else return
      event.preventDefault()
    },
    [mode, toggleMuted]
  )

  useEffect(() => {
    if (phase === 'idle' || phase === 'ended') return
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onKey])

  if (phase === 'idle') return <GameSetup mode={mode} />

  if (phase === 'ended' && end) {
    return (
      <ResultScreen
        end={end}
        mode={mode}
        ranked={ranked}
        onPlayAgain={() => settings && store.startGame({ mode, locale, settings, ranked })}
      />
    )
  }

  const answered = correctCount
  const ladderProps = {
    locale,
    currentStage: stage,
    answered,
    title: t('Game.ladder'),
    safeHavenLabel: t('Game.safeHaven'),
  }

  const counter =
    mode === 'classic'
      ? t('Game.questionOf', { current: stage, total: STAGES_COUNT })
      : t('Common.questionNumber', { number: stage })

  const correctLetter = revealedCorrectIndex !== null ? OPTION_LETTERS[revealedCorrectIndex] : null
  const showSafeHaven = mode === 'classic' && phase === 'transition' && isSafeHaven(answered)

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]'>
      {/* Fills the viewport under the header and the page title, so the answers sit at the bottom, within thumb reach. */}
      <div className='flex min-h-[calc(100dvh-var(--spacing-header)-6.5rem)] flex-col gap-3 sm:gap-4'>
        {/* HUD */}
        <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-2'>
          <div className='flex items-center gap-2'>
            <IconButton label={t('Game.leave')} icon={<LogOut className='size-5 rtl:-scale-x-100' />} onClick={() => setLeaveOpen(true)} />
            {mode === 'classic' && (
              <IconButton
                label={t('Game.openLadder')}
                icon={<ListOrdered className='size-5' />}
                onClick={() => setLadderOpen(true)}
                className='lg:hidden'
              />
            )}
            {question && isReportable(question.id) && (
              <IconButton label={t('Game.report')} icon={<Flag className='size-4' />} onClick={() => setReportOpen(true)} className='hidden sm:inline-flex' />
            )}
          </div>

          <div className='relative'>
            {mode === 'timeAttack' ? (
              <TimerRing remainingMs={runRemaining} totalMs={TIME_ATTACK_RULES.durationSeconds * 1000} size='lg' />
            ) : (
              <TimerRing remainingMs={questionRemaining} totalMs={questionTotalMs || null} />
            )}
            <AnimatePresence>
              {mode === 'timeAttack' && penaltyCount > 0 && (
                <motion.span
                  key={penaltyCount}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -28 }}
                  transition={{ duration: 1.2 }}
                  className='absolute -top-2 left-1/2 -translate-x-1/2 font-display font-black text-wrong-300'
                  aria-hidden
                >
                  {t('Game.penalty', { seconds: TIME_ATTACK_RULES.wrongPenaltySeconds })}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className='flex flex-col items-end gap-1 text-end'>
            {mode === 'classic' ? (
              <>
                <span className='text-caption font-bold tracking-widest text-spot-300 uppercase'>{t('Game.playingFor')}</span>
                <MoneyCounter
                  amount={prizeForStage(stage)}
                  locale={locale}
                  className='font-display text-h3 font-black text-gold-gradient tabular sm:text-h2'
                />
                {playing && answered > 0 && (
                  <button
                    type='button'
                    onClick={() => setWalkAwayOpen(true)}
                    className='inline-flex items-center gap-1 text-body-sm font-semibold text-mist underline-offset-4 hover:text-gold-200 hover:underline'
                  >
                    <Landmark aria-hidden className='size-4' />
                    {t('Game.walkAway')}
                  </button>
                )}
              </>
            ) : (
              <>
                <span className='text-caption font-bold tracking-widest text-spot-300 uppercase'>{t('Game.score')}</span>
                <span className='font-display text-h2 font-black text-gold-gradient tabular'>{correctCount}</span>
                <span className='text-caption text-mist'>{ranked ? t('Modes.ranked') : t('Modes.practice')}</span>
              </>
            )}
          </div>
        </div>

        <LifelineBar
          allowed={lifelinesAllowed}
          used={lifelinesUsed}
          busy={busyLifeline}
          disabled={!playing}
          onUse={(lifeline) => void store.useLifeline(lifeline)}
        />

        {/* The stage: lifeline results, notices and the reveal feedback. */}
        <div className='flex min-h-28 flex-1 flex-col items-center justify-center gap-3 py-2' aria-live='polite'>
          {source !== 'online' && phase !== 'loading' && (
            <p className='rounded-full border border-lock-500/40 bg-lock-500/10 px-4 py-1.5 text-center text-caption text-lock-300'>
              {source === 'pack' ? t('Game.packNotice') : t('Game.fallbackNotice')}
            </p>
          )}

          {phase === 'loading' && (
            <div role='status' className='flex flex-col items-center gap-3 text-mist'>
              <Spinner size='lg' className='text-gold-300' />
              <span>{stage === 1 && correctCount === 0 ? t('Game.loading') : t('Game.loadingQuestion')}</span>
            </div>
          )}

          {/* The set between beats: the emblem under its spotlight. Phones keep the space for the board. */}
          {phase === 'asking' && !overlay && !busyLifeline && (
            <div aria-hidden className='relative hidden sm:block'>
              <span className='absolute inset-0 rounded-full bg-spot-500/25 blur-2xl' />
              <Emblem className='relative size-28 animate-float drop-shadow-[0_0_30px_var(--color-gold-500)] lg:size-36' />
            </div>
          )}

          {overlay?.type === 'askAudience' && question && <AudiencePanel votes={overlay.votes} removed={question.removed} />}
          {overlay?.type === 'phoneAFriend' && question && (
            overlay.status === 'calling' ? (
              <PhoneCallPanel status='calling' options={question.options} />
            ) : (
              <PhoneCallPanel status='answered' answer={overlay.answer} options={question.options} />
            )
          )}
          {overlay && (
            <Button variant='ghost' size='sm' onClick={store.closeOverlay}>
              {t('Common.close')}
            </Button>
          )}

          {(phase === 'revealed' || phase === 'transition') && lastAnswerCorrect !== null && (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='flex flex-col items-center gap-1 text-center'
            >
              <p className={cn('font-display text-h2 font-black', lastAnswerCorrect ? 'text-correct-300' : 'text-wrong-300')}>
                {lastAnswerCorrect ? t('Game.correct') : t('Game.wrong')}
              </p>
              {!lastAnswerCorrect && question && correctLetter && (
                <p className='text-body-sm text-mist'>
                  {t('Game.theAnswerWas', { letter: correctLetter, text: question.options[revealedCorrectIndex!] ?? '' })}
                </p>
              )}
              {question?.explanation && mode !== 'timeAttack' && (
                <p className='max-w-lg text-body-sm text-mist'>
                  <span className='font-semibold text-gold-300'>{t('Game.didYouKnow')} </span>
                  {question.explanation}
                </p>
              )}
              {showSafeHaven && (
                <p className='mt-2 rounded-full bg-gold-400/15 px-4 py-1 font-display font-bold text-gold-200 sweep-gold'>
                  {t('Game.safeHavenReached', { amount: formatMoney(prizeForStage(answered), locale) })}
                </p>
              )}
            </motion.div>
          )}

          {/* The host's question, in the empty space above the board — never below the fold. */}
          <AnimatePresence>
            {phase === 'selected' && (
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className='panel-gold flex w-full max-w-md flex-col items-center gap-3 p-4 text-center'
              >
                <p className='font-display text-h3 font-black text-lock-300'>{t('Game.finalAnswerPrompt')}</p>
                <div className='flex w-full gap-2'>
                  <Button variant='ghost' onClick={store.cancelSelection} className='flex-1'>
                    {t('Game.changeAnswer')}
                  </Button>
                  <Button onClick={() => void store.confirmAnswer()} className='flex-1'>
                    {t('Game.finalAnswer')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {phase === 'locked' && <p className='font-display text-body-sm font-bold tracking-[0.3em] text-lock-300 uppercase'>{t('Game.locked')}</p>}
          {Boolean(error) && playing && <ErrorAlert error={error} message={t('Game.answerError')} className='w-full max-w-md' />}
        </div>

        {question && phase !== 'loading' && (
          <div className='flex flex-col gap-3 pb-2 sm:gap-4'>
            <QuestionPanel key={question.id} question={question} counter={counter} />
            <AnswerGrid
              question={question}
              phase={phase}
              selectedIndex={selectedIndex}
              revealedCorrectIndex={revealedCorrectIndex}
              onSelect={store.selectOption}
            />
          </div>
        )}
      </div>

      <aside className='hidden lg:block'>
        <div className='sticky top-[calc(var(--spacing-header)+1rem)] flex flex-col gap-4'>
          {mode === 'classic' ? (
            <>
              <PrizeLadder {...ladderProps} />
              <p className='px-2 text-caption text-mist'>
                {t('Game.guaranteed')}: <span className='font-bold text-gold-300'>{formatMoney(guaranteedAmount(answered), locale)}</span>
              </p>
            </>
          ) : (
            <div className='panel flex flex-col items-center gap-2 p-6 text-center'>
              <span className='text-caption font-bold tracking-widest text-spot-300 uppercase'>{t(`Modes.${mode}.name`)}</span>
              <span className='font-display text-display font-black text-gold-gradient tabular'>{correctCount}</span>
              <span className='text-mist'>{t('Game.correctCount', { count: correctCount })}</span>
              {question && <span className='mt-2 rounded-full bg-spot-500/15 px-3 py-1 text-body-sm text-spot-100'>{t('Common.levelNumber', { level: question.level })}</span>}
            </div>
          )}
        </div>
      </aside>

      {mode === 'classic' && (
        <Dialog open={ladderOpen} onClose={() => setLadderOpen(false)} title={t('Game.ladder')} variant='sheet'>
          <PrizeLadder {...ladderProps} compact className='border-0 bg-transparent p-0 shadow-none' />
        </Dialog>
      )}

      <Dialog
        open={walkAwayOpen}
        onClose={() => setWalkAwayOpen(false)}
        title={t('Game.walkAwayTitle')}
        description={t('Game.walkAwayBody', { amount: formatMoney(walkAwayAmount(answered), locale) })}
        footer={
          <>
            <Button variant='ghost' onClick={() => setWalkAwayOpen(false)}>
              {t('Game.keepPlaying')}
            </Button>
            <Button
              onClick={() => {
                setWalkAwayOpen(false)
                void store.walkAway()
              }}
            >
              {t('Game.walkAwayConfirm', { amount: formatMoney(walkAwayAmount(answered), locale) })}
            </Button>
          </>
        }
      />

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('Game.leaveTitle')}
        description={ranked ? t('Game.leaveRankedBody') : t('Game.leaveBody')}
        footer={
          <>
            <Button variant='ghost' onClick={() => setLeaveOpen(false)}>
              {t('Game.keepPlaying')}
            </Button>
            <Button
              variant='danger'
              onClick={() => {
                setLeaveOpen(false)
                quitGame()
              }}
            >
              {t('Game.leave')}
            </Button>
          </>
        }
      />

      {question && isReportable(question.id) && (
        <ReportQuestionDialog questionId={question.id} open={reportOpen} onClose={() => setReportOpen(false)} />
      )}
    </div>
  )
}
