import { getOfflinePackAPI } from '@api/questions/main'
import type { Locale } from '@i18n/config'
import { localePath } from '@i18n/pathname'
import { ROUTES } from '@constants/routes'
import { reportError } from '@helpers/reportError'
import { getDb, type StoredPack } from './db'

/** A pack's metadata, without the questions — what the settings screen lists. */
export type PackSummary = Pick<StoredPack, 'locale' | 'version' | 'downloadedAt' | 'bytes'> & { count: number }

export const listPacks = async (): Promise<PackSummary[]> => {
  try {
    const db = await getDb()
    if (!db) return []
    const packs = await db.getAll('packs')
    return packs.map(({ locale, version, downloadedAt, bytes, questions }) => ({
      locale,
      version,
      downloadedAt,
      bytes,
      count: questions.length,
    }))
  } catch (error) {
    reportError(error, 'packs:list')
    return []
  }
}

export const getPack = async (locale: string): Promise<StoredPack | undefined> => {
  try {
    return await (await getDb())?.get('packs', locale)
  } catch (error) {
    reportError(error, 'packs:get')
    return undefined
  }
}

/** The pages a pack makes playable offline; the service worker caches them on request. */
const offlinePagesFor = (locale: Locale): string[] =>
  [ROUTES.home, ROUTES.play, ROUTES.marathon, ROUTES.timeAttack].map((route) => localePath(locale, route))

/** Asks the service worker to cache a locale's pages, so the pack is playable from a cold start. */
export const cachePagesFor = (locale: Locale): void => {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls: offlinePagesFor(locale) })
}

/** Downloads (or refreshes) a pack. Throws on network failure — the caller shows the error. */
export const downloadPack = async (locale: Locale): Promise<PackSummary> => {
  const pack = await getOfflinePackAPI({ locale })
  const stored: StoredPack = {
    ...pack,
    downloadedAt: new Date().toISOString(),
    bytes: new Blob([JSON.stringify(pack.questions)]).size,
  }
  const db = await getDb()
  if (!db) throw new Error('Offline storage is not available in this browser')
  await db.put('packs', stored)
  cachePagesFor(locale)
  return { locale, version: stored.version, downloadedAt: stored.downloadedAt, bytes: stored.bytes, count: pack.questions.length }
}

export const removePack = async (locale: string): Promise<void> => {
  const db = await getDb()
  await db?.delete('packs', locale)
}
