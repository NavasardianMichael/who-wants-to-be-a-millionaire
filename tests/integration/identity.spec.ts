import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { createUser, ORIGIN, prisma } from './helpers'
import { createApp } from '../../server/src/app'
import { ERROR_CODE } from '../../server/src/lib/error-codes'

const app = createApp()
const PASSWORD = 'quiz-night-2026'

/** With the mail engine off, account emails print to the console — links included. */
let consoleLog: MockInstance<typeof console.log>

beforeEach(() => {
  consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => {
  consoleLog.mockRestore()
})

afterAll(async () => {
  await prisma.$disconnect()
})

const lastMail = (): string => String(consoleLog.mock.calls.at(-1)?.[0] ?? '')

const linkIn = (mail: string): { path: string; token: string } => {
  const url = new URL(/https?:\/\/\S+/.exec(mail)?.[0] ?? 'http://none')
  return { path: url.pathname, token: url.searchParams.get('token') ?? '' }
}

const post = (path: string, body: object, cookie?: string) => {
  const call = request(app).post(path).set('Origin', ORIGIN)
  return (cookie ? call.set('Cookie', cookie) : call).send(body)
}

const sessionCookie = (response: request.Response): string => {
  const cookies = ([] as string[]).concat(response.headers['set-cookie'] ?? [])
  const session = cookies.find((cookie) => cookie.startsWith('millionaire_session='))
  return session?.split(';')[0] ?? ''
}

const freshEmail = () => `${randomUUID()}@example.com`

/** Registers and opens the verification link: a password account ready to sign in. */
const registerVerified = async (email: string, locale = 'en') => {
  expect((await post('/identity/register', { email, password: PASSWORD, displayName: 'Ann', locale })).status).toBe(201)
  expect((await post('/identity/email/verify', { token: linkIn(lastMail()).token })).status).toBe(200)
}

describe('password sign-up', () => {
  it('creates an inactive account that the emailed link activates, once', async () => {
    const email = freshEmail()
    const registered = await post('/identity/register', { email: email.toUpperCase(), password: PASSWORD, displayName: 'Ann', locale: 'hy' })
    expect(registered.status).toBe(201)
    expect(registered.body.value).toEqual({ email })
    expect(sessionCookie(registered)).toBe('')

    const link = linkIn(lastMail())
    expect(link.path).toBe('/hy/verify-email')
    expect(lastMail()).toContain('Ann')

    const early = await post('/identity/login', { email, password: PASSWORD })
    expect(early.status).toBe(403)
    expect(early.body.error.code).toBe(ERROR_CODE.emailNotVerified)

    expect((await post('/identity/email/verify', { token: link.token })).status).toBe(200)
    const reused = await post('/identity/email/verify', { token: link.token })
    expect(reused.body.error.code).toBe(ERROR_CODE.verifyTokenInvalid)

    const login = await post('/identity/login', { email, password: PASSWORD })
    expect(login.status).toBe(200)
    const me = await request(app).get('/identity/me').set('Cookie', sessionCookie(login))
    expect(me.body.value).toMatchObject({ email, displayName: 'Ann', locale: 'hy', hasPassword: true })
  })

  it('explains what it refuses', async () => {
    const email = freshEmail()
    const weak = await post('/identity/register', { email, password: 'short', displayName: 'Ann', locale: 'en' })
    expect(weak.body.error.code).toBe(ERROR_CODE.weakPassword)

    const nameless = await post('/identity/register', { email, password: PASSWORD, displayName: 'A', locale: 'en' })
    expect(nameless.body.error.code).toBe(ERROR_CODE.invalidDisplayName)

    await registerVerified(email)
    const taken = await post('/identity/register', { email, password: PASSWORD, displayName: 'Bob', locale: 'en' })
    expect(taken.status).toBe(409)
    expect(taken.body.error.code).toBe(ERROR_CODE.emailTaken)
  })

  it('resends a link only to an unverified account, answering the same either way', async () => {
    const email = freshEmail()
    await post('/identity/register', { email, password: PASSWORD, displayName: 'Ann', locale: 'en' })
    const first = linkIn(lastMail()).token

    expect((await post('/identity/email/resend', { email, locale: 'fr' })).body.value).toBe(true)
    const second = linkIn(lastMail())
    expect(second.path).toBe('/fr/verify-email')
    expect(second.token).not.toBe(first)
    // Only the latest link works.
    expect((await post('/identity/email/verify', { token: first })).status).toBe(400)

    consoleLog.mockClear()
    expect((await post('/identity/email/resend', { email: freshEmail(), locale: 'en' })).body.value).toBe(true)
    expect(consoleLog).not.toHaveBeenCalled()
  })
})

describe('password sign-in', () => {
  it('gives one answer for a wrong password and an unknown address', async () => {
    const email = freshEmail()
    await registerVerified(email)

    const wrong = await post('/identity/login', { email, password: 'quiz-night-2027' })
    const unknown = await post('/identity/login', { email: freshEmail(), password: PASSWORD })
    for (const response of [wrong, unknown]) {
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe(ERROR_CODE.invalidCredentials)
    }
  })

  it('points a Google-only account to Google', async () => {
    const { user } = await createUser('Googler')
    const response = await post('/identity/login', { email: user.email, password: PASSWORD })
    expect(response.body.error.code).toBe(ERROR_CODE.googleOnlyAccount)
  })
})

describe('password reset', () => {
  it('sets a new password from the emailed link, signs in, and ends every other session', async () => {
    const email = freshEmail()
    await registerVerified(email)
    const oldSession = sessionCookie(await post('/identity/login', { email, password: PASSWORD }))

    expect((await post('/identity/password/forgot', { email, locale: 'de' })).body.value).toBe(true)
    const link = linkIn(lastMail())
    expect(link.path).toBe('/de/reset-password')

    const weak = await post('/identity/password/reset', { token: link.token, password: 'short' })
    expect(weak.body.error.code).toBe(ERROR_CODE.weakPassword)

    const reset = await post('/identity/password/reset', { token: link.token, password: 'new-quiz-night-1' })
    expect(reset.status).toBe(200)
    expect((await request(app).get('/identity/me').set('Cookie', sessionCookie(reset))).body.value.email).toBe(email)
    expect((await request(app).get('/identity/me').set('Cookie', oldSession)).body.value).toBeNull()

    const reused = await post('/identity/password/reset', { token: link.token, password: 'another-one-2' })
    expect(reused.body.error.code).toBe(ERROR_CODE.resetTokenInvalid)
    expect((await post('/identity/login', { email, password: PASSWORD })).status).toBe(401)
    expect((await post('/identity/login', { email, password: 'new-quiz-night-1' })).status).toBe(200)
  })

  it('lets a signed-in Google account add a password through its inbox', async () => {
    const { user, cookie } = await createUser('Googler')
    expect((await post('/identity/password/link', { locale: 'en' })).status).toBe(401)
    expect((await post('/identity/password/link', { locale: 'en' }, cookie)).status).toBe(200)

    const reset = await post('/identity/password/reset', { token: linkIn(lastMail()).token, password: PASSWORD })
    expect(reset.body.value.hasPassword).toBe(true)
    expect((await post('/identity/login', { email: user.email, password: PASSWORD })).status).toBe(200)
  })

  it('mails nobody for an unknown address, and says so to nobody', async () => {
    const response = await post('/identity/password/forgot', { email: freshEmail(), locale: 'en' })
    expect(response.body.value).toBe(true)
    expect(consoleLog).not.toHaveBeenCalled()
  })
})
