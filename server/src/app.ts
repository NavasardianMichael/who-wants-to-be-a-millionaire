import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { config, isGoogleOAuthConfigured } from './config.js'
import { isAiConfigured } from './lib/ai/index.js'
import { fail, ok } from './lib/api-response.js'
import { prisma } from './lib/prisma.js'
import { optionalAuth } from './middleware/auth.js'
import { requireSameOrigin } from './middleware/csrf.js'
import { asyncHandler, errorHandler } from './middleware/error.js'
import { addressLimit } from './middleware/rateLimit.js'
import { badgesRouter } from './routes/badges.js'
import { classicRouter } from './routes/classic.js'
import { contactRouter } from './routes/contact.js'
import { identityRouter } from './routes/identity.js'
import { leaderboardsRouter } from './routes/leaderboards.js'
import { lifelinesRouter } from './routes/lifelines.js'
import { profileRouter } from './routes/profile.js'
import { questionsRouter } from './routes/questions.js'
import { runsRouter } from './routes/runs.js'

export function createApp() {
  const app = express()

  // Exactly one hop — nginx. Never `true`, which would trust a client-supplied
  // X-Forwarded-For and collapse every IP rate limiter into a spoofable key.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })
  // `maxAge`: the web is another origin, so every JSON write is preflighted; without it the
  // browser asks again before each answer of a ranked run.
  app.use(cors({ origin: config.corsOrigin, credentials: true, maxAge: 7200 }))
  app.use(cookieParser())
  app.use(express.json({ limit: '256kb' }))
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true }))
  // nginx's 20/s with a burst of 100, as one fixed window.
  app.use(addressLimit({ limit: 1200, windowMs: 60_000 }))
  // Before every router, so no state-changing route can be reached without an origin proof.
  app.use(requireSameOrigin)
  app.use(optionalAuth)

  // `google` and `ai` are reported from the server's own config, so the web app decides
  // what to render from one source of truth rather than a mirrored NEXT_PUBLIC_ variable.
  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      // Down when the database is: the deploy's health wait (and its rollback) and the uptime
      // monitor rely on it.
      try {
        await prisma.$queryRaw`SELECT 1`
      } catch {
        return fail(res, 'Database unavailable', 503, 503)
      }
      return ok(res, { status: 'ok', google: isGoogleOAuthConfigured(), ai: isAiConfigured() })
    })
  )

  app.use('/identity', identityRouter)
  app.use('/profile', profileRouter)
  app.use('/questions', questionsRouter)
  app.use('/lifelines', lifelinesRouter)
  app.use('/runs', runsRouter)
  app.use('/leaderboards', leaderboardsRouter)
  app.use('/classic', classicRouter)
  app.use('/badges', badgesRouter)
  app.use('/contact', contactRouter)

  // Answered in the envelope like everything else — Express's default is an HTML page.
  app.use((_req, res) => fail(res, 'Not found', 404, 404))

  app.use(errorHandler)

  return app
}
