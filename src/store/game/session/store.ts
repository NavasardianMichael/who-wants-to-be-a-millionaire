import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { syncBadgesAPI } from '@api/badges/main'
import { getLeaderboardAPI } from '@api/leaderboards/main'
import { phoneAFriendAPI } from '@api/lifelines/main'
import { answerRunAPI, getRunAPI, runLifelineAPI, startRunAPI } from '@api/runs/main'
import { appendSelectors } from '@store/appendSelectors'
import { useAuthStoreBase } from '@store/auth/store'
import { usePacksStoreBase } from '@store/offline/packs/store'
import { useSettingsStoreBase } from '@store/settings/store'
import type { Question, RunAnswerResult, RunView } from '@interfaces/entities'
import { type BadgeId, type Category, type Level, type Lifeline, LIFELINES, STAGES_COUNT, TIME_ATTACK_RULES } from '@constants/game'
import { trackEvent } from '@helpers/analytics'
import { audioManager } from '@helpers/audio/audioManager'
import { musicForLevel } from '@helpers/audio/sounds'
import { guaranteedAmount, prizeForStage, walkAwayAmount } from '@helpers/game/ladder'
import { audienceVotes, fiftyFifty, friendPick } from '@helpers/game/lifelines'
import { mergeLocalBadges, readLocalBadges, recordGame } from '@helpers/game/progress'
import { QuestionQueue } from '@helpers/game/questionQueue'
import { readBest, writeBest } from '@helpers/game/records'
import { classicLevel, classicSeconds, marathonSeconds, practiceLevel } from '@helpers/game/settings'
import { enqueueClassicResult, flushOutbox } from '@helpers/offline/outbox'
import { getPack } from '@helpers/offline/packs'
import { reportError } from '@helpers/reportError'
import { uuid } from '@helpers/storage'
import { ActiveQuestion, GameEnd, GameOutcome, GameSessionActions, GameSessionState } from './types'

/**
 * The game director. One store runs all three modes, either **locally** (Classic and
 * practice runs: the device holds the answers) or **ranked** (Marathon / Time Attack
 * refereed by `/runs`: the device never sees an answer before the server reveals it).
 *
 * Actions are async sequences — sting, suspense, reveal, ladder climb — and every step
 * checks `alive(gen)`, so quitting mid-sequence can never let a stale timer mutate a newer
 * game.
 */
const initialState: GameSessionState = {
  mode: 'classic',
  ranked: false,
  locale: 'en',
  settings: null,
  phase: 'idle',
  question: null,
  stage: 1,
  correctCount: 0,
  selectedIndex: null,
  revealedCorrectIndex: null,
  lastAnswerCorrect: null,
  lifelinesAllowed: [...LIFELINES],
  lifelinesUsed: [],
  busyLifeline: null,
  overlay: null,
  questionDeadline: null,
  runEndsAt: null,
  penaltyCount: 0,
  runId: null,
  source: 'online',
  offline: false,
  end: null,
  isPending: false,
  error: null,
}

/** How long each beat of the show lasts, per mode. Classic builds suspense as the money grows. */
const PACE = {
  classic: { suspenseMs: (stage: number) => (stage <= 5 ? 1500 : stage <= 10 ? 2800 : 4000), revealMs: 2600, transitionMs: 1700 },
  marathon: { suspenseMs: () => 1000, revealMs: 1400, transitionMs: 600 },
  timeAttack: { suspenseMs: () => 250, revealMs: 650, transitionMs: 150 },
} as const

/** Extra thinking time granted while a lifeline plays out (mirrors the server's allowance). */
const LIFELINE_EXTRA_MS: Partial<Record<Lifeline, number>> = { phoneAFriend: 20_000, askAudience: 8_000 }

const QUICK_ANSWER_MS = 3000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Per-game working memory that is not UI state.
let generation = 0
let queue: QuestionQueue | null = null
let shownAt = 0
let tally = { quickAnswers: 0, categoryCorrect: {} as Partial<Record<Category, number>>, savedByFriend: false }
let friendSuggestion: number | null = null

const alive = (gen: number) => gen === generation

const toActive = (question: Question): ActiveQuestion => ({
  id: question.id,
  text: question.text,
  options: question.options,
  category: question.category,
  level: question.level,
  removed: [],
  fallback: question.fallback,
  correctIndex: question.correctIndex,
  explanation: question.explanation,
})

const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine

/** A whole Classic game by level, plus one spare per level for Switch Question. */
const classicCounts = (difficulty: Parameters<typeof classicLevel>[1], withSpares: boolean) => {
  const counts: Partial<Record<Level, number>> = {}
  for (let stage = 1; stage <= STAGES_COUNT; stage++) {
    const level = classicLevel(stage, difficulty)
    counts[level] = (counts[level] ?? 0) + 1
  }
  if (withSpares) for (const level of Object.keys(counts).map(Number) as Level[]) counts[level]! += 1
  return counts
}

export const useGameSessionStoreBase = create<GameSessionState & GameSessionActions>()(
  immer(
    combine(initialState, (set, get): GameSessionActions => {
      const pace = () => PACE[get().mode]

      /** Puts a question on the board and starts its clock and music. */
      const present = (question: ActiveQuestion, deadline: number | null) => {
        set((state) => {
          state.question = question
          state.phase = 'asking'
          state.selectedIndex = null
          state.revealedCorrectIndex = null
          state.lastAnswerCorrect = null
          state.overlay = null
          state.questionDeadline = deadline
          state.isPending = false
        })
        shownAt = Date.now()
        friendSuggestion = null
        audioManager.playMusic(musicForLevel(question.level))
      }

      const applyRun = (run: RunView) => {
        const offset = Date.now() - Date.parse(run.serverNow)
        set((state) => {
          state.runId = run.id
          state.correctCount = run.correctCount
          state.stage = run.correctCount + 1
          state.lifelinesUsed = run.lifelinesUsed
          state.lifelinesAllowed = run.lifelinesAllowed
          state.runEndsAt = run.endsAt ? Date.parse(run.endsAt) + offset : null
        })
        if (run.question) {
          present(
            { ...run.question, fallback: false, correctIndex: null, explanation: null },
            run.deadline ? Date.parse(run.deadline) + offset : null
          )
        }
      }

      const nextLocalQuestion = async (gen: number) => {
        const { mode, stage, correctCount, settings } = get()
        if (!queue || !settings) return
        const level =
          mode === 'classic' ? classicLevel(stage, settings.difficulty) : practiceLevel(mode, correctCount, settings.difficulty)

        if (!queue.size(level)) {
          set((state) => {
            state.phase = 'loading'
          })
        }
        const question = await queue.take(level)
        if (!alive(gen)) return
        if (!question) {
          set((state) => {
            state.phase = 'idle'
            state.error = new Error('No questions available')
          })
          return
        }

        if (mode !== 'classic') {
          queue.prefetch(level)
          queue.prefetch(practiceLevel(mode, correctCount + 3, settings.difficulty))
        }
        set((state) => {
          state.source = queue?.source ?? state.source
        })

        const seconds =
          mode === 'classic' ? classicSeconds(stage, settings.timer) : mode === 'marathon' ? marathonSeconds(settings.timer) : null
        present(toActive(question), seconds ? Date.now() + seconds * 1000 : null)
      }

      const finish = async (gen: number, outcome: GameOutcome, extra: { serverBadges?: BadgeId[] } = {}) => {
        const state = get()
        audioManager.stopAll()
        if (outcome === 'won') void audioManager.playSting('millionaire')

        const answered = state.correctCount
        const winnings =
          state.mode !== 'classic'
            ? 0
            : outcome === 'won'
              ? prizeForStage(STAGES_COUNT)
              : outcome === 'walked'
                ? walkAwayAmount(answered)
                : guaranteedAmount(answered)

        const offline = state.offline || isOffline()
        const newBadges = [
          ...recordGame({
            mode: state.mode,
            locale: state.locale,
            correctCount: answered,
            outcome,
            lifelinesUsed: state.lifelinesUsed,
            quickAnswers: tally.quickAnswers,
            categoryCorrect: tally.categoryCorrect,
            offline,
            savedByFriend: tally.savedByFriend,
          }),
          ...mergeLocalBadges(extra.serverBadges ?? []),
        ]

        const bestKey = state.mode === 'classic' ? 'classic' : `${state.mode}:${state.ranked ? 'ranked' : 'practice'}`
        const value = state.mode === 'classic' ? winnings : answered
        const isPersonalBest = value > 0 && value > readBest(bestKey)
        if (isPersonalBest) writeBest(bestKey, value)

        const end: GameEnd = { outcome, winnings, score: answered, newBadges, isPersonalBest, rank: null }
        set((draft) => {
          draft.phase = 'ended'
          draft.end = end
          draft.questionDeadline = null
          draft.overlay = null
          draft.busyLifeline = null
        })

        trackEvent('game_end', { mode: state.mode, ranked: state.ranked, outcome, score: answered, winnings, locale: state.locale })

        // Persistence and sync happen after the result is on screen; none of it may block it.
        if (state.mode === 'classic') {
          await enqueueClassicResult({
            clientId: uuid(),
            locale: state.locale,
            reachedStage: answered,
            winnings,
            outcome: outcome === 'ended' ? 'lost' : outcome,
            lifelinesUsed: state.lifelinesUsed,
            playedAt: new Date().toISOString(),
            settings: state.settings ?? undefined,
          })
        }
        // After the first game in a language, keep a pack of it for offline play (Settings can turn this off).
        if (useSettingsStoreBase.getState().autoDownloadPack && !offline) {
          void getPack(state.locale).then((pack) => {
            if (!pack) void usePacksStoreBase.getState().download(state.locale)
          })
        }
        if (useAuthStoreBase.getState().user) {
          void flushOutbox()
          syncBadgesAPI({ badgeIds: readLocalBadges().map(({ badgeId }) => badgeId) }).catch((error: unknown) =>
            reportError(error, 'badges:sync', { silent: true })
          )
        }
        if (state.ranked) {
          try {
            const { viewer } = await getLeaderboardAPI({ mode: state.mode as 'marathon' | 'timeAttack' })
            if (alive(gen) && viewer) {
              set((draft) => {
                if (draft.end) draft.end.rank = viewer.rank
              })
            }
          } catch (error) {
            reportError(error, 'game:rank', { silent: true })
          }
        }
      }

      const countCorrect = (question: ActiveQuestion, answerMs: number, selected: number) => {
        if (answerMs < QUICK_ANSWER_MS) tally.quickAnswers += 1
        tally.categoryCorrect[question.category] = (tally.categoryCorrect[question.category] ?? 0) + 1
        if (friendSuggestion === selected) tally.savedByFriend = true
      }

      const continueAfterRanked = async (gen: number, result: RunAnswerResult) => {
        if (result.run.status === 'finished') {
          await finish(gen, result.timedOut ? 'timeout' : 'ended', { serverBadges: result.badges })
          return
        }
        set((state) => {
          state.phase = 'transition'
          if (!result.correct) state.penaltyCount += 1
        })
        await sleep(pace().transitionMs)
        if (alive(gen)) applyRun(result.run)
      }

      const continueAfterLocal = async (gen: number, correct: boolean) => {
        const { mode } = get()

        if (mode === 'classic') {
          if (!correct) return finish(gen, 'lost')
          if (get().correctCount >= STAGES_COUNT) return finish(gen, 'won')
          set((state) => {
            state.phase = 'transition'
            state.stage += 1
          })
          void audioManager.playSting('next', { maxWaitMs: pace().transitionMs })
          await sleep(pace().transitionMs)
          if (alive(gen)) await nextLocalQuestion(gen)
          return
        }

        if (mode === 'marathon' && !correct) return finish(gen, 'ended')

        if (mode === 'timeAttack' && !correct) {
          set((state) => {
            state.penaltyCount += 1
            if (state.runEndsAt) state.runEndsAt -= TIME_ATTACK_RULES.wrongPenaltySeconds * 1000
          })
        }

        // The Time Attack clock keeps running through the reveal; never present a question after it.
        const endsAt = get().runEndsAt
        if (mode === 'timeAttack' && endsAt && endsAt <= Date.now()) return finish(gen, 'ended')

        set((state) => {
          state.phase = 'transition'
          state.stage += 1
        })
        await sleep(pace().transitionMs)
        if (alive(gen)) await nextLocalQuestion(gen)
      }

      return {
        startGame: async ({ mode, locale, settings, ranked }) => {
          const gen = ++generation
          audioManager.stopAll()
          tally = { quickAnswers: 0, categoryCorrect: {}, savedByFriend: false }
          friendSuggestion = null
          queue = null

          const lifelinesAllowed = mode === 'timeAttack' ? [] : ranked ? [...LIFELINES] : settings.lifelines
          set(() => ({
            ...initialState,
            mode,
            locale,
            settings,
            ranked,
            lifelinesAllowed,
            phase: 'loading' as const,
            isPending: true,
            offline: isOffline(),
          }))
          trackEvent('game_start', { mode, ranked, locale })
          const startSting = audioManager.playSting('start', { maxWaitMs: 4000 })

          try {
            if (ranked) {
              const run = await startRunAPI({ mode: mode as 'marathon' | 'timeAttack', locale })
              await startSting
              if (alive(gen)) applyRun(run)
              return
            }

            queue = new QuestionQueue({ locale, categories: settings.categories })
            if (mode === 'classic') {
              await queue.fill(classicCounts(settings.difficulty, settings.lifelines.includes('switchQuestion')))
            } else {
              await queue.fill({ [practiceLevel(mode, 0, settings.difficulty)]: 10 })
            }
            await startSting
            if (!alive(gen)) return

            set((state) => {
              state.source = queue?.source ?? 'online'
              state.offline = state.offline || queue?.source !== 'online'
              if (mode === 'timeAttack') state.runEndsAt = Date.now() + TIME_ATTACK_RULES.durationSeconds * 1000
            })
            await nextLocalQuestion(gen)
          } catch (error) {
            if (!alive(gen)) return
            audioManager.stopAll()
            set((state) => {
              state.phase = 'idle'
              state.isPending = false
              state.error = error
            })
          }
        },

        selectOption: (index) => {
          const { phase, question, mode } = get()
          if (!question || question.removed.includes(index)) return
          if (phase !== 'asking' && phase !== 'selected') return

          set((state) => {
            state.selectedIndex = index
            state.phase = mode === 'classic' ? 'selected' : state.phase
          })
          // `combine` types `get()` as state only; the store itself carries the actions.
          if (mode !== 'classic') void useGameSessionStoreBase.getState().confirmAnswer()
        },

        cancelSelection: () => {
          if (get().phase !== 'selected') return
          set((state) => {
            state.selectedIndex = null
            state.phase = 'asking'
          })
        },

        confirmAnswer: async () => {
          const gen = generation
          const { question, selectedIndex, ranked, runId, stage, mode } = get()
          if (!question || selectedIndex === null) return
          if (get().phase !== 'selected' && get().phase !== 'asking') return

          const answerMs = Date.now() - shownAt
          // The deadline stays: the countdown is paused outside asking/selected, so the ring
          // freezes at the moment of the final answer instead of jumping to "no limit".
          set((state) => {
            state.phase = 'locked'
            state.overlay = null
          })
          audioManager.stopMusic()
          if (mode !== 'timeAttack') void audioManager.playSting('finalAnswer', { maxWaitMs: 30_000 })

          let correct: boolean
          let correctIndex: number
          let rankedResult: RunAnswerResult | null = null
          try {
            if (ranked && runId) {
              ;[rankedResult] = await Promise.all([
                answerRunAPI({ id: runId, questionId: question.id, index: selectedIndex }),
                sleep(pace().suspenseMs(stage)),
              ])
              correct = rankedResult.correct
              correctIndex = rankedResult.correctIndex
            } else {
              await sleep(pace().suspenseMs(stage))
              correct = selectedIndex === question.correctIndex
              correctIndex = question.correctIndex ?? selectedIndex
            }
          } catch (error) {
            if (!alive(gen)) return
            // The answer never reached the referee: let the player try again rather than lose the run.
            audioManager.stopStings()
            set((state) => {
              state.phase = mode === 'classic' ? 'selected' : 'asking'
              state.error = error
            })
            return
          }
          if (!alive(gen)) return

          audioManager.stopStings()
          set((state) => {
            state.phase = 'revealed'
            state.revealedCorrectIndex = correctIndex
            state.lastAnswerCorrect = correct
            state.correctCount += correct ? 1 : 0
            if (state.question) {
              state.question.correctIndex = correctIndex
              state.question.explanation = rankedResult?.explanation ?? state.question.explanation
            }
          })
          if (correct) countCorrect(question, answerMs, selectedIndex)

          const sting = audioManager.playSting(correct ? 'correct' : 'wrong', { maxWaitMs: pace().revealMs })
          await Promise.all([sting, sleep(pace().revealMs)])
          if (!alive(gen)) return

          if (rankedResult) await continueAfterRanked(gen, rankedResult)
          else await continueAfterLocal(gen, correct)
        },

        useLifeline: async (lifeline) => {
          const gen = generation
          const { phase, question, lifelinesUsed, lifelinesAllowed, busyLifeline, ranked, runId, locale } = get()
          if (!question || busyLifeline) return
          if (phase !== 'asking' && phase !== 'selected') return
          if (!lifelinesAllowed.includes(lifeline) || lifelinesUsed.includes(lifeline)) return

          set((state) => {
            state.busyLifeline = lifeline
            state.lifelinesUsed.push(lifeline)
            state.phase = 'asking'
            state.selectedIndex = null
            const extra = LIFELINE_EXTRA_MS[lifeline]
            if (extra && state.questionDeadline) state.questionDeadline += extra
          })
          trackEvent('lifeline_used', { lifeline, mode: get().mode })

          const finishLifeline = () =>
            set((state) => {
              state.busyLifeline = null
            })

          try {
            const rankedCall = ranked && runId ? runLifelineAPI({ id: runId, lifeline }) : null

            if (lifeline === 'fiftyFifty') {
              const [result] = await Promise.all([rankedCall, audioManager.playSting('fiftyFifty', { maxWaitMs: 1200 })])
              if (!alive(gen)) return
              const removed = result?.removed ?? fiftyFifty(question.correctIndex ?? 0, question.removed)
              set((state) => {
                if (state.question) state.question.removed = [...state.question.removed, ...removed]
              })
            }

            if (lifeline === 'askAudience') {
              const [result] = await Promise.all([rankedCall, audioManager.playSting('askAudience', { maxWaitMs: 5500 })])
              if (!alive(gen)) return
              const votes = result?.votes ?? audienceVotes(question.correctIndex ?? 0, question.removed, question.level)
              set((state) => {
                state.overlay = { type: 'askAudience', votes }
              })
            }

            if (lifeline === 'phoneAFriend') {
              set((state) => {
                state.overlay = { type: 'phoneAFriend', status: 'calling' }
              })
              const call = rankedCall
                ? rankedCall.then((result) => result.friend!)
                : phoneAFriendAPI({
                    locale,
                    question: question.text,
                    options: question.options,
                    correctIndex: question.correctIndex ?? 0,
                    removed: question.removed,
                    level: question.level,
                  }).catch((error: unknown) => {
                    // Offline or the API is down: the friend still answers, in template words.
                    reportError(error, 'lifeline:phone', { silent: true })
                    const pick = friendPick(question.correctIndex ?? 0, question.removed, question.level)
                    return { friendName: null, message: null, suggestedIndex: pick.index, confidence: pick.confidence }
                  })
              const [answer] = await Promise.all([call, audioManager.playSting('phoneAFriend', { maxWaitMs: 9500 })])
              if (!alive(gen)) return
              friendSuggestion = answer.suggestedIndex
              set((state) => {
                state.overlay = { type: 'phoneAFriend', status: 'answered', answer }
              })
            }

            if (lifeline === 'switchQuestion') {
              const [result] = await Promise.all([rankedCall, audioManager.playSting('fiftyFifty', { maxWaitMs: 1200 })])
              if (!alive(gen)) return
              if (result) {
                applyRun(result.run)
              } else if (queue) {
                const replacement = await queue.take(question.level)
                if (!alive(gen)) return
                if (replacement) present(toActive(replacement), get().questionDeadline)
              }
            }
          } catch (error) {
            if (!alive(gen)) return
            set((state) => {
              state.error = error
              state.overlay = null
            })
          } finally {
            if (alive(gen)) finishLifeline()
          }
        },

        closeOverlay: () => {
          set((state) => {
            state.overlay = null
          })
        },

        walkAway: async () => {
          const { mode, phase } = get()
          if (mode !== 'classic' || (phase !== 'asking' && phase !== 'selected')) return
          await finish(generation, 'walked')
        },

        timeUp: async () => {
          const gen = generation
          const { phase, ranked, runId, mode, question } = get()
          if (phase !== 'asking' && phase !== 'selected') return

          set((state) => {
            state.phase = 'locked'
            state.questionDeadline = null
            state.overlay = null
          })
          audioManager.stopMusic()

          try {
            if (ranked && runId && mode === 'marathon' && question) {
              const result = await answerRunAPI({ id: runId, questionId: question.id, index: null })
              if (!alive(gen)) return
              set((state) => {
                state.phase = 'revealed'
                state.revealedCorrectIndex = result.correctIndex
              })
              await audioManager.playSting('wrong', { maxWaitMs: 2000 })
              if (alive(gen)) await finish(gen, 'timeout', { serverBadges: result.badges })
              return
            }

            if (ranked && runId) {
              await getRunAPI({ id: runId })
              if (alive(gen)) await finish(gen, 'ended')
              return
            }
          } catch (error) {
            reportError(error, 'game:timeUp', { silent: true })
            if (alive(gen)) await finish(gen, 'ended')
            return
          }

          if (mode === 'timeAttack') return finish(gen, 'ended')

          set((state) => {
            state.phase = 'revealed'
            state.revealedCorrectIndex = question?.correctIndex ?? null
          })
          await audioManager.playSting('wrong', { maxWaitMs: 2000 })
          if (alive(gen)) await finish(gen, 'timeout')
        },

        quitGame: () => {
          generation += 1
          queue = null
          audioManager.stopAll()
          set(() => ({ ...initialState }))
        },
      }
    })
  )
)

export const useGameSessionStore = appendSelectors(useGameSessionStoreBase)
