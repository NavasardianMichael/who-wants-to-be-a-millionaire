import type { RequestHandler } from 'express'
import { fail } from '../lib/api-response.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { clientAddress, isLoopback } from '../lib/request.js'

type LimitOptions = { limit: number; windowMs: number }

const tooMany = (res: Parameters<RequestHandler>[1], retryAfterSeconds: number): void => {
  res.setHeader('Retry-After', String(retryAfterSeconds))
  fail(res, 'Too many requests', 429, 429)
}

/**
 * Express wrapper over `lib/rateLimit.ts`. Keys on the signed-in user when there is one,
 * otherwise on the address (`clientAddress`: an IPv6 client is its /64).
 */
export const rateLimit = (name: string, options: LimitOptions): RequestHandler => {
  const limiter = createRateLimiter(options)

  return (req, res, next) => {
    const verdict = limiter(`${name}:${req.session?.userId ?? clientAddress(req)}`)
    if (verdict.allowed) return next()
    return tooMany(res, verdict.retryAfterSeconds)
  }
}

/**
 * One budget per address across every route — a flood brake, far above any player. nginx
 * keeps the same one (`limit_req`, deployment/api.*.conf) but keys it on the full address, and
 * cannot group IPv6 by /64; here a client rotating through its /64 meets it. The web app's
 * server-side renders come from this host and are never counted.
 */
export const addressLimit = (options: LimitOptions): RequestHandler => {
  const limiter = createRateLimiter(options)

  return (req, res, next) => {
    if (isLoopback(req)) return next()
    const verdict = limiter(clientAddress(req))
    if (verdict.allowed) return next()
    return tooMany(res, verdict.retryAfterSeconds)
  }
}
