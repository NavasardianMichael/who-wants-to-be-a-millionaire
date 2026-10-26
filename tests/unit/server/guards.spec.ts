import { describe, expect, it } from 'vitest'
import { deriveCookieDomain } from '../../../server/src/lib/cookie-domain'
import { resolveErrorResponse } from '../../../server/src/lib/error-response'
import { isAllowedReturnPath, localeOfPath } from '../../../server/src/lib/return-path'
import { mentionsOption } from '../../../server/src/services/phoneAFriend'

describe('return path guard', () => {
  it.each(['/en', '/en/play', '/hy/profile?x=1', '/pt-BR/leaderboard', '/zh-CN'])('accepts %s', (path) => {
    expect(isAllowedReturnPath(path)).toBe(true)
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', '/en\u0000', 'en/play', '/notalocale/play', '/EN/play'])(
    'refuses %s',
    (path) => {
      expect(isAllowedReturnPath(path)).toBe(false)
    }
  )

  it('reads the locale off a path', () => {
    expect(localeOfPath('/hy/play')).toBe('hy')
    expect(localeOfPath('/pt-BR')).toBe('pt-BR')
    expect(localeOfPath(null)).toBe('en')
    expect(localeOfPath('//evil')).toBe('en')
  })
})

describe('cookie domain', () => {
  it('is host-only outside production and for dotless hosts', () => {
    expect(deriveCookieDomain('development', 'https://millionaire.example.com')).toBe('')
    expect(deriveCookieDomain('production', 'http://localhost:7006')).toBe('')
  })

  it('is the web host in production', () => {
    expect(deriveCookieDomain('production', 'https://millionaire.example.com')).toBe('millionaire.example.com')
  })
})

describe('error responses', () => {
  it('keeps production messages generic', () => {
    expect(resolveErrorResponse(new Error('db password wrong'), true)).toEqual({ status: 500, code: -1, message: 'Internal server error' })
    expect(resolveErrorResponse(new Error('boom'), false).message).toContain('boom')
  })

  it('maps known library errors', () => {
    expect(resolveErrorResponse({ name: 'PrismaClientKnownRequestError', code: 'P2025' }, true).status).toBe(404)
    expect(resolveErrorResponse({ name: 'MulterError', code: 'LIMIT_FILE_SIZE', message: 'File too large' }, true).status).toBe(413)
    expect(resolveErrorResponse({ status: 400, type: 'entity.parse.failed' }, true).message).toBe('Malformed JSON body')
  })
})

describe('phone a friend reply check', () => {
  it('finds the option letter as a standalone word or the option text', () => {
    expect(mentionsOption("I'd go with B, pretty sure.", 'B', 'Paris')).toBe(true)
    expect(mentionsOption('Je pense que c’est Paris.', 'B', 'Paris')).toBe(true)
    expect(mentionsOption('Bonjour! Aucune idée.', 'B', 'Paris')).toBe(false)
  })
})
