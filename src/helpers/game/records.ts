import { STORAGE_KEYS } from '@constants/app'
import { readJson, writeJson } from '@helpers/storage'

/**
 * Personal bests on this device, by key: `classic` (winnings), `marathon:ranked`,
 * `marathon:practice`, `timeAttack:ranked`, `timeAttack:practice` (correct answers).
 * Signed-in players also have their Classic best on the account; ranked bests live on the
 * leaderboard.
 */
type Bests = Record<string, number>

export const readBests = (): Bests => readJson<Bests>(STORAGE_KEYS.practiceBests, {})

export const readBest = (key: string): number => readBests()[key] ?? 0

export const writeBest = (key: string, value: number): void => writeJson(STORAGE_KEYS.practiceBests, { ...readBests(), [key]: value })
