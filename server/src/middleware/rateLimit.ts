import type { RequestHandler } from 'express'
import { fail } from '../lib/api-response.js'
import { createRateLimiter } from '../lib/rateLimit.js'

/**
 * Express wrapper over `lib/rateLimit.ts`. Keys on the signed-in user when there is one,
 * otherwise on the IP (`trust proxy` is 1, so `req.ip` is the client behind nginx).
 */
export const rateLimit = (name: string, options: { limit: number; windowMs: number }): RequestHandler => {
  const limiter = createRateLimiter(options)

  return (req, res, next) => {
    const key = `${name}:${req.session?.userId ?? req.ip ?? 'unknown'}`
    const verdict = limiter(key)
    if (verdict.allowed) return next()

    res.setHeader('Retry-After', String(verdict.retryAfterSeconds))
    return fail(res, 'Too many requests', 429, 429)
  }
}
