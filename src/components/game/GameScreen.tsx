'use client'

import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { Flag, Landmark, ListOrdered, LogOut, Repeat, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { useGameSessionStore } from '@store/game/session/store'
import { useCountdown } from '@hooks/useCountdown'
import { useLeaveGuard } from '@hooks/useLeaveGuard'
import { type GameMode, MARATHON_RULES, OPTION_LETTERS, STAGES_COUNT, TIME_ATTACK_RULES } from '@constants/game'
import { cn } from '@helpers/cn'
import { guaranteedAmount, isSafeHaven, prizeForStage, walkAwayAmount } from '@helpers/game/ladder'
import { classicSeconds } from '@helpers/game/settings'
import { formatMoney } from '@helpers/money'
import { Emblem } from '@components/brand/Emblem'
import { Lozenge } from '@components/ui/bare/Lozenge'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { IconButton } from '@components/ui/IconButton'
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
import { StudioLoader } from './StudioLoader'
import { TimerRing } from './TimerRing'

/** Where the money ladder is a permanent column (globals.css `--breakpoint-lg`); below it, a sheet. */
const LADDER_COLUMN_QUERY = '(min-width: 64rem)'

/**
 * The studio floor: exactly one screen under the header, never scrolled, like a game. The
 * board (question and answers) is pinned to the bottom, within thumb reach; the HUD and the
 * lifelines sit on top, and lifeline results and the reveal float over the space between
 * them instead of pushing the board around. The final answer is asked in a dialog.
 * Desktop adds the money ladder (or the run stats) as a column; below `lg` it is a sheet,
 * which also rises by itself between Classic questions to show the climb.
 */
export const GameScreen = ({ mode }: { mode: GameMode }) => {
  const t = useTranslations()
  const locale = useLocale()
  const reduce = useReducedMotion()
  const store = useGameSessionStore()
  const toggleMuted = useAudioStore.use.toggleMuted()
  const [ladderOpen, setLadderOpen] = useState(false)
  /** The climb the player closed early, by the answer count it celebrates. */
  const [climbDismissed, setClimbDismissed] = useState<number | null>(null)
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
    switchPreview,
    ladderClimb,
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

  // The final-answer dialog keeps showing the pick while it animates closed.
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null)
  if (selectedIndex !== null && selectedIndex !== confirmIndex) setConfirmIndex(selectedIndex)

  // A game belongs to its page: leaving the page (or opening another mode) ends it.
  useEffect(() => {
    if (useGameSessionStore.getState().mode !== mode) quitGame()
    return () => quitGame()
  }, [mode, quitGame])

  // A game in progress is lost by leaving the page; ask first.
  useLeaveGuard(phase !== 'idle' && phase !== 'ended' && (ranked ? 'rankedGame' : 'game'))

  const playing = phase === 'asking' || phase === 'selected'
  const timeUp = store.timeUp
  const questionRemaining = useCountdown(questionDeadline, timeUp, !playing || overlay?.type === 'phoneAFriend')
  const runRemaining = useCountdown(mode === 'timeAttack' ? runEndsAt : null, timeUp, phase === 'idle' || phase === 'ended')

  const questionTotalMs =
    mode === 'classic' && settings
      ? (classicSeconds(stage, settings.timer) ?? 0) * 1000
      : mode === 'marathon'
        ? MARATHON_RULES.questionSeconds * 1000
        : 0

  const onKey = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const state = useGameSessionStore.getState()
      const key = event.key.toLowerCase()
      // An open dialog owns the keyboard. In the final-answer one, Enter confirms — unless a
      // focused button is about to handle it itself.
      const dialog = target?.closest('[aria-modal="true"]')
      if (dialog) {
        if (key === 'enter' && state.phase === 'selected' && target?.tagName !== 'BUTTON' && dialog.querySelector('[data-final-answer]')) {
          event.preventDefault()
          void state.confirmAnswer()
        }
        return
      }
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

  const title = t(`Modes.${mode}.name`)

  /** Before and after the game: one panel, centred on the screen — under the mode's name before it. */
  const menuScreen = (children: ReactNode, showTitle: boolean) => (
    <div className='flex min-h-stage flex-col items-center justify-center gap-4 py-4 pb-[max(1rem,var(--safe-bottom))]'>
      <h1
        className={cn(
          'text-center font-display text-h3 font-black tracking-wide text-gold-gradient uppercase sm:text-h2',
          !showTitle && 'sr-only'
        )}
      >
        {title}
      </h1>
      {children}
    </div>
  )

  if (phase === 'idle') return menuScreen(<GameSetup mode={mode} />, true)

  if (phase === 'ended' && end) {
    return menuScreen(
      <ResultScreen
        end={end}
        mode={mode}
        ranked={ranked}
        onPlayAgain={() => settings && store.startGame({ mode, locale, settings })}
      />,
      false
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
  // The column shows the climb by itself; elsewhere the sheet comes up for it. Only ever true
  // after a game has started on the client, so reading the viewport here is safe.
  const climbSheet = ladderClimb && climbDismissed !== answered && !window.matchMedia(LADDER_COLUMN_QUERY).matches
  const safeHavenReached = t('Game.safeHavenReached', { amount: formatMoney(prizeForStage(answered), locale) })

  // What floats over the space above the board, if anything. A lifeline's result can still be
  // open when the answer is revealed; the reveal takes its place.
  const callout =
    phase === 'switching' && switchPreview
      ? 'switch'
      : (phase === 'revealed' || phase === 'transition') && lastAnswerCorrect !== null
        ? 'reveal'
        : (overlay?.type ?? null)
  const lifeline = overlay && callout === overlay.type ? overlay : null

  return (
    <div className='grid h-stage min-h-120 grid-cols-1 grid-rows-[minmax(0,1fr)] pt-2 pb-[max(0.5rem,var(--safe-bottom))] sm:pt-4 sm:pb-[max(1rem,var(--safe-bottom))] lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]'>
      <h1 className='sr-only'>{title}</h1>

      <div className='flex min-h-0 flex-col gap-2 sm:gap-4 short:gap-1.5'>
        {/* Everything above the board. The callout layer covers it, never the question or the answers. */}
        <div className='relative flex min-h-0 flex-1 flex-col gap-2 sm:gap-4 short:gap-1.5'>
          {/* HUD */}
          <div className='grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2'>
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
                <TimerRing remainingMs={runRemaining} totalMs={TIME_ATTACK_RULES.durationSeconds * 1000} size='lg' className='short:size-20' />
              ) : (
                <TimerRing remainingMs={questionRemaining} totalMs={questionTotalMs || null} className='short:size-14' />
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

            <div className='flex flex-col items-end gap-0.5 text-end sm:gap-1'>
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
            className='shrink-0'
          />

          {/* The set between beats: notices, the loader, the emblem under its spotlight. */}
          <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden' aria-live='polite'>
            {source !== 'online' && phase !== 'loading' && (
              <p className='rounded-tag border border-lock-500/40 bg-lock-500/10 px-4 py-1.5 text-center text-caption text-lock-300'>
                {source === 'pack' ? t('Game.packNotice') : t('Game.fallbackNotice')}
              </p>
            )}

            {phase === 'loading' && (
              <StudioLoader label={stage === 1 && correctCount === 0 ? t('Game.loading') : t('Game.loadingQuestion')} />
            )}

            {/* Phones keep the space for the callouts. */}
            {phase === 'asking' && !overlay && !busyLifeline && (
              <div aria-hidden className='relative hidden sm:block short:hidden'>
                <span className='absolute inset-0 rounded-full bg-spot-500/25 blur-2xl' />
                <Emblem className='relative size-28 animate-float drop-shadow-[0_0_30px_var(--color-gold-500)] lg:size-36' />
              </div>
            )}

            {phase === 'locked' && <p className='font-display text-body-sm font-bold tracking-[0.3em] text-lock-300 uppercase'>{t('Game.locked')}</p>}
          </div>

          {/* The callout layer: lifeline results, the reveal and the Switch interlude. Anchored to the
              board, it grows upward over the HUD only when the screen has no room left. */}
          <div aria-live='polite' className='pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end gap-2'>
            <AnimatePresence mode='wait'>
              {callout && (
                <motion.div
                  key={callout}
                  initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    'pointer-events-auto relative flex max-h-full w-full max-w-xl flex-col items-center gap-2 overflow-y-auto p-4 text-center panel-chrome sm:gap-3 short:py-2',
                    lifeline && 'px-13'
                  )}
                >
                  {lifeline?.type === 'askAudience' && question && <AudiencePanel votes={lifeline.votes} removed={question.removed} />}
                  {lifeline?.type === 'phoneAFriend' && question && (
                    lifeline.status === 'calling' ? (
                      <PhoneCallPanel status='calling' options={question.options} />
                    ) : (
                      <PhoneCallPanel status='answered' answer={lifeline.answer} options={question.options} />
                    )
                  )}
                  {lifeline && (
                    <IconButton
                      label={t('Common.close')}
                      icon={<X aria-hidden className='size-5' />}
                      onClick={store.closeOverlay}
                      className='absolute inset-e-1.5 top-1.5'
                    />
                  )}

                  {callout === 'reveal' && (
                    <>
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
                        <p className='mt-1 rounded-tag bg-gold-400/15 px-4 py-1 font-display font-bold text-gold-200 sweep-gold'>
                          {safeHavenReached}
                        </p>
                      )}
                    </>
                  )}

                  {/* Switch the Question: "what would you have said?" — revealed, never scored, then the new question. */}
                  {callout === 'switch' && switchPreview && (
                    switchPreview.status === 'choosing' ? (
                      <>
                        <p className='flex items-center gap-2 font-display text-h3 font-black text-spot-100'>
                          <Repeat aria-hidden className='size-5 shrink-0 text-gold-300' />
                          {t('Game.switchPrompt')}
                        </p>
                        <p className='text-body-sm text-mist'>{t('Game.switchPromptHint')}</p>
                        <Button variant='ghost' size='sm' onClick={() => void store.previewSwitchAnswer(null)}>
                          {t('Game.switchSkip')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className={cn('font-display text-h2 font-black', switchPreview.correct ? 'text-correct-300' : 'text-wrong-300')}>
                          {switchPreview.correct ? t('Game.switchWouldBeRight') : t('Game.switchWouldBeWrong')}
                        </p>
                        {!switchPreview.correct && question && (
                          <p className='text-body-sm text-mist'>
                            {t('Game.theAnswerWas', {
                              letter: OPTION_LETTERS[switchPreview.correctIndex] ?? '',
                              text: question.options[switchPreview.correctIndex] ?? '',
                            })}
                          </p>
                        )}
                        <p className='text-caption tracking-widest text-spot-300 uppercase'>{t('Game.switchComing')}</p>
                      </>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {Boolean(error) && playing && (
              <ErrorAlert error={error} message={t('Game.answerError')} className='pointer-events-auto w-full max-w-md' />
            )}
          </div>
        </div>

        {question && phase !== 'loading' && (
          <div className='flex shrink-0 flex-col gap-2 sm:gap-4 short:gap-1.5'>
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

      <aside className='hidden min-h-0 lg:block'>
        <div className='flex max-h-full flex-col gap-4 overflow-y-auto'>
          {mode === 'classic' ? (
            <>
              <PrizeLadder {...ladderProps} />
              <p className='px-2 text-caption text-mist'>
                {t('Game.guaranteed')}: <span className='font-bold text-gold-300'>{formatMoney(guaranteedAmount(answered), locale)}</span>
              </p>
            </>
          ) : (
            <div className='panel flex flex-col items-center gap-2 p-6 text-center'>
              <span className='text-caption font-bold tracking-widest text-spot-300 uppercase'>{title}</span>
              <span className='font-display text-display font-black text-gold-gradient tabular'>{correctCount}</span>
              <span className='text-mist'>{t('Game.correctCount', { count: correctCount })}</span>
              {question && <span className='mt-2 rounded-tag bg-spot-500/15 px-3 py-1 text-body-sm text-spot-100'>{t('Common.levelNumber', { level: question.level })}</span>}
            </div>
          )}
        </div>
      </aside>

      {/* "Is that your final answer?" — over the board, which stays where it is. */}
      <Dialog
        open={phase === 'selected'}
        onClose={store.cancelSelection}
        title={t('Game.finalAnswerPrompt')}
        footer={
          <>
            <Button variant='ghost' onClick={store.cancelSelection} className='grow sm:grow-0'>
              {t('Game.changeAnswer')}
            </Button>
            {/* Focused on open, so A–D then Enter (the keyboard hint) locks the answer in. */}
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <Button autoFocus onClick={() => void store.confirmAnswer()} className='grow sm:grow-0'>
              {t('Game.finalAnswer')}
            </Button>
          </>
        }
      >
        <div data-final-answer className='py-2'>
          {question && confirmIndex !== null && (
            <Lozenge tone='selected' fillClassName='min-h-14 gap-3 px-[calc(var(--spacing-tip)+0.25rem)] py-2.5'>
              <span className='font-display text-option font-black text-gold-300'>{OPTION_LETTERS[confirmIndex]}:</span>
              <span
                lang={question.fallback ? 'en' : undefined}
                dir={question.fallback ? 'ltr' : undefined}
                className='flex-1 text-option font-semibold text-ivory'
              >
                {question.options[confirmIndex]}
              </span>
            </Lozenge>
          )}
        </div>
      </Dialog>

      {mode === 'classic' && (
        <Dialog
          open={ladderOpen || climbSheet}
          onClose={() => {
            setLadderOpen(false)
            if (ladderClimb) setClimbDismissed(answered)
          }}
          title={t('Game.ladder')}
          description={climbSheet && showSafeHaven ? safeHavenReached : undefined}
          variant='sheet'
        >
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
