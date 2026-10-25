/* eslint-disable simple-import-sort/imports -- `instrument` must load first, so Sentry can wrap Express before it is imported. */
import './instrument.js'

import { createApp } from './app.js'
import { config } from './config.js'
import { startPoolRefillJob } from './jobs/poolRefill.js'
import { startQuestionCleanup } from './jobs/questionCleanup.js'
import { startRunSweeper } from './jobs/runSweeper.js'

const app = createApp()

app.listen(config.port, config.host, () => {
  console.log(`Millionaire API listening on http://${config.host}:${config.port}`)
  // Here rather than in `createApp`, so tests that build the app never poll.
  startPoolRefillJob()
  startRunSweeper()
  startQuestionCleanup()
})
