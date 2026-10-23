import { Prisma } from '@prisma/client'
import { generateQuestions } from './questionGen.js'
import { isGeminiConfigured } from '../config.js'
import { CATEGORIES, type Category, type Level } from '../lib/game.js'
import { DEFAULT_LOCALE, type Locale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'

/**
 * Serving questions: **pool first, Gemini second, the seeded English bank last.**
 *
 * Every question Gemini writes is kept, so the free quota is spent once per question rather
 * than once per player. A request the pool can satisfy costs no API call at all; a short
 * bucket is generated on the spot and the surplus stays for the next player; and when the
 * model chain is exhausted the game still starts, on the curated English bank.
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
  explanation: string | null
  /** Served from the English fallback bank because the locale's pool and Gemini both came up short. */
  fallback: boolean
}

type QuestionRow = Omit<PoolQuestion, 'fallback'>

const SELECT_COLUMNS = Prisma.sql`id, locale, category, level, scope::text AS scope, text, options, "correctIndex", explanation`

/** Generated per call; the surplus beyond what the request needs stays in the pool. */
export const GENERATION_BATCH = 8

/** Reports after which a question is retired from play. */
const RETIRE_AFTER_REPORTS = 3

type DrawParams = {
  locale: string
  level: number
  categories: readonly string[]
  excludeIds: readonly string[]
  count: number
  origin?: 'seed'
}

/** Least-served first, random among equals — fresh questions rotate in before repeats. */
const drawFromPool = async ({ locale, level, categories, excludeIds, count, origin }: DrawParams): Promise<QuestionRow[]> => {
  if (count <= 0) return []
  const categoryFilter = categories.length ? Prisma.sql`AND category = ANY(${categories as string[]}::text[])` : Prisma.empty
  const excludeFilter = excludeIds.length ? Prisma.sql`AND id <> ALL(${excludeIds as string[]}::text[])` : Prisma.empty
  const originFilter = origin ? Prisma.sql`AND origin = 'seed'` : Prisma.empty

  return prisma.$queryRaw<QuestionRow[]>`
    SELECT ${SELECT_COLUMNS}
    FROM "Question"
    WHERE locale = ${locale} AND level = ${level} AND "retiredAt" IS NULL
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
 * Concurrent requests for the same empty bucket share one Gemini call instead of each
 * spending quota on the same questions.
 */
const inFlight = new Map<string, Promise<number>>()

/** Generates one batch into the pool. Returns how many new questions were stored. */
export const generateIntoPool = (locale: Locale, level: Level, category: Category): Promise<number> => {
  const key = `${locale}:${level}:${category}`
  const existing = inFlight.get(key)
  if (existing) return existing

  const task = (async () => {
    const recent = await prisma.question.findMany({
      where: { locale, level, category },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { text: true },
    })

    // Two attempts, like hangman's content retries: an all-invalid batch is usually a fluke.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { questions, model } = await generateQuestions({
        locale,
        category,
        level,
        count: GENERATION_BATCH,
        avoid: recent.map(({ text }) => text),
      })
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
          explanation: question.explanation || null,
          origin: 'ai' as const,
          model,
          hash: question.hash,
        })),
        skipDuplicates: true,
      })
      return count
    }
    return 0
  })().finally(() => inFlight.delete(key))

  inFlight.set(key, task)
  return task
}

const recordDemand = async (locale: string, levels: readonly number[]): Promise<void> => {
  await Promise.all(
    levels.map((level) =>
      prisma.generationDemand.upsert({
        where: { locale_level: { locale, level } },
        create: { locale, level, requests: 1 },
        update: { requests: { increment: 1 }, lastRequestedAt: new Date() },
      })
    )
  )
}

export type BatchRequest = {
  locale: Locale
  /** How many questions each level needs. */
  counts: Partial<Record<Level, number>>
  categories: readonly Category[]
  excludeIds: readonly string[]
}

/**
 * Fills a whole game's worth of questions, level by level, in parallel. Never throws for a
 * Gemini failure — that is what the fallback bank is for.
 */
export const getQuestionBatch = async ({ locale, counts, categories, excludeIds }: BatchRequest): Promise<PoolQuestion[]> => {
  const levels = (Object.keys(counts).map(Number) as Level[]).filter((level) => (counts[level] ?? 0) > 0)
  void recordDemand(locale, levels).catch((error: unknown) => console.error('[pool] demand', error))

  const perLevel = await Promise.all(
    levels.map(async (level): Promise<PoolQuestion[]> => {
      const count = counts[level] ?? 0
      const exclude = [...excludeIds]
      let rows = await drawFromPool({ locale, level, categories, excludeIds: exclude, count })

      if (rows.length < count && isGeminiConfigured()) {
        try {
          await generateIntoPool(locale, level, pickCategory(categories))
          const more = await drawFromPool({
            locale,
            level,
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
        categories: [],
        excludeIds: takenIds,
        count: count - served.length,
        origin: 'seed',
      })
      if (served.length + seeds.length < count) {
        const repeats = await drawFromPool({
          locale: DEFAULT_LOCALE,
          level,
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

  const questions = perLevel.flat()
  if (questions.length) {
    await prisma.question.updateMany({
      where: { id: { in: questions.map(({ id }) => id) } },
      data: { servedCount: { increment: 1 } },
    })
  }
  return questions
}

/** One question for a ranked run, skipping everything the run has already served. */
export const getRunQuestion = async (locale: Locale, level: Level, servedIds: readonly string[]): Promise<PoolQuestion> => {
  const [question] = await getQuestionBatch({ locale, counts: { [level]: 1 }, categories: [], excludeIds: servedIds })
  if (!question) throw new Error(`No question available for ${locale}/L${level}`)
  return question
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
    explanation: row.explanation,
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
        WHERE locale = ${locale} AND level = ${level} AND "retiredAt" IS NULL
        ORDER BY random()
        LIMIT ${PACK_PER_LEVEL}
      `
    )
  )
  const stats = await prisma.question.aggregate({
    where: { locale, retiredAt: null },
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
    WHERE locale = ${locale} AND category = ${category} AND "retiredAt" IS NULL AND level <= 3
    ORDER BY "servedCount" DESC, "createdAt" ASC
    LIMIT ${count}
  `

/** Records a "this question is wrong" report; retires the question after a few. Idempotent per reporter. */
export const reportQuestion = async (questionId: string, reporterKey: string, reason: string | undefined) => {
  const created = await prisma.questionReport.createMany({
    data: [{ questionId, reporterKey, reason: reason ?? null }],
    skipDuplicates: true,
  })
  if (!created.count) return

  const question = await prisma.question.update({
    where: { id: questionId },
    data: { reportCount: { increment: 1 } },
    select: { reportCount: true, origin: true },
  })
  // Seed questions are hand-checked; a report on one is a reason to look, not to retire.
  if (question.origin === 'ai' && question.reportCount >= RETIRE_AFTER_REPORTS) {
    await prisma.question.update({ where: { id: questionId }, data: { retiredAt: new Date() } })
  }
}
