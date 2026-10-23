import { Router } from 'express'
import { fail, ok } from '../lib/api-response.js'
import { isLevel, OPTIONS_COUNT } from '../lib/game.js'
import { isLocale } from '../lib/locales.js'
import { asBoundedString, asInteger } from '../lib/request.js'
import { asyncHandler } from '../middleware/error.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { callFriend } from '../services/phoneAFriend.js'

export const lifelinesRouter = Router()

/**
 * POST /lifelines/phone-a-friend — for unranked games, where the client already holds the
 * answer and simply wants the friend's voice. Ranked runs call `/runs/:id/lifeline`.
 */
lifelinesRouter.post(
  '/phone-a-friend',
  rateLimit('phone', { limit: 10, windowMs: 60_000 }),
  asyncHandler(async (req, res) => {
    const body = req.body ?? {}
    if (!isLocale(body.locale)) return fail(res, 'Unsupported locale', 400)
    if (!isLevel(body.level)) return fail(res, 'level must be 1-5', 400)

    const question = asBoundedString(body.question, 400)
    const options = Array.isArray(body.options) ? body.options.map((option: unknown) => asBoundedString(option, 160)) : []
    if (!question || options.length !== OPTIONS_COUNT || options.some((option: string | undefined) => !option)) {
      return fail(res, 'question and four options are required', 400)
    }

    const correctIndex = asInteger(body.correctIndex, 0, 3)
    if (correctIndex === undefined) return fail(res, 'correctIndex must be 0-3', 400)

    const removed: number[] = Array.isArray(body.removed)
      ? body.removed.filter((index: unknown) => asInteger(index, 0, 3) !== undefined && index !== correctIndex)
      : []

    const answer = await callFriend({ locale: body.locale, question, options, correctIndex, removed, level: body.level })
    return ok(res, answer)
  })
)
