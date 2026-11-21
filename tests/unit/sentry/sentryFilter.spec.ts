import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'
import { filterSentryEvent, isUncaughtAutoplayRefusal, isUncaughtForeignScriptError } from '@helpers/sentryFilter'

const FIREFOX =
  'The play method is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.'
const CHROMIUM = "play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD"
const UNHANDLED = 'auto.browser.global_handlers.onunhandledrejection'

const event = (type: string, value: string, mechanism = UNHANDLED): ErrorEvent => ({
  type: undefined,
  exception: { values: [{ type, value, mechanism: { type: mechanism, handled: false } }] },
})

describe('isUncaughtAutoplayRefusal', () => {
  it('drops an uncaught autoplay refusal in Firefox and Chromium wording', () => {
    expect(isUncaughtAutoplayRefusal(event('NotAllowedError', FIREFOX))).toBe(true)
    expect(isUncaughtAutoplayRefusal(event('NotAllowedError', CHROMIUM))).toBe(true)
    expect(filterSentryEvent(event('NotAllowedError', FIREFOX))).toBeNull()
  })

  it('keeps a refusal the app reported itself', () => {
    expect(isUncaughtAutoplayRefusal(event('NotAllowedError', FIREFOX, 'generic'))).toBe(false)
  })

  it('keeps other NotAllowedErrors and other unhandled rejections', () => {
    expect(isUncaughtAutoplayRefusal(event('NotAllowedError', 'Write permission denied.'))).toBe(false)
    expect(isUncaughtAutoplayRefusal(event('TypeError', 'Failed to fetch'))).toBe(false)
    const other = event('TypeError', 'Failed to fetch')
    expect(filterSentryEvent(other)).toBe(other)
  })

  it('keeps events without an exception', () => {
    const message: ErrorEvent = { type: undefined, message: 'hello' }
    expect(filterSentryEvent(message)).toBe(message)
  })
})

describe('isUncaughtForeignScriptError', () => {
  const thrown = (filenames: string[], mechanism = UNHANDLED): ErrorEvent => ({
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: "Cannot read properties of undefined (reading 'M_ID')",
          mechanism: { type: mechanism, handled: false },
          stacktrace: { frames: filenames.map((filename) => ({ filename, in_app: true })) },
        },
      ],
    },
  })

  it('drops an uncaught error thrown only by a script that is not ours', () => {
    const injected = thrown(['app:///executors/200.js', 'app:///executors/200.js'])
    expect(isUncaughtForeignScriptError(injected)).toBe(true)
    expect(filterSentryEvent(injected)).toBeNull()
    expect(isUncaughtForeignScriptError(thrown(['chrome-extension://abc/content.js'], 'auto.browser.global_handlers.onerror'))).toBe(true)
  })

  it('keeps an error with any frame of our bundle or of an inline script', () => {
    expect(isUncaughtForeignScriptError(thrown(['app:///executors/200.js', 'app:///_next/static/chunks/0cz1d0mv5g_q7.js']))).toBe(false)
    expect(isUncaughtForeignScriptError(thrown(['app:///vi/play']))).toBe(false)
  })

  it('keeps errors something caught, and errors without frames', () => {
    expect(isUncaughtForeignScriptError(thrown(['app:///executors/200.js'], 'generic'))).toBe(false)
    expect(isUncaughtForeignScriptError(thrown([]))).toBe(false)
  })
})
