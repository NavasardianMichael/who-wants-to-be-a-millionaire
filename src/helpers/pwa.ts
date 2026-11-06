import { emblemSvg } from './brand'

export const SERVICE_WORKER_URL = '/sw.js'

/** Bump when the worker's behaviour or the offline document changes: old caches are dropped on activate. */
export const PWA_CACHE_VERSION = 'v3'

const OFFLINE_URL = '/__offline__'

/** Always available offline: the app chrome and the English question bank. */
export const PRECACHE_URLS = [
  '/icon',
  '/apple-icon',
  '/packs/fallback-en.json',
  '/audio/resign.mp3',
  '/audio/final-answer.mp3',
  '/audio/correct-answer.mp3',
  '/audio/wrong-answer.mp3',
  '/audio/next.mp3',
  '/audio/fifty-fifty.mp3',
  '/audio/audience-help.mp3',
  '/audio/phone-a-friend.mp3',
  '/audio/you-won-a-million.mp3',
]

export type OfflineColors = { background: string; text: string; muted: string; accent: string; onAccent: string }

/**
 * The last-resort page for a navigation that is neither online nor cached. Inlined into the
 * worker so it can never be missing. English only, like `global-error.tsx`: it lives
 * outside the catalogue. Usually never seen — the locale's own pages are cached as they are
 * visited and when a pack is downloaded.
 */
export const buildOfflineDocument = (colors: OfflineColors): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="${colors.background}" />
    <title>Millionaire — offline</title>
    <style>
      html, body { margin: 0; }
      body { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
        background: ${colors.background}; color: ${colors.text}; font-family: system-ui, -apple-system, sans-serif; text-align: center; }
      main { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; max-width: 30rem; }
      .emblem { width: 96px; height: 96px; }
      h1 { margin: 0; font-size: 1.5rem; }
      p { margin: 0; color: ${colors.muted}; }
      a { margin-top: 0.5rem; min-height: 2.75rem; padding: 0 1.5rem; display: inline-flex; align-items: center;
        border-radius: 999px; background: ${colors.accent}; color: ${colors.onAccent}; font-weight: 700; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <div class="emblem">${emblemSvg()}</div>
      <h1>You're offline</h1>
      <p>This page hasn't been saved for offline play yet. Open the game in your language once while online, or download a question pack in Settings.</p>
      <a href="">Try again</a>
    </main>
  </body>
</html>
`

/**
 * - Navigations: network first (with navigation preload), cached by path; offline, the same
 *   path from cache, else the locale's home page, else the offline document.
 * - `/_next/static/`: cache first — content-hashed, never stale.
 * - Audio: cache first, the whole file fetched once; an `<audio>` element's byte-range
 *   request is sliced from it. 206s are never stored.
 * - Images, packs, fonts (incl. Google Fonts): stale-while-revalidate.
 * - Never intercepted: non-GET, the API (another origin), RSC payloads, analytics.
 * - `CACHE_URLS` message: the page hands over assets it loaded before the worker took
 *   control (fetched only if not cached yet), and pages to keep for offline play (a
 *   downloaded pack's locale, refreshed each time).
 */
export const buildServiceWorkerScript = (options: { version: string; offlineDocument: string }): string => {
  const cacheName = JSON.stringify(`millionaire-${options.version}`)
  return `'use strict';
const CACHE = ${cacheName};
const OFFLINE_URL = ${JSON.stringify(OFFLINE_URL)};
const OFFLINE_HTML = ${JSON.stringify(options.offlineDocument)};
const PRECACHE_URLS = ${JSON.stringify(PRECACHE_URLS)};
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
/** A precache miss is skipped on purpose: one missing file must not fail the install. */
const skip = () => undefined;

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/image') ||
  url.pathname.startsWith('/audio/') ||
  url.pathname.startsWith('/packs/') ||
  url.pathname === '/icon' || url.pathname === '/apple-icon' ||
  /\\.(mp3|woff2?|ttf|png|jpe?g|webp|avif|svg|ico|json|webmanifest)$/.test(url.pathname);

const isPage = (url) => url.origin === self.location.origin && !url.pathname.startsWith('/_next/') && !isStaticAsset(url);

/** The Cache API rejects partial (206) responses, so only whole ones are stored. */
const isCacheable = (response) => response.status === 200 || response.type === 'opaque';
const store = (cache, key, response) => cache.put(key, response).catch(skip);

/** Answers a media element's byte-range request from a whole response, as a 206. */
const sliceRange = async (request, response) => {
  const match = /^bytes=(\\d*)-(\\d*)$/.exec(request.headers.get('Range') || '');
  if (!match || (match[1] === '' && match[2] === '')) return response;
  const blob = await response.blob();
  const size = blob.size;
  const start = match[1] === '' ? Math.max(0, size - Number(match[2])) : Number(match[1]);
  const end = match[1] === '' || match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || blob.type,
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
};

/**
 * Sounds: cache first by URL, fetched whole once and never revalidated (a changed file ships
 * with a PWA_CACHE_VERSION bump). An <audio> element asks for a byte range; forwarded as-is
 * it comes back a 206, which the Cache API refuses, and the file is fetched on every play.
 */
const mediaRequest = async (event) => {
  const request = event.request;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request.url, { ignoreVary: true });
  if (cached) return sliceRange(request, cached);
  let whole;
  try {
    whole = await fetch(request.url, { credentials: 'same-origin' });
  } catch (error) {
    return Response.error();
  }
  if (whole.status !== 200) return whole;
  // Stored in the background: playback starts while a long music bed is still downloading.
  event.waitUntil(store(cache, request.url, whole.clone()));
  return sliceRange(request, whole);
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.put(OFFLINE_URL, new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    // One missing file must not fail the whole install.
    await Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(skip)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(event.data.urls.map(async (href) => {
      try {
        const url = new URL(href, self.location.origin);
        if (url.origin !== self.location.origin) return;
        if (isPage(url)) {
          const response = await fetch(url.pathname, { credentials: 'same-origin' });
          if (isCacheable(response)) await store(cache, url.pathname, response);
        } else if (isStaticAsset(url) || url.pathname.startsWith('/_next/static/')) {
          if (!(await cache.match(url.href, { ignoreVary: true }))) await cache.add(url.href);
        }
      } catch (error) { /* offline or gone: skip it */ }
    }));
  })());
});

const localeHome = (pathname) => '/' + (pathname.split('/')[1] || 'en');

const networkFirst = async (event) => {
  const cache = await caches.open(CACHE);
  const key = new URL(event.request.url).pathname;
  try {
    const response = (await event.preloadResponse) || (await fetch(event.request));
    if (isCacheable(response)) store(cache, key, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(key)) || (await cache.match(localeHome(key))) || (await cache.match(OFFLINE_URL)) ||
      new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) store(cache, request, response.clone());
  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) store(cache, request, response.clone());
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || network;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (FONT_HOSTS.includes(url.hostname)) { event.respondWith(staleWhileRevalidate(request)); return; }
  if (url.origin !== self.location.origin) return;
  // React Server Component payloads are per-navigation data; caching them would serve stale trees.
  if (url.searchParams.has('_rsc') || request.headers.get('RSC')) return;

  if (request.mode === 'navigate') { event.respondWith(networkFirst(event)); return; }
  if (url.pathname.startsWith('/_next/static/')) { event.respondWith(cacheFirst(request)); return; }
  if (url.pathname.startsWith('/audio/') || (isStaticAsset(url) && request.headers.has('Range'))) {
    event.respondWith(mediaRequest(event));
    return;
  }
  if (isStaticAsset(url)) event.respondWith(staleWhileRevalidate(request));
});
`
}
