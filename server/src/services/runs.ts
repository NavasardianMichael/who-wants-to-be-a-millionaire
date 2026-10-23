import type { Run } from '@prisma/client'
import { awardBadges, runBadges } from './badges.js'
import { callFriend, type FriendAnswer } from './phoneAFriend.js'
import { shuffledOrder } from './questionGen.js'
import { getQuestionById, getRunQuestion, type PoolQuestion } from './questionPool.js'
import {
  allowedLifelines,
  applyAnswer,
  initialEndsAt,
  isInTime,
  isStale,
  levelFor,
  LIFELINE_EXTRA_MS,
  questionDeadline,
} from './runRules.js'
import { type BadgeId, isLifeline, type Level, type Lifeline, type RankedMode } from '../lib/game.js'
import { audienceVotes, fiftyFifty } from '../lib/lifelines.js'
import type { Locale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/error.js'

/**
 * Ranked runs. The row is the source of truth: the client gets the current question's text
 * and options **in a display order only this row knows**, never the answer, and every
 * answer and lifeline is checked against the row's clock.
 */

export type RunQuestionView = {
  id: string
  text: string
  options: string[]
  category: string
  level: Level
  removed: number[]
}

export type RunView = {
  id: string
  mode: RankedMode
  locale: string
  status: 'active' | 'finished'
  score: number
  correctCount: number
  level: Level
  lifelinesUsed: Lifeline[]
  lifelinesAllowed: Lifeline[]
  question: RunQuestionView | null
  deadline: string | null
  endsAt: string | null
  /** The server clock, so the client can correct its countdown for clock skew. */
  serverNow: string
}

const toView = (run: Run, question: PoolQuestion | null): RunView => ({
  id: run.id,
  mode: run.mode as RankedMode,
  locale: run.locale,
  status: run.status,
  score: run.score,
  correctCount: run.correctCount,
  level: levelFor(run.mode as RankedMode, run.correctCount),
  lifelinesUsed: run.lifelinesUsed.filter(isLifeline),
  lifelinesAllowed: [...allowedLifelines(run.mode as RankedMode)],
  question:
    question && run.status === 'active'
      ? {
          id: question.id,
          text: question.text,
          options: run.currentOrder.map((storedIndex) => question.options[storedIndex]!),
          category: question.category,
          level: question.level as Level,
          removed: run.removedIndexes,
        }
      : null,
  deadline: run.currentDeadline?.toISOString() ?? null,
  endsAt: run.endsAt?.toISOString() ?? null,
  serverNow: new Date().toISOString(),
})

/** A fresh display order per serve, so a shared screenshot does not give the layout away. */
const displayOrder = (question: PoolQuestion): number[] => shuffledOrder(question.options.length)

const clockOf = (run: Run) => ({ mode: run.mode as RankedMode, endsAt: run.endsAt, currentDeadline: run.currentDeadline })

const loadOwnRun = async (runId: string, userId: string): Promise<Run> => {
  const run = await prisma.run.findUnique({ where: { id: runId } })
  // 404 for someone else's run too — no need to confirm it exists.
  if (!run || run.userId !== userId) throw new HttpError(404, 'Run not found', 404)
  return run
}

const finishRun = async (run: Run, data: Partial<Run> = {}): Promise<{ run: Run; badges: BadgeId[] }> => {
  const finished = await prisma.run.update({
    where: { id: run.id },
    data: { ...data, status: 'finished', finishedAt: new Date(), currentQuestionId: null, currentDeadline: null },
  })
  const badges = await awardBadges(finished.userId, runBadges(finished.mode as RankedMode, finished.correctCount))
  return { run: finished, badges }
}

/** Finishes runs whose clock ran out while nobody was answering (tab closed, connection lost). */
export const sweepStaleRuns = async (): Promise<number> => {
  const now = new Date()
  const active = await prisma.run.findMany({ where: { status: 'active' }, take: 500 })
  const stale = active.filter((run) => isStale(clockOf(run), now))
  for (const run of stale) await finishRun(run)
  return stale.length
}

export const startRun = async (userId: string, mode: RankedMode, locale: Locale): Promise<RunView> => {
  // One live run per mode: starting again forfeits the old one at its current score.
  const live = await prisma.run.findMany({ where: { userId, mode, status: 'active' } })
  for (const run of live) await finishRun(run)

  const question = await getRunQuestion(locale, 1, [])
  const now = new Date()
  const run = await prisma.run.create({
    data: {
      userId,
      mode,
      locale,
      endsAt: initialEndsAt(mode, now),
      currentDeadline: questionDeadline(mode, now),
      currentQuestionId: question.id,
      currentOrder: displayOrder(question),
      questionShownAt: now,
      servedQuestionIds: [question.id],
    },
  })
  return toView(run, question)
}

export const getRun = async (runId: string, userId: string): Promise<RunView> => {
  let run = await loadOwnRun(runId, userId)
  if (run.status === 'active' && isStale(clockOf(run), new Date())) run = (await finishRun(run)).run
  const question = run.currentQuestionId ? await getQuestionById(run.currentQuestionId) : null
  return toView(run, question)
}

export type AnswerResult = {
  correct: boolean
  /** Shown index of the correct option; null on a timeout reported without an answer. */
  correctIndex: number
  explanation: string | null
  timedOut: boolean
  run: RunView
  badges: BadgeId[]
}

/** `index` is the shown index, or null when the client reports its own timeout. */
export const answerRun = async (
  runId: string,
  userId: string,
  questionId: string,
  index: number | null
): Promise<AnswerResult> => {
  const run = await loadOwnRun(runId, userId)
  if (run.status !== 'active') throw new HttpError(409, 'Run is already finished', 409)
  if (run.currentQuestionId !== questionId) throw new HttpError(409, 'Not the current question', 409)

  const question = await getQuestionById(questionId)
  if (!question) throw new HttpError(409, 'Question no longer available', 409)

  const now = new Date()
  const correctShown = run.currentOrder.indexOf(question.correctIndex)
  const timedOut = index === null || !isInTime(clockOf(run), now)

  if (timedOut) {
    const { run: finished, badges } = await finishRun(run)
    return { correct: false, correctIndex: correctShown, explanation: question.explanation, timedOut, run: toView(finished, null), badges }
  }

  const correct = index === correctShown && !run.removedIndexes.includes(index)
  const answerMs = run.questionShownAt ? now.getTime() - run.questionShownAt.getTime() : 0
  const outcome = applyAnswer(clockOf(run), correct, now)
  const correctCount = run.correctCount + (correct ? 1 : 0)
  const progress = {
    correctCount,
    score: correctCount,
    totalAnswerMs: run.totalAnswerMs + (correct ? answerMs : 0),
    endsAt: outcome.endsAt ?? run.endsAt,
  }

  if (outcome.finished) {
    const { run: finished, badges } = await finishRun(run, progress)
    return { correct, correctIndex: correctShown, explanation: question.explanation, timedOut: false, run: toView(finished, null), badges }
  }

  const mode = run.mode as RankedMode
  const next = await getRunQuestion(run.locale as Locale, levelFor(mode, correctCount), run.servedQuestionIds)
  const updated = await prisma.run.update({
    where: { id: run.id },
    data: {
      ...progress,
      currentQuestionId: next.id,
      currentOrder: displayOrder(next),
      removedIndexes: [],
      questionShownAt: now,
      currentDeadline: questionDeadline(mode, now),
      servedQuestionIds: { push: next.id },
    },
  })
  return { correct, correctIndex: correctShown, explanation: question.explanation, timedOut: false, run: toView(updated, next), badges: [] }
}

export type LifelineResult = {
  lifeline: Lifeline
  removed?: number[]
  votes?: number[]
  friend?: FriendAnswer
  run: RunView
}

export const useRunLifeline = async (runId: string, userId: string, lifeline: Lifeline): Promise<LifelineResult> => {
  const run = await loadOwnRun(runId, userId)
  const mode = run.mode as RankedMode
  if (run.status !== 'active' || !run.currentQuestionId) throw new HttpError(409, 'Run is already finished', 409)
  if (!allowedLifelines(mode).includes(lifeline)) throw new HttpError(400, 'Lifeline not allowed in this mode', 400)
  if (run.lifelinesUsed.includes(lifeline)) throw new HttpError(409, 'Lifeline already used', 409)

  const now = new Date()
  if (!isInTime(clockOf(run), now)) throw new HttpError(409, 'Time is up', 409)

  const question = await getQuestionById(run.currentQuestionId)
  if (!question) throw new HttpError(409, 'Question no longer available', 409)

  const level = question.level as Level
  const correctShown = run.currentOrder.indexOf(question.correctIndex)
  const shownOptions = run.currentOrder.map((storedIndex) => question.options[storedIndex]!)
  const lifelinesUsed = [...run.lifelinesUsed, lifeline]
  const extraMs = LIFELINE_EXTRA_MS[lifeline] ?? 0
  const deadline = run.currentDeadline ? new Date(run.currentDeadline.getTime() + extraMs) : null

  if (lifeline === 'switchQuestion') {
    const next = await getRunQuestion(run.locale as Locale, level, run.servedQuestionIds)
    const updated = await prisma.run.update({
      where: { id: run.id },
      data: {
        lifelinesUsed,
        currentQuestionId: next.id,
        currentOrder: displayOrder(next),
        removedIndexes: [],
        questionShownAt: now,
        currentDeadline: questionDeadline(mode, now),
        servedQuestionIds: { push: next.id },
      },
    })
    return { lifeline, run: toView(updated, next) }
  }

  if (lifeline === 'fiftyFifty') {
    const removed = fiftyFifty(correctShown, run.removedIndexes)
    const updated = await prisma.run.update({
      where: { id: run.id },
      data: { lifelinesUsed, removedIndexes: [...run.removedIndexes, ...removed] },
    })
    return { lifeline, removed, run: toView(updated, question) }
  }

  if (lifeline === 'askAudience') {
    const votes = audienceVotes(correctShown, run.removedIndexes, level)
    const updated = await prisma.run.update({ where: { id: run.id }, data: { lifelinesUsed, currentDeadline: deadline } })
    return { lifeline, votes, run: toView(updated, question) }
  }

  const friend = await callFriend({
    locale: run.locale as Locale,
    question: question.text,
    options: shownOptions,
    correctIndex: correctShown,
    removed: run.removedIndexes,
    level,
  })
  const updated = await prisma.run.update({ where: { id: run.id }, data: { lifelinesUsed, currentDeadline: deadline } })
  return { lifeline, friend, run: toView(updated, question) }
}
