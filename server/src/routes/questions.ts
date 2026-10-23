import { Router } from 'express'
import { createHash } from 'node:crypto'
import { fail, ok } from '../lib/api-response.js'
import { type Category, isCategory, type Level, LEVELS } from '../lib/game.js'
import { isLocale } from '../lib/locales.js'
import { asBoundedString, asInteger, asStringArray, isUuid } from '../lib/request.js'
import { asyncHandler } from '../middleware/error.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { getCategorySamples, getOfflinePack, getQuestionBatch, reportQuestion } from '../services/questionPool.js'

export const questionsRouter = Router()

/** A Classic game is 15 + spares for Switch Question; anything near 40 is not a game. */
const MAX_BATCH = 30
const MAX_PER_LEVEL = 10
const MAX_EXCLUDE = 500

/**
 * POST /questions/batch — questions **with their answers**, for Classic and practice games.
 * Those are unranked, so the answer living on the client costs nothing; ranked modes use
 * `/runs` instead, where it never leaves the server.
 */
questionsRouter.post(
  '/batch',
  rateLimit('questions', { limit: 30, windowMs: 60_000 }),
  asyncHandler(async (req, res) => {
    const { locale } = req.body ?? {}
    if (!isLocale(locale)) return fail(res, 'Unsupported locale', 400)

    const counts: Partial<Record<Level, number>> = {}
    let total = 0
    for (const level of LEVELS) {
      const count = asInteger(req.body?.counts?.[level], 0, MAX_PER_LEVEL) ?? 0
      if (count) counts[level] = count
      total += count
    }
    if (!total || total > MAX_BATCH) return fail(res, `Ask for 1-${MAX_BATCH} questions`, 400)

    const categories = asStringArray(req.body?.categories, 16, isCategory) as Category[]
    const excludeIds = asStringArray(req.body?.excludeIds, MAX_EXCLUDE, isUuid)

    const questions = await getQuestionBatch({ locale, counts, categories, excludeIds })
    return ok(res, questions)
  })
)

/** GET /questions/samples?locale=&category= — a few questions for a category landing page (SEO). */
questionsRouter.get(
  '/samples',
  asyncHandler(async (req, res) => {
    const { locale, category } = req.query
    if (!isLocale(locale) || !isCategory(category)) return fail(res, 'Unsupported locale or category', 400)

    const samples = await getCategorySamples(locale, category)
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    return ok(res, samples)
  })
)

/** GET /questions/packs/:locale — an offline language pack. */
questionsRouter.get(
  '/packs/:locale',
  rateLimit('packs', { limit: 20, windowMs: 60_000 }),
  asyncHandler(async (req, res) => {
    const { locale } = req.params
    if (!isLocale(locale)) return fail(res, 'Unsupported locale', 400)

    const pack = await getOfflinePack(locale)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return ok(res, pack)
  })
)

/** POST /questions/:id/report — "this question is wrong". One report per player per question. */
questionsRouter.post(
  '/:id/report',
  rateLimit('report', { limit: 20, windowMs: 60 * 60 * 1000 }),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (typeof id !== 'string' || !isUuid(id)) return fail(res, 'Invalid question id', 400)

    // Guests are keyed by a hash of their IP — enough to stop one person retiring a question alone.
    const reporterKey = req.session?.userId ?? `ip:${createHash('sha256').update(req.ip ?? '').digest('hex').slice(0, 32)}`
    await reportQuestion(id, reporterKey, asBoundedString(req.body?.reason, 200))
    return ok(res, true)
  })
)
