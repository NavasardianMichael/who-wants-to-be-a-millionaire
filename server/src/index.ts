import { createApp } from './app.js'
import { config } from './config.js'
import { startPoolRefillJob } from './jobs/poolRefill.js'
import { startQuestionCleanup } from './jobs/questionCleanup.js'
import { startRankedGraduation } from './jobs/rankedGraduation.js'
import { startRunSweeper } from './jobs/runSweeper.js'
import { prisma } from './lib/prisma.js'

/** systemd's TimeoutStopSec is 30 s (deployment/millionaire-api.service); past that it kills. */
const SHUTDOWN_GRACE_MS = 25_000

const app = createApp()

const server = app.listen(config.port, config.host, () => {
  console.log(`Millionaire API listening on http://${config.host}:${config.port}`)
  // Here rather than in `createApp`, so tests that build the app never poll.
  startPoolRefillJob()
  startRunSweeper()
  startQuestionCleanup()
  startRankedGraduation()
})

/**
 * A deploy restarts the service: stop taking connections, let the requests in flight finish —
 * an answer in a ranked run, a sign-in, an avatar upload — then let go of the database. The
 * jobs' timers are unref'd, so they never hold the process; a refill caught mid-batch is lost
 * and the next tick makes it up.
 */
let shuttingDown = false
const shutdown = (signal: NodeJS.Signals): void => {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`[api] ${signal}: finishing in-flight requests`)
  setTimeout(() => {
    console.warn(`[api] still busy after ${SHUTDOWN_GRACE_MS / 1000} s, exiting`)
    process.exit(1)
  }, SHUTDOWN_GRACE_MS).unref()

  server.close(() => {
    prisma
      .$disconnect()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        console.error('[api] shutdown', error)
        process.exit(1)
      })
  })
  server.closeIdleConnections()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
