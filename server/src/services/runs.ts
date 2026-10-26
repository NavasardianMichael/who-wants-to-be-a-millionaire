import { Prisma, type Run } from '@prisma/client'
import { awardBadges, runBadges } from './badges.js'
import { callFriend, type FriendAnswer } from './phoneAFriend.js'
import { shuffledOrder } from './questionGen.js'
import { getQuestionById, getRunQuestion, type PoolQuestion, type RunQuestion } from './questionPool.js'
import {
  allowedLifelines,
  applyAnswer,
  initialEndsAt,
  isInTime,
  isStale,
  levelFor,
  LIFELINE_EXTRA_MS,
  questionDeadline,
  SWITCH_PREVIEW_MS,
} from './runRules.js'
import { type BadgeId, isLifeline, type Level, type Lifeline, type RankedMode } from '../lib/game.js'
import type { RunOwner } from '../lib/guest.js'
import { audienceVotes, fiftyFifty } from '../lib/lifelines.js'
import type { Locale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/error.js'

/**
 * Ranked runs. The row is the source of truth: the client gets the current question's text
 * and options **in a display order only this row knows**, never the answer, and every
 * answer and lifeline is checked against the row's clock. Every write goes through
 * `writeRun`, so two requests racing on one question cannot both pass those checks.
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

const ownedBy = (owner: RunOwner) => (owner.userId ? { userId: owner.userId } : { guestId: owner.guestId })

/** How many of the player's most recent ranked questions a new draw steers clear of. */
const PLAYER_HISTORY_LIMIT = 500

/** Questions the player met in recent runs of either mode, newest first. */
const playerSeenIds = async (owner: RunOwner): Promise<string[]> => {
  const runs = await prisma.run.findMany({
    where: ownedBy(owner),
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: { servedQuestionIds: true },
  })
  return runs.flatMap(({ servedQuestionIds }) => [...servedQuestionIds].reverse()).slice(0, PLAYER_HISTORY_LIMIT)
}

const isConflict = (error: unknown): boolean => error instanceof HttpError && error.status === 409

/**
 * Writes the run only if nobody has written it since it was read. Without this, requests
 * fired together would all pass the checks above their write: a lifeline used twice (two
 * 50:50s rule out all three wrong options), or four answers at once. The loser gets a 409.
 */
const writeRun = async (run: Run, data: Prisma.RunUpdateInput): Promise<Run> => {
  try {
    return await prisma.run.update({ where: { id: run.id, version: run.version }, data: { ...data, version: { increment: 1 } } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new HttpError(409, 'The run changed meanwhile', 409)
    }
    throw error
  }
}

/** The run's flag once a question came from the public pool: set, never cleared. */
const publicFlag = ({ isPublic }: RunQuestion) => (isPublic ? { usedPublicQuestions: true } : {})

const loadOwnRun = async (runId: string, owner: RunOwner): Promise<Run> => {
  const run = await prisma.run.findUnique({ where: { id: runId } })
  const mine = run && (owner.userId ? run.userId === owner.userId : run.guestId === owner.guestId)
  // 404 for someone else's run too — no need to confirm it exists.
  if (!run || !mine) throw new HttpError(404, 'Run not found', 404)
  return run
}

const finishRun = async (run: Run, data: Prisma.RunUpdateInput = {}): Promise<{ run: Run; badges: BadgeId[] }> => {
  const finished = await writeRun(run, {
    ...data,
    status: 'finished',
    finishedAt: new Date(),
    currentQuestionId: null,
    currentDeadline: null,
  })
  // Badges live on accounts; a guest's run earns none on the server.
  const badges = finished.userId ? await awardBadges(finished.userId, runBadges(finished.mode as RankedMode, finished.correctCount)) : []
  return { run: finished, badges }
}

/** Finishes a run on the server's own initiative; false when a player's request got in first. */
const finishUnlessRaced = async (run: Run): Promise<boolean> => {
  try {
    await finishRun(run)
    return true
  } catch (error) {
    if (!isConflict(error)) throw error
    return false
  }
}

/** Finishes runs whose clock ran out while nobody was answering (tab closed, connection lost). */
export const sweepStaleRuns = async (): Promise<number> => {
  const now = new Date()
  const active = await prisma.run.findMany({ where: { status: 'active' }, take: 500 })
  const stale = active.filter((run) => isStale(clockOf(run), now))
  let finished = 0
  // A raced run is looked at again on the next sweep.
  for (const run of stale) if (await finishUnlessRaced(run)) finished += 1
  return finished
}

export const startRun = async (owner: RunOwner, mode: RankedMode, locale: Locale): Promise<RunView> => {
  // One live run per mode: starting again forfeits the old one at its current score.
  const live = await prisma.run.findMany({ where: { ...ownedBy(owner), mode, status: 'active' } })
  for (const run of live) await finishUnlessRaced(run)

  const first = await getRunQuestion(locale, 1, [], await playerSeenIds(owner))
  const { question } = first
  const now = new Date()
  const run = await prisma.run.create({
    data: {
      ...ownedBy(owner),
      ...publicFlag(first),
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

export const getRun = async (runId: string, owner: RunOwner): Promise<RunView> => {
  let run = await loadOwnRun(runId, owner)
  if (run.status === 'active' && isStale(clockOf(run), new Date())) {
    try {
      run = (await finishRun(run)).run
    } catch (error) {
      if (!isConflict(error)) throw error
      run = await loadOwnRun(runId, owner)
    }
  }
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
  owner: RunOwner,
  questionId: string,
  index: number | null
): Promise<AnswerResult> => {
  const run = await loadOwnRun(runId, owner)
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
  const drawn = await getRunQuestion(run.locale as Locale, levelFor(mode, correctCount), run.servedQuestionIds, await playerSeenIds(owner))
  const next = drawn.question
  const updated = await writeRun(run, {
    ...progress,
    ...publicFlag(drawn),
    currentQuestionId: next.id,
    currentOrder: displayOrder(next),
    removedIndexes: [],
    questionShownAt: now,
    currentDeadline: questionDeadline(mode, now),
    servedQuestionIds: { push: next.id },
  })
  return { correct, correctIndex: correctShown, explanation: question.explanation, timedOut: false, run: toView(updated, next), badges: [] }
}

export type LifelineResult = {
  lifeline: Lifeline
  removed?: number[]
  votes?: number[]
  friend?: FriendAnswer
  /** Switch the Question: the discarded question's answer, safe to reveal once it is retired from the run. */
  switched?: { correctIndex: number; explanation: string | null }
  run: RunView
}

export const useRunLifeline = async (runId: string, owner: RunOwner, lifeline: Lifeline): Promise<LifelineResult> => {
  const run = await loadOwnRun(runId, owner)
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
    const drawn = await getRunQuestion(run.locale as Locale, level, run.servedQuestionIds, await playerSeenIds(owner))
    const next = drawn.question
    const nextDeadline = questionDeadline(mode, now)
    const updated = await writeRun(run, {
      ...publicFlag(drawn),
      lifelinesUsed,
      currentQuestionId: next.id,
      currentOrder: displayOrder(next),
      removedIndexes: [],
      // Answer time counts from now, preview included, so the tie-break cannot be gamed through it.
      questionShownAt: now,
      currentDeadline: nextDeadline && new Date(nextDeadline.getTime() + SWITCH_PREVIEW_MS),
      servedQuestionIds: { push: next.id },
    })
    return {
      lifeline,
      switched: { correctIndex: correctShown, explanation: question.explanation },
      run: toView(updated, next),
    }
  }

  if (lifeline === 'fiftyFifty') {
    const removed = fiftyFifty(correctShown, run.removedIndexes)
    const updated = await writeRun(run, { lifelinesUsed, removedIndexes: [...run.removedIndexes, ...removed] })
    return { lifeline, removed, run: toView(updated, question) }
  }

  if (lifeline === 'askAudience') {
    const votes = audienceVotes(correctShown, run.removedIndexes, level)
    const updated = await writeRun(run, { lifelinesUsed, currentDeadline: deadline })
    return { lifeline, votes, run: toView(updated, question) }
  }

  // Claimed before the call, so a racing duplicate is refused without spending Gemini quota.
  const updated = await writeRun(run, { lifelinesUsed, currentDeadline: deadline })
  const friend = await callFriend({
    locale: run.locale as Locale,
    question: question.text,
    options: shownOptions,
    correctIndex: correctShown,
    removed: run.removedIndexes,
    level,
  })
  return { lifeline, friend, run: toView(updated, question) }
}
