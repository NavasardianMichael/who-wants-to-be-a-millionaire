import { syncClassicAPI } from '@api/classic/main'
import type { ClassicResult } from '@interfaces/entities'
import { reportError } from '@helpers/reportError'
import { getDb } from './db'

/**
 * Results recorded on the device first and sent to the server when possible — on the
 * `online` event, after sign-in, and on app start. The game's `clientId` makes the upload
 * idempotent, so a flush interrupted half way simply runs again.
 */
export const enqueueClassicResult = async (result: ClassicResult): Promise<void> => {
  try {
    const db = await getDb()
    await db?.put('outbox', { id: result.clientId, kind: 'classic', payload: result, createdAt: new Date().toISOString() })
  } catch (error) {
    reportError(error, 'outbox:enqueue')
  }
}

let flushing: Promise<number> | null = null

/** Sends everything queued. Returns how many entries left the outbox. Never throws. */
export const flushOutbox = (): Promise<number> => {
  flushing ??= (async () => {
    try {
      const db = await getDb()
      if (!db) return 0
      const entries = await db.getAll('outbox')
      if (!entries.length) return 0

      const { acceptedClientIds } = await syncClassicAPI({ games: entries.map(({ payload }) => payload) })
      const accepted = new Set(acceptedClientIds)
      // Rejected entries are malformed and would fail forever; drop them too.
      await Promise.all(entries.map(({ id }) => db.delete('outbox', id)))
      return accepted.size
    } catch (error) {
      // Offline or signed out: the entries stay queued for the next flush.
      reportError(error, 'outbox:flush', { silent: true })
      return 0
    } finally {
      flushing = null
    }
  })()
  return flushing
}
