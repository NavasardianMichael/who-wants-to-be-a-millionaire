import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { ClassicResult, OfflinePack } from '@interfaces/entities'
import { IDB_NAME, IDB_VERSION } from '@constants/app'

/**
 * The device's own storage for offline play:
 * - `packs` — downloaded language packs (a few hundred KB each), keyed by locale.
 * - `outbox` — results waiting to reach the server, keyed by the game's `clientId`.
 *
 * Every accessor fails soft: IndexedDB can be missing (old browsers, some private modes) and
 * the game must still run online without it.
 */
export type StoredPack = OfflinePack & { downloadedAt: string; bytes: number }

export type OutboxEntry = { id: string; kind: 'classic'; payload: ClassicResult; createdAt: string }

interface MillionaireDB extends DBSchema {
  packs: { key: string; value: StoredPack }
  outbox: { key: string; value: OutboxEntry }
}

let dbPromise: Promise<IDBPDatabase<MillionaireDB>> | null = null

export const getDb = (): Promise<IDBPDatabase<MillionaireDB>> | null => {
  if (typeof indexedDB === 'undefined') return null
  dbPromise ??= openDB<MillionaireDB>(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'locale' })
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' })
    },
  })
  return dbPromise
}
