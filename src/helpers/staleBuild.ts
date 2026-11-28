/**
 * What the bundler throws when a page mixes two builds: a chunk of the previous deploy (from the
 * browser's or the service worker's cache) asks for a module the running build numbers
 * differently — Turbopack's "module factory is not available" — or a chunk that a deploy
 * removed fails to download. Nothing is wrong with the code; a full load of the page fixes it.
 */
const STALE_BUILD = /module factory is not available|failed to load chunk|loading (css )?chunk \S+ failed/i

const RELOADED_AT_KEY = 'millionaire:stale-build-reload'

/** One automatic reload per minute: an error that survives a fresh load is not a stale build. */
const RELOAD_GUARD_MS = 60_000

export const isStaleBuildError = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'ChunkLoadError' || STALE_BUILD.test(error.message))

/**
 * Reloads the page if `error` comes from a stale build and no reload was tried in the last
 * minute. Returns whether it reloaded; when it did, the error needs no report. Without
 * sessionStorage the guard can't be kept, so it never reloads rather than risk a loop.
 */
export const reloadIfStaleBuild = (error: unknown): boolean => {
  if (typeof window === 'undefined' || !isStaleBuildError(error)) return false
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_AT_KEY))
    if (last && Date.now() - last < RELOAD_GUARD_MS) return false
    window.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
