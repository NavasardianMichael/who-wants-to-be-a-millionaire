import { deleteRetiredQuestions } from '../services/questionPool.js'

/**
 * Deletes reported-wrong questions that `reportQuestion` could not delete on the spot,
 * because a ranked run had them on screen at that moment. Rare, so hourly is plenty.
 */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000

export const startQuestionCleanup = (): void => {
  const timer = setInterval(() => {
    deleteRetiredQuestions().catch((error: unknown) => console.error('[cleanup]', error))
  }, CLEANUP_INTERVAL_MS)
  timer.unref()
}
