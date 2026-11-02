import { describe, expect, it } from 'vitest'
import { ERROR_CODE } from '../../../server/src/lib/error-codes'
import {
  hashPassword,
  needsRehash,
  parsePasswordHash,
  PASSWORD_POLICY,
  validatePassword,
  verifyDummyPassword,
  verifyPassword,
} from '../../../server/src/lib/password'
import { asDisplayName, asEmail, DISPLAY_NAME_LIMITS as SERVER_NAME_LIMITS } from '../../../server/src/lib/request'
import { ACCOUNT_PATH, buildWebUrl, TOKEN_QUERY as SERVER_TOKEN_QUERY } from '../../../server/src/lib/return-path'
import { AUTH_ERROR_CODE, DISPLAY_NAME_LIMITS, isStrongPassword, PASSWORD_LIMITS, TOKEN_QUERY } from '../../../src/constants/auth'
import { ROUTES } from '../../../src/constants/routes'

describe('password policy', () => {
  it.each(['correct horse 1', 'abcdefg1', 'пароль2024', 'գաղտնաբառ7', '密码密码密码密码1'])('accepts %s', (password) => {
    expect(validatePassword(password).ok).toBe(true)
  })

  it.each([
    ['too short', 'abc1'],
    ['no digit', 'abcdefghij'],
    ['no letter', '1234567890'],
    ['too long', `a1${'x'.repeat(PASSWORD_POLICY.max)}`],
    ['not a string', 12345678],
  ])('refuses one that is %s', (_label, password) => {
    expect(validatePassword(password).ok).toBe(false)
  })

  it('refuses a password containing the email name', () => {
    expect(validatePassword('player42!', { email: 'player42@example.com' }).ok).toBe(false)
    expect(validatePassword('ab-secret-1', { email: 'ab@example.com' }).ok).toBe(true)
  })

  it('is mirrored by the web forms', () => {
    expect(PASSWORD_LIMITS).toEqual(PASSWORD_POLICY)
    for (const candidate of ['abc1', 'abcdefg1', 'пароль2024', 'abcdefghij', '1234567890', `a1${'x'.repeat(200)}`]) {
      expect(isStrongPassword(candidate)).toBe(validatePassword(candidate).ok)
    }
  })
})

describe('password hashing', () => {
  it('hashes with argon2id and verifies only the right password', async () => {
    const stored = await hashPassword('abcdefg1')
    expect(parsePasswordHash(stored)).toMatchObject({ algorithm: 'argon2id', version: 19 })
    expect(needsRehash(stored)).toBe(false)
    expect(await verifyPassword(stored, 'abcdefg1')).toBe(true)
    expect(await verifyPassword(stored, 'abcdefg2')).toBe(false)
  })

  it('reads a corrupt hash as a wrong password, never a throw', async () => {
    expect(await verifyPassword('not-a-hash', 'abcdefg1')).toBe(false)
    expect(await verifyDummyPassword('abcdefg1')).toBe(false)
  })

  it('upgrades weaker hashes, never stronger ones', () => {
    expect(needsRehash('$argon2id$v=19$m=19456,t=2,p=1$c2FsdA$aGFzaA')).toBe(true)
    expect(needsRehash('$argon2i$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA')).toBe(true)
    expect(needsRehash('$argon2id$v=19$m=131072,t=4,p=4$c2FsdA$aGFzaA')).toBe(false)
    expect(needsRehash('$2b$10$bcryptleftover')).toBe(true)
  })
})

describe('account input', () => {
  it('normalises an email address', () => {
    expect(asEmail('  Ann@Example.COM ')).toBe('ann@example.com')
    expect(asEmail('not an email')).toBeUndefined()
  })

  it('accepts a leaderboard name only within the limits, without invisible characters', () => {
    expect(asDisplayName('  Ann  ')).toBe('Ann')
    expect(asDisplayName('A')).toBeUndefined()
    expect(asDisplayName('x'.repeat(25))).toBeUndefined()
    expect(asDisplayName('An​n')).toBeUndefined()
    expect(DISPLAY_NAME_LIMITS).toEqual(SERVER_NAME_LIMITS)
  })
})

describe('auth twins', () => {
  it('shares error codes with the web forms', () => {
    expect(AUTH_ERROR_CODE).toEqual(ERROR_CODE)
  })

  it('links emails to pages the web app serves', () => {
    expect(ACCOUNT_PATH).toEqual({
      verifyEmail: ROUTES.verifyEmail,
      resetPassword: ROUTES.resetPassword,
      forgotPassword: ROUTES.forgotPassword,
    })
    expect(SERVER_TOKEN_QUERY).toBe(TOKEN_QUERY)
    expect(buildWebUrl('https://quiz.example', '/hy/verify-email', { token: 'abc' })).toBe(
      'https://quiz.example/hy/verify-email?token=abc'
    )
  })
})
