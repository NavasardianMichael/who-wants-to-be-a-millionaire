import { createHash, randomBytes } from 'node:crypto'

/**
 * Single-use tokens that travel in a URL (email verification, password reset). Stored hashed,
 * so a database read alone cannot be turned into a working link; a link is looked up by its
 * hash, which the unique index makes a single-row read.
 */
export const mintUrlToken = (): string => randomBytes(32).toString('hex')

export const hashUrlToken = (token: string): string => createHash('sha256').update(token).digest('hex')
