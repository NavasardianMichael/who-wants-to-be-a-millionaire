import { API_URL_FALLBACK, SITE_URL_FALLBACK } from '@constants/app'

/** In the browser the tab's origin wins, so share links always open the page being looked at. */
export const getSiteUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin.replace(/\/+$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/+$/, '')
}

/**
 * Google's "preferred sources" page for this site: a reader who adds it sees the site more
 * often in Top Stories and AI answers. The no-script deeplink from
 * developers.google.com/search/docs/appearance/preferred-sources, so the footer's badge is
 * drawn in our own colours and loads nothing from Google. Built from the env, never the tab.
 */
export const googlePreferredSourceUrl = (): string =>
  `https://www.google.com/preferences/source?q=${new URL(process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).host}`

export const absoluteUrl =(path: string): string => `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`

/**
 * The API origin. On the server an `API_INTERNAL_URL` (e.g. `http://127.0.0.1:9006`) wins, so
 * server-rendered pages reach the API over loopback instead of a round trip through nginx.
 */
export const getApiUrl = (): string =>
  ((typeof window === 'undefined' && process.env.API_INTERNAL_URL) || process.env.NEXT_PUBLIC_API_URL || API_URL_FALLBACK).replace(
    /\/+$/,
    ''
  )

/** The public API origin, for URLs the browser will request (avatars, the Google redirect). */
export const getPublicApiUrl = (): string => (process.env.NEXT_PUBLIC_API_URL || API_URL_FALLBACK).replace(/\/+$/, '')

/** Uploaded avatars are paths on the API (`/uploads/...`); Google photos are already absolute. */
export const resolveAvatarUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  return url.startsWith('/uploads/') ? `${getPublicApiUrl()}${url}` : url
}
