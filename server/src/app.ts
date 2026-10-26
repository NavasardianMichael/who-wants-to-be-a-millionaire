import * as Sentry from '@sentry/node'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { config, isGeminiConfigured, isGoogleOAuthConfigured } from './config.js'
import { fail, ok } from './lib/api-response.js'
import { optionalAuth } from './middleware/auth.js'
import { requireSameOrigin } from './middleware/csrf.js'
import { errorHandler } from './middleware/error.js'
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

  app.use(cors({ origin: config.corsOrigin, credentials: true }))
  app.use(cookieParser())
  app.use(express.json({ limit: '256kb' }))
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true }))
  // Before every router, so no state-changing route can be reached without an origin proof.
  app.use(requireSameOrigin)
  app.use(optionalAuth)

  // `google` and `gemini` are reported from the server's own config, so the web app decides
  // what to render from one source of truth rather than a mirrored NEXT_PUBLIC_ variable.
  app.get('/health', (_req, res) => {
    ok(res, { status: 'ok', google: isGoogleOAuthConfigured(), gemini: isGeminiConfigured() })
  })

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

  if (config.sentryDsn) Sentry.setupExpressErrorHandler(app)
  app.use(errorHandler)

  return app
}
