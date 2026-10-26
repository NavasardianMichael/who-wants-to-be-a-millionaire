import { Router } from 'express'
import { fail, ok } from '../lib/api-response.js'
import { isLifeline, isRankedMode } from '../lib/game.js'
import { runOwnerFor } from '../lib/guest.js'
import { isLocale } from '../lib/locales.js'
import { asInteger, isUuid } from '../lib/request.js'
import { asyncHandler } from '../middleware/error.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { answerRun, getRun, startRun, useRunLifeline } from '../services/runs.js'

/**
 * Ranked Marathon and Time Attack runs — see `services/runs.ts` for the refereeing. No
 * sign-in needed: a guest's runs are tied to a guest cookie (`lib/guest.ts`) and refereed the
 * same way; only a signed-in player's runs reach the leaderboard.
 */
export const runsRouter = Router()

const readRunId = (value: unknown): string | null => (typeof value === 'string' && isUuid(value) ? value : null)

runsRouter.post(
  '/',
  rateLimit('runs:start', { limit: 20, windowMs: 60 * 60 * 1000 }),
  asyncHandler(async (req, res) => {
    const { mode, locale } = req.body ?? {}
    if (!isRankedMode(mode)) return fail(res, 'mode must be marathon or timeAttack', 400)
    if (!isLocale(locale)) return fail(res, 'Unsupported locale', 400)

    return ok(res, await startRun(runOwnerFor(req, res), mode, locale), 201)
  })
)

runsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const runId = readRunId(req.params.id)
    if (!runId) return fail(res, 'Run not found', 404, 404)
    return ok(res, await getRun(runId, runOwnerFor(req, res)))
  })
)

/** `index: null` is the client reporting its own timeout. */
runsRouter.post(
  '/:id/answer',
  rateLimit('runs:answer', { limit: 120, windowMs: 60_000 }),
  asyncHandler(async (req, res) => {
    const runId = readRunId(req.params.id)
    if (!runId) return fail(res, 'Run not found', 404, 404)

    const questionId = req.body?.questionId
    if (typeof questionId !== 'string' || !isUuid(questionId)) return fail(res, 'questionId is required', 400)

    const index = req.body?.index === null ? null : asInteger(req.body?.index, 0, 3)
    if (index === undefined) return fail(res, 'index must be 0-3 or null', 400)

    return ok(res, await answerRun(runId, runOwnerFor(req, res), questionId, index))
  })
)

runsRouter.post(
  '/:id/lifeline',
  rateLimit('runs:lifeline', { limit: 30, windowMs: 60_000 }),
  asyncHandler(async (req, res) => {
    const runId = readRunId(req.params.id)
    if (!runId) return fail(res, 'Run not found', 404, 404)
    if (!isLifeline(req.body?.lifeline)) return fail(res, 'Unknown lifeline', 400)

    return ok(res, await useRunLifeline(runId, runOwnerFor(req, res), req.body.lifeline))
  })
)
