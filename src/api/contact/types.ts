import { Endpoint } from '@interfaces/api'

/** Mirrors the bounds in `server/src/routes/contact.ts`. */
export const CONTACT_LIMITS = { name: 60, message: 2000 } as const

/**
 * The contact page writes and never reads, and nothing is stored server-side — so the
 * payload lives here rather than in a store slice.
 */
export type SendContactMessageAPI = Endpoint<{
  payload: {
    name: string
    email: string
    message: string
    /** The page's language, so a reply can be written in it. */
    locale: string
    /** Honeypot: always sent, always empty for a person; the server drops anything that fills it. */
    website: string
  }
  response: boolean
  processed: boolean
}>
