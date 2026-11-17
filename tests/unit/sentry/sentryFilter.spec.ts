import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'
import { filterSentryEvent, isUncaughtAutoplayRefusal } from '@helpers/sentryFilter'

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
