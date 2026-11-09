import { Prisma } from '@prisma/client'
import { generateQuestions } from './questionGen.js'
import { isAiConfigured } from '../lib/ai/index.js'
import { CATEGORIES, type Category, type Level } from '../lib/game.js'
import { liveGenerationAllowed } from '../lib/generationBudget.js'
import { DEFAULT_LOCALE, type Locale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'

/**
 * Serving questions: **pool first, the AI second, the seeded English bank last.**
 *
 * Every question the AI writes is kept, so the free quota is spent once per question rather
 * than once per player. A request the pool can satisfy costs no API call at all; a short
 * bucket is generated on the spot and the surplus stays for the next player; and when the
 * model chain is exhausted the game still starts, on the curated English bank.
 *
 * The pool is split in two. The public side is served **with answers** (Classic batches,
 * offline packs, category samples), so anyone can download it. Ranked runs draw from the
 * **ranked reserve** instead (`Question.ranked`), which no answer-carrying endpoint returns.
 */

export type PoolQuestion = {
  id: string
  locale: string
  category: string
  level: number
  scope: 'global' | 'local'
  text: string
  options: string[]
  correctIndex: number
  /** Served from the English fallback bank because the locale's pool and the AI both came up short. */
  fallback: boolean
}

type QuestionRow = Omit<PoolQuestion, 'fallback'>

const SELECT_COLUMNS = Prisma.sql`id, locale, category, level, scope::text AS scope, text, options, "correctIndex"`

/** Generated per call; the surplus beyond what the request needs stays in the pool. */
export const GENERATION_BATCH = 8

/**
 * How long a waiting player waits for a fresh batch — under the web app's 60 s
 * `API_QUESTIONS_TIMEOUT_MS`, or the game fails instead of falling back. Past it the player
 * gets the fallback, and the batch carries on into the pool for the next game.
 */
const LIVE_GENERATION_WAIT_MS = 40_000

const waitForGeneration = async (task: Promise<number>): Promise<number> => {
  let timer: NodeJS.Timeout | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no batch within ${LIVE_GENERATION_WAIT_MS / 1000} s, still generating`)), LIVE_GENERATION_WAIT_MS)
  })
  try {
    return await Promise.race([task, deadline])
  } finally {
    clearTimeout(timer)
  }
}

/** Reports after which an AI question is retired from play and deleted. */
const RETIRE_AFTER_REPORTS = 3

type DrawParams = {
  locale: string
  level: number
  ranked: boolean
  categories: readonly string[]
  excludeIds: readonly string[]
  count: number
  origin?: 'seed'
}

/** Least-served first, random among equals — fresh questions rotate in before repeats. */
const drawFromPool = async ({ locale, level, ranked, categories, excludeIds, count, origin }: DrawParams): Promise<QuestionRow[]> => {
  if (count <= 0) return []
  const categoryFilter = categories.length ? Prisma.sql`AND category = ANY(${categories as string[]}::text[])` : Prisma.empty
  const excludeFilter = excludeIds.length ? Prisma.sql`AND id <> ALL(${excludeIds as string[]}::text[])` : Prisma.empty
  const originFilter = origin ? Prisma.sql`AND origin = 'seed'` : Prisma.empty

  return prisma.$queryRaw<QuestionRow[]>`
    SELECT ${SELECT_COLUMNS}
    FROM "Question"
    WHERE locale = ${locale} AND level = ${level} AND ranked = ${ranked} AND "retiredAt" IS NULL
      ${categoryFilter} ${excludeFilter} ${originFilter}
    ORDER BY "servedCount" ASC, random()
    LIMIT ${count}
  `
}

/** Local culture is what makes a pack feel native, so it is drawn twice as often. */
export const pickCategory = (categories: readonly Category[], random: () => number = Math.random): Category => {
  const pool = categories.length ? categories : CATEGORIES
  const weighted = pool.flatMap((category) => (category === 'localCulture' ? [category, category] : [category]))
  return weighted[Math.floor(random() * weighted.length)]!
}

/**
 * Concurrent requests for the same short bucket share one AI call instead of each paying
 * for its own. Keyed without the category: a waiter takes the batch already being written
 * whenever its category is one the waiter accepts.
 */
const inFlight = new Map<string, { category: Category; task: Promise<number> }>()

/**
 * Generates one batch, in one of `categories` (any when empty), into the pool or into the
 * ranked reserve. Returns how many new questions were stored.
 *
 * `player` is who a live request is for, and is charged against the generation budget; the
 * refill job passes none. Joining a batch already being written costs nothing.
 */
export const generateIntoPool = (
  locale: Locale,
  level: Level,
  categories: readonly Category[],
  ranked = false,
  player: string | null = null
): Promise<number> => {
  const key = `${locale}:${level}:${ranked}`
  const existing = inFlight.get(key)
  if (existing && (!categories.length || categories.includes(existing.category))) return existing.task

  if (player && !liveGenerationAllowed(player)) {
    console.warn(`[pool] live generation budget spent; ${locale}/L${level} is served from what exists`)
    return Promise.resolve(0)
  }

  const category = pickCategory(categories)
  const task = (async () => {
    const recent = await prisma.question.findMany({
      where: { locale, level, category },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { text: true },
    })

    // Two attempts, like hangman's content retries: an all-invalid batch is usually a fluke.
    // A truncated one is not, and a second identical call would be billed for the same failure.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { questions, model, truncated } = await generateQuestions({
        locale,
        category,
        level,
        count: GENERATION_BATCH,
        avoid: recent.map(({ text }) => text),
      })
      if (!questions.length && truncated) break
      if (!questions.length) continue

      const { count } = await prisma.question.createMany({
        data: questions.map((question) => ({
          locale,
          category,
          level,
          scope: question.scope,
          text: question.text,
          options: question.options,
          correctIndex: question.correctIndex,
          origin: 'ai' as const,
          ranked,
          model,
          hash: question.hash,
        })),
        skipDuplicates: true,
      })
      return count
    }
    return 0
  })().finally(() => {
    // A batch in another category may have replaced this one meanwhile.
    if (inFlight.get(key)?.task === task) inFlight.delete(key)
  })

  inFlight.set(key, { category, task })
  return task
}

const recordDemand = async (locale: string, levels: readonly number[], ranked = false): Promise<void> => {
  await Promise.all(
    levels.map((level) =>
      prisma.generationDemand.upsert({
        where: { locale_level_ranked: { locale, level, ranked } },
        create: { locale, level, ranked, requests: 1 },
        update: { requests: { increment: 1 }, lastRequestedAt: new Date() },
      })
    )
  )
}

/**
 * How many of a signed-in player's most recently seen Classic questions a batch steers clear
 * of. Larger than a device can send: a regular should run through their language's whole pool
 * before they meet a repeat, and AI is asked only after that.
 */
const CLASSIC_HISTORY_LIMIT = 3000

/**
 * Questions the player was shown in Classic, on any device, newest first. The device's own
 * list covers only that device and dies with its storage.
 */
export const classicSeenIds = async (userId: string): Promise<string[]> => {
  const rows = await prisma.seenQuestion.findMany({
    where: { userId },
    orderBy: { seenAt: 'desc' },
    take: CLASSIC_HISTORY_LIMIT,
    select: { questionId: true },
  })
  return rows.map(({ questionId }) => questionId)
}

/** Remembers, for the account, questions it was shown. Seen again → `seenAt` moves to now. */
export const recordSeenQuestions = async (userId: string, questionIds: readonly string[]): Promise<void> => {
  const ids = [...new Set(questionIds)]
  if (!ids.length) return
  await prisma.$executeRaw`
    INSERT INTO "SeenQuestion" ("userId", "questionId", "seenAt")
    SELECT ${userId}, id, now() FROM unnest(${ids}::text[]) AS id
    ON CONFLICT ("userId", "questionId") DO UPDATE SET "seenAt" = EXCLUDED."seenAt"
  `
}

/**
 * A Classic game reports the questions it actually showed, when it ends or is left. Only
 * these count as served: a batch hands out spares the player may never reach. Ranked
 * questions are skipped — their serves are counted by the run, and inflating them from here
 * would hurry them out of the reserve.
 */
export const markQuestionsShown = async (questionIds: readonly string[], userId: string | null): Promise<void> => {
  const ids = [...new Set(questionIds)]
  if (!ids.length) return
  await prisma.question.updateMany({ where: { id: { in: ids }, ranked: false }, data: { servedCount: { increment: 1 } } })
  if (userId) await recordSeenQuestions(userId, ids)
}

export type BatchRequest = {
  locale: Locale
  /** How many questions each level needs. */
  counts: Partial<Record<Level, number>>
  categories: readonly Category[]
  excludeIds: readonly string[]
  /** Who asked (`user:<id>` or `ip:<address>`), charged for any AI batch the request starts. */
  player: string
}

/**
 * Fills a whole game's worth of questions, level by level, in parallel. Never throws for a
 * AI failure — that is what the fallback bank is for.
 */
export const getQuestionBatch = async ({ locale, counts, categories, excludeIds, player }: BatchRequest): Promise<PoolQuestion[]> => {
  const levels = (Object.keys(counts).map(Number) as Level[]).filter((level) => (counts[level] ?? 0) > 0)
  void recordDemand(locale, levels).catch((error: unknown) => console.error('[pool] demand', error))

  const perLevel = await Promise.all(
    levels.map(async (level): Promise<PoolQuestion[]> => {
      const count = counts[level] ?? 0
      const exclude = [...excludeIds]
      let rows = await drawFromPool({ locale, level, ranked: false, categories, excludeIds: exclude, count })

      if (rows.length < count && isAiConfigured()) {
        try {
          await waitForGeneration(generateIntoPool(locale, level, categories, false, player))
          const more = await drawFromPool({
            locale,
            level,
            ranked: false,
            categories,
            excludeIds: [...exclude, ...rows.map(({ id }) => id)],
            count: count - rows.length,
          })
          rows = rows.concat(more)
        } catch (error) {
          console.warn(`[pool] generation failed for ${locale}/L${level}:`, (error as Error).message)
        }
      }

      const served: PoolQuestion[] = rows.map((row) => ({ ...row, fallback: false }))
      if (served.length >= count) return served

      // The English bank. Excluded ids are honoured first; a player who has seen every seed
      // question still gets a game, with repeats, rather than an error.
      const takenIds = [...exclude, ...served.map(({ id }) => id)]
      let seeds = await drawFromPool({
        locale: DEFAULT_LOCALE,
        level,
        ranked: false,
        categories: [],
        excludeIds: takenIds,
        count: count - served.length,
        origin: 'seed',
      })
      if (served.length + seeds.length < count) {
        const repeats = await drawFromPool({
          locale: DEFAULT_LOCALE,
          level,
          ranked: false,
          categories: [],
          excludeIds: [...served.map(({ id }) => id), ...seeds.map(({ id }) => id)],
          count: count - served.length - seeds.length,
          origin: 'seed',
        })
        seeds = seeds.concat(repeats)
      }
      return served.concat(seeds.map((row) => ({ ...row, fallback: locale !== DEFAULT_LOCALE })))
    })
  )

  // Not counted as served here: the game reports what it actually showed (`markQuestionsShown`).
  return perLevel.flat()
}

export type RunQuestion = {
  question: PoolQuestion
  /** Drawn from the public pool because the reserve and the AI both came up short. */
  isPublic: boolean
}

/**
 * One question for a ranked run, from the ranked reserve: never one this run has served, and
 * preferably none the player met in earlier runs — they saw those answers revealed. When
 * nothing unseen is left, the reserve is generated into on the spot; failing that, the player
 * gets a repeat from an earlier run; and only an empty reserve falls back to the public pool,
 * whose run the caller keeps off the leaderboard.
 *
 * `player` (`user:<id>`) is charged for any AI batch the draw starts.
 */
export const getRunQuestion = async (
  locale: Locale,
  level: Level,
  servedIds: readonly string[],
  playerSeenIds: readonly string[],
  player: string
): Promise<RunQuestion> => {
  void recordDemand(locale, [level], true).catch((error: unknown) => console.error('[pool] demand', error))

  const draw = (excludeIds: readonly string[]) => drawFromPool({ locale, level, ranked: true, categories: [], excludeIds, count: 1 })
  const unseen = [...servedIds, ...playerSeenIds]
  let [row] = await draw(unseen)
  if (!row && isAiConfigured()) {
    try {
      await waitForGeneration(generateIntoPool(locale, level, [], true, player))
      ;[row] = await draw(unseen)
    } catch (error) {
      console.warn(`[pool] ranked generation failed for ${locale}/L${level}:`, (error as Error).message)
    }
  }
  if (!row && playerSeenIds.length) [row] = await draw(servedIds)

  if (row) {
    await prisma.question.update({ where: { id: row.id }, data: { servedCount: { increment: 1 } } })
    return { question: { ...row, fallback: false }, isPublic: false }
  }

  const [question] = await getQuestionBatch({ locale, counts: { [level]: 1 }, categories: [], excludeIds: servedIds, player })
  if (!question) throw new Error(`No question available for ${locale}/L${level}`)
  // A run shows what it draws, so this one is served now; batches leave counting to the game.
  await prisma.question.update({ where: { id: question.id }, data: { servedCount: { increment: 1 } } })
  return { question, isPublic: true }
}

export const getQuestionById = async (id: string): Promise<PoolQuestion | null> => {
  const row = await prisma.question.findUnique({ where: { id } })
  if (!row) return null
  return {
    id: row.id,
    locale: row.locale,
    category: row.category,
    level: row.level,
    scope: row.scope,
    text: row.text,
    options: row.options,
    correctIndex: row.correctIndex,
    fallback: false,
  }
}

/** Per level, what an offline pack carries. 5 levels × 40 = 200 questions, a few hundred KB. */
const PACK_PER_LEVEL = 40

/**
 * An offline language pack. Served without touching `servedCount` — downloading a pack is
 * not playing it. The version changes whenever the locale's pool grows, so the client knows
 * when an update is worth downloading.
 */
export const getOfflinePack = async (locale: Locale) => {
  const perLevel = await Promise.all(
    ([1, 2, 3, 4, 5] as const).map((level) =>
      prisma.$queryRaw<QuestionRow[]>`
        SELECT ${SELECT_COLUMNS}
        FROM "Question"
        WHERE locale = ${locale} AND level = ${level} AND NOT ranked AND "retiredAt" IS NULL
        ORDER BY random()
        LIMIT ${PACK_PER_LEVEL}
      `
    )
  )
  const stats = await prisma.question.aggregate({
    where: { locale, ranked: false, retiredAt: null },
    _count: { _all: true },
    _max: { createdAt: true },
  })
  const version = `${stats._count._all}-${stats._max.createdAt?.getTime() ?? 0}`
  return { locale, version, questions: perLevel.flat() }
}

/** Sample questions for a category landing page (rendered on the server for SEO). */
export const getCategorySamples = async (locale: Locale, category: Category, count = 5): Promise<QuestionRow[]> =>
  prisma.$queryRaw<QuestionRow[]>`
    SELECT ${SELECT_COLUMNS}
    FROM "Question"
    WHERE locale = ${locale} AND category = ${category} AND NOT ranked AND "retiredAt" IS NULL AND level <= 3
    ORDER BY "servedCount" DESC, "createdAt" ASC
    LIMIT ${count}
  `

/**
 * Deletes retired questions (their reports go with them), except one a ranked run has on
 * screen right now: that player's answer must still count, so it waits for the next pass.
 */
export const deleteRetiredQuestions = async (questionId?: string): Promise<number> =>
  prisma.$executeRaw`
    DELETE FROM "Question" q
    WHERE q."retiredAt" IS NOT NULL ${questionId ? Prisma.sql`AND q.id = ${questionId}` : Prisma.empty}
      AND NOT EXISTS (SELECT 1 FROM "Run" r WHERE r.status = 'active' AND r."currentQuestionId" = q.id)
  `

/**
 * Moves well-used questions from the ranked reserve to the public pool — the only direction a
 * question may cross: it stops being drawn for ranked at the moment its answer becomes
 * downloadable. Each reserve bucket (locale, level) keeps `keepPerBucket`, the most-served
 * leave first, and one a run has on screen waits for the next pass. `servedCount` starts over,
 * because in Classic the question is new. Returns how many moved.
 */
export const graduateRankedQuestions = ({ minServes, keepPerBucket }: { minServes: number; keepPerBucket: number }): Promise<number> =>
  prisma.$executeRaw`
    WITH reserve AS (
      SELECT id, "servedCount",
             count(*) OVER (PARTITION BY locale, level) AS "bucketSize",
             row_number() OVER (PARTITION BY locale, level ORDER BY "servedCount" DESC, "createdAt" ASC) AS "servedRank"
      FROM "Question"
      WHERE ranked AND "retiredAt" IS NULL
    )
    UPDATE "Question" q
    SET ranked = false, "servedCount" = 0
    FROM reserve r
    WHERE q.id = r.id
      AND r."servedCount" >= ${minServes}
      AND r."servedRank" <= r."bucketSize" - ${keepPerBucket}
      AND NOT EXISTS (SELECT 1 FROM "Run" run WHERE run.status = 'active' AND run."currentQuestionId" = q.id)
  `

/**
 * Records a "this question is wrong" report. After a few, an AI question is retired and
 * deleted — a wrong question has nothing left to give. Idempotent per reporter.
 */
export const reportQuestion = async (questionId: string, reporterKey: string, reason: string | undefined) => {
  let created: Prisma.BatchPayload
  try {
    created = await prisma.questionReport.createMany({
      data: [{ questionId, reporterKey, reason: reason ?? null }],
      skipDuplicates: true,
    })
  } catch (error) {
    // Already deleted; an old offline pack still holds it.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') return
    throw error
  }
  if (!created.count) return

  const question = await prisma.question.update({
    where: { id: questionId },
    data: { reportCount: { increment: 1 } },
    select: { reportCount: true, origin: true },
  })
  // Seed questions are hand-checked; a report on one is a reason to look, not to retire.
  if (question.origin === 'ai' && question.reportCount >= RETIRE_AFTER_REPORTS) {
    await prisma.question.update({ where: { id: questionId }, data: { retiredAt: new Date() } })
    await deleteRetiredQuestions(questionId)
  }
}
