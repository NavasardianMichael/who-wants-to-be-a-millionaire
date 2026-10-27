# Stack Blueprint — building a new project on this stack

Instructions for generating a new full-stack project with the same stack, structure and
patterns as **Millionaire Quiz** (this repo), **Bookie** (`../bookie`) and **Hangman**
(`../hangman`). Hand this file to a coding agent together with a description of the new
product; it says what to build, how, and which existing file to copy for each piece.

> **How to use:** "Build <product> following `docs/STACK_BLUEPRINT.md` in
> `who-wants-to-be-a-millionaire`. Requirements: …". The agent should read §1–§3 first, then
> the sections the product needs, and open the reference files listed in §15 rather than
> re-deriving them.

---

## 1. Principles

1. **Server-render everything a crawler or a first paint needs.** Client components are
   islands. Pages are static per locale with ISR where they show live data.
2. **Every URL names its language** (`/en/...`, `/hy/...`); every page is self-canonical with
   hreflang to all locales; the sitemap lists every page × locale.
3. **Layers with one job each:** web `api/` → `store/` → `components/`; server `routes/` →
   `services/` → `lib/` → Prisma. No layer reaches past its neighbour.
4. **One owner per value:** every env read in one config module; every secret read by one
   module; every colour in one token block; every user-visible string in one catalogue.
5. **Errors for two audiences:** translated copy chosen by error *kind* in production; the
   original message added in development. Never render a server's English message.
6. **Code decides, the model speaks.** When AI is involved, outcomes (right/wrong, which
   option, probabilities) are decided in code; the model only writes words, and every model
   output is validated before it is stored or shown. Always have a non-AI fallback.
7. **Degrade, don't fail:** no API key → feature hidden or fallback; API down at build →
   empty sections, ISR fills them; offline → cached pages and local data.
8. **Guard rails are code, not prose:** grep gates, twin-file parity tests, catalogue
   checks, `pnpm verify` before anything is called done.

## 2. Stack and versions

| Area | Choice |
|---|---|
| Runtime / package manager | Node 24 (`.nvmrc`), pnpm 10 workspace (`pnpm-workspace.yaml` → `server`) |
| Web | Next.js 16 App Router, `output: 'standalone'`, React 19, TypeScript 6 (strict, `noUnused*`) |
| Middleware | `src/proxy.ts` (Next 16's name for middleware) |
| i18n | next-intl 4, `localePrefix: 'always'`, `localeDetection: false` + own negotiation |
| Styling | Ant Design 6 (CSS-var mode, `@ant-design/nextjs-registry` with `layer`) + Tailwind 4 CSS-first (`@theme` in `globals.css`), `clsx` + `tailwind-merge` → `cn()` |
| Client state | Zustand 5 + immer, `combine`, `appendSelectors` |
| HTTP (web) | axios instance + 4-file API domains |
| Motion | `motion` (`motion/react`) + CSS keyframes; `prefers-reduced-motion` respected |
| Icons | `lucide-react`; brand marks as inline SVG strings |
| Offline | Route-handler service worker, `idb` for IndexedDB |
| Server | Express 5, ESM with `.js` imports, `tsx watch` in dev, `tsc` → `dist` |
| DB | PostgreSQL 16 (Docker), Prisma 6 (`prisma.config.ts`, migrations). Prisma 7 needs driver adapters — upgrade deliberately |
| Auth | Google OAuth (passport-google-oauth20 + cookie state/PKCE store), JWT httpOnly cookie with `tokenVersion` revocation |
| Uploads | multer memory storage → sharp re-encode → `/uploads` static |
| AI | `@google/genai`, model fallback chain with per-model cooldowns, JSON schema output |
| Observability | Sentry in the browser only (`@sentry/nextjs`), GA4 — both off when env is empty |
| Tests | Vitest 4 projects (`unit`, `integration` with supertest + throwaway DB), Playwright (desktop/tablet/phone) |
| Lint | ESLint 9 flat config (next, ts, jsx-a11y, react-hooks 7, security, simple-import-sort, prettier), husky + lint-staged |
| Deploy | GitHub Actions → SSH → systemd units + nginx; release dirs with `current` symlink |

## 3. Repository layout

```
/                         Next app
  src/app/[lang]/         every page (the root layout lives here)
  src/app/                locale-free: sitemap, robots, manifest, sw.js/route.ts, icon(s), not-found, global-error
  src/api/<domain>/       endpoints.ts · types.ts · processors.ts · main.ts   (+ axiosInstance.ts, unwrap.ts)
  src/store/<domain>/<slice>/  store.ts · types.ts   (+ appendSelectors.ts)
  src/components/         App.tsx, ui/{bare,layout}, <feature>/, layout/, pwa/, seo/, brand/
  src/hooks/ src/helpers/ src/constants/ src/interfaces/ src/i18n/ src/messages/ src/styles/ src/linkedDataSchema/
  src/proxy.ts  src/instrumentation-client.ts
  server/src/             app.ts · index.ts · config.ts · load-env.ts
  server/src/{routes,services,lib,middleware,mappers,jobs,types}/
  server/prisma/          schema.prisma · migrations/ · seed.ts · seed/*.json
  tests/{unit,integration,e2e,setup}/
  scripts/                gates.mjs · check-messages.mjs · i18n-sync.mjs · build-api-release.mjs · env-to-base64.mjs
  deployment/             *.service · *.conf
  docs/                   DEPLOYMENT.md · STACK_BLUEPRINT.md
  .github/workflows/      ci.yml · deploy.yml
  CLAUDE.md, src/CLAUDE.md, server/CLAUDE.md
```

Ports: pick a free trio per project (Bookie 7004/9004/5004, Hangman 7005, Millionaire 7006/9006/5006).

## 4. Conventions

- **Path aliases are explicit per folder** (`@api/*`, `@store/*`, `@helpers/*`, …). Never a
  catch-all `@*`: it captures scoped packages (`@sentry/...`) and breaks `next.config.ts`.
- **Named exports declared inline**; defaults only where a framework resolves them (route
  modules, `src/i18n/request.ts`, configs). ESLint warns on the rest.
- **Import order** enforced by `simple-import-sort` with one group list (react, packages,
  `@api`, `@store`, `@hooks`, `@interfaces`, `@i18n`, `@constants`, `@helpers`,
  `@linkedDataSchema`, `@components`, `@styles`, relative, css).
- **Comments explain why**, at the top of a module or above a non-obvious decision. No narration.
- **Prettier:** no semicolons, single quotes (JSX too), width 120, trailing commas es5.
- **Twin files** when web and server need the same rules (different module systems): identical
  below a marker line, enforced by a parity test (`tests/unit/game/twins.spec.ts`).

## 5. Server patterns (`server/`)

- **Config** (`config.ts`): the only `process.env` reader; defaults for dev; `isXConfigured()`
  helpers so a missing key disables a feature instead of crashing. `load-env.ts` loads
  `server/.env.<NODE_ENV>.local` (`development` when unset) by absolute path, shared by
  `prisma.config.ts` and the seed (dotenv never overrides real env vars — tests rely on that).
- **App** (`app.ts`): `trust proxy` = 1 → cors(credentials) → cookieParser → json(limit) →
  `/uploads` static → `requireSameOrigin` (Origin/Referer check on every write) → `optionalAuth`
  → `/health` (reports feature flags) → routers → 404 envelope → `errorHandler`.
- **Envelope:** `ok(res, value, status)` / `fail(res, message, code, status)` → `{ value, error }`.
- **Errors:** throw `HttpError(status, message, code)`; `lib/error-response.ts` maps Prisma,
  multer and body-parser errors by `name` (import-free, unit-testable), generic in production.
- **Validation:** hand-written readers (`asTrimmedString`, `asBoundedString`, `asInteger`,
  `asStringArray`, `isUuid`) plus domain guards (`isLocale`, `isCategory`). No schema library.
- **Auth:** `lib/session.ts` (sign/verify JWT, shared cookie options), `middleware/auth.ts`
  (`optionalAuth`, `requireAuth`, `tokenVersion` check), `lib/google-oauth.ts` (lazy strategy,
  `email_verified` gate), `lib/oauth-state.ts` (cookie state + PKCE store — parameter counts are
  load-bearing), `lib/return-path.ts` (open-redirect guard), `lib/cookie-domain.ts` (host-only in
  dev, web host in production so `api.<host>` and `<host>` share the cookie).
- **Rate limiting:** in-memory fixed window (`lib/rateLimit.ts`) + per-route middleware keyed on
  user id or IP. Note it is per-process.
- **Uploads:** multer memoryStorage with size and MIME limits → `sharp` decode (the real content
  check), rotate, resize, re-encode → write under `UPLOAD_DIR` → store the path, delete the old file.
- **Jobs:** `setInterval(...).unref()` started from `index.ts` only, never from `createApp`.
- **Mappers:** rows → web shapes in `mappers/entities.ts`; never leak columns by default.
- **Seeds:** idempotent (`createMany({ skipDuplicates: true })` on a natural unique key).

## 6. AI pattern (Gemini)

Copy `server/src/lib/gemini.ts` (from Hangman's `src/app/getWord/route.ts`):
- `MODELS` chain (lite → flash → newer flash); quotas are per model, so falling through adds capacity.
- Per-model cooldown on 429/500/503 (Google's `retryDelay` on quota errors, 15 s on overload);
  try cooled models anyway when all are cooling.
- `generateJson({ contents, systemInstruction, schema, maxOutputTokens, temperature })` with
  `responseMimeType: 'application/json'` + `responseSchema`; lazy client so builds need no key.
- `AllModelsFailedError` carries per-model failures for the logs.

Then:
- **Validate everything** (`services/questionGen.ts`): parse defensively, clip lengths, check
  structure and invariants (4 distinct options, index in range, no answer in the question,
  expected script for the language), dedupe by normalized hash, shuffle.
- **Optional checker pass** with a cheaper model answering blind; drop disagreements.
- **Pool and reuse** (`services/questionPool.ts`): store every valid generation; serve
  least-used first; generate only for short buckets; share in-flight generations; record demand
  and top up the busiest buckets in a background job within a call budget.
- **Code decides, model speaks** (`services/phoneAFriend.ts`): pick the outcome with a
  probability table, then ask the model to voice exactly that; reject replies that contradict it
  and fall back to a translated template.
- **Prompting for many languages:** write natively, not translated; give the culture explicitly
  (`lib/locales.ts` `LOCALE_INFO`), ask for a global/local mix, forbid language-dependent answers.

## 7. Web: routing, i18n, SEO

- **Copy Bookie's `src/i18n/*`**: `config.ts` (LOCALES, labels as endonyms, RTL set, OG locales),
  `routing.ts`, `request.ts` (`next/root-params`), `pathname.ts`, `matchAcceptLanguage.ts`,
  `navigation.ts`, `actions.ts` (`setLocale` cookie), plus `metadata.ts` with `pageMetadata()`
  (title, description, self-canonical, hreflang + x-default, OpenGraph locales, `noIndex`).
- **`src/proxy.ts`:** unprefixed → 307 to negotiated locale (cookie, then Accept-Language) with
  `Vary` + `no-store`; extension-less metadata routes (`/icon`, `/opengraph-image`, Sentry tunnel)
  pass through.
- **Root layout in `[lang]`:** `generateStaticParams` for all locales, `hasLocale` → `notFound`,
  `<html lang dir>`, `NextIntlClientProvider` without a `messages` prop, viewport export
  (`viewportFit: 'cover'`, no zoom lock), GA scripts when enabled.
- **Fonts:** next/font for Latin faces (`--font-heading`, `--font-body`); per-locale script
  faces (CJK, Indic, Arabic, Armenian, Georgian…) loaded from Google Fonts with a `<link>` only
  for that locale and composed via `--font-script` (avoids shipping every family's CSS).
- **Catalogues:** `src/messages/<locale>.json`, namespaces per area; `en.json` is the source.
  `scripts/check-messages.mjs` (keys, placeholders, plural `other`, untranslatable brand) runs in
  CI and in a unit test; `scripts/i18n-sync.mjs` fills new keys with Gemini. Translate the first
  version with parallel agents in batches of ~7 locales, each validating with the checker.
- **SEO:** `sitemap.ts` (routes × locales + dynamic landing pages, each with full hreflang),
  `robots.ts` (wildcard-disallow private paths), JSON-LD builders typed with `schema-dts`
  (`WebSite`, `VideoGame`/product type, `FAQPage`, `BreadcrumbList`, `ItemList`) rendered by a
  `JsonLd` component that escapes `<`, generated icons via `ImageResponse` from one SVG source.
- **Content for crawlers:** FAQ in `<details>`, rules, landing pages with real data (e.g. sample
  questions with answers) rendered on the server; `useSearchParams` only inside `<Suspense>`
  with a server-rendered fallback.

## 8. Web: data and state

- **API domain (4 files):** `endpoints.ts` (paths, functions for params) · `types.ts`
  (`Endpoint<{ payload; response; processed }>`) · `processors.ts` (unwrap `.value`, normalize) ·
  `main.ts` (axios calls; `React.cache` for server-side reads shared by metadata and page).
- **axios instance:** base URL from `getApiUrl()` (server prefers `API_INTERNAL_URL`), credentials,
  timeouts (longer for uploads/AI), an interceptor that names the failed call in the message.
- **Server reads** go through a `serverData.ts` that returns empty on failure.
- **Stores:** `create<State & Actions>()(immer(combine(initialState, (set, get) => actions)))`,
  exported raw (`useXStoreBase`) and with selectors (`useXStore.use.key()`); async actions set
  `isPending`/`error` in `try/finally`; cross-store calls via `useOtherStoreBase.getState()`.
- **Persisted preferences:** hydrate in one `AppEffects` component after mount (server render
  assumes defaults); storage helpers never throw.
- **Long async sequences in a store** (a game director): a generation counter checked after
  every await, so a quit/restart can't be overwritten by a stale timer.

## 9. Design system (Ant Design 6 + Tailwind 4)

- **Token chain** (bookie, this repo): `styles/tokens.ts` owns every hex → `styles/theme.ts`
  (`ThemeConfig`: algorithm, seed tokens as literals, component tokens,
  `cssVar: { prefix: 'ant', key: CSS_VAR_SCOPE }`, `hashed: false`) → antd emits `--ant-*` under
  the scope class, which the root layout stamps on `<html>` → globals.css §2 aliases them as
  `--brand-*` (with literal fallbacks) → `@theme inline` turns those into utilities
  (`rounded-control`, `h-control`, `bg-surface`…).
- **Layers:** `<AntdRegistry layer>` + `@layer theme, base, antd, components, utilities;` (first
  line of globals.css and an inline `<style>` at the top of `<head>`). Utilities beat antd;
  antd beats preflight.
- **Provider:** a small client `AntdProvider` (`ConfigProvider direction locale theme` +
  `<App component={false}>`) inside the server `App` shell; the antd locale is loaded on the
  server (`i18n/antdLocale.ts`) and passed as a prop.
- **Wrappers over antd** in `components/ui/` keep one API for the app (Button, IconButton,
  Dialog = Modal/Drawer, SegmentedControl, Chip, Toggle, Spinner, ErrorAlert, Avatar, Toaster →
  `message`). Gates forbid bare `Modal`/`Drawer`, deprecated antd props and `var(--ant-*)`
  outside the alias block.
- `globals.css` sections: §1 `@theme` tokens (colour ramps, fluid type scale `--text-*`,
  spacing, radii, shadows, easing, named animations; `--breakpoint-*: initial` then explicit
  sm/md/lg/xl) · §2 base (body, focus-visible, selection, dialog backdrop) · §3–§5 `@utility`
  helpers (gradients, panels, brand shapes) · §6 keyframes · §7 utilities (container, safe-area) ·
  §8 reduced motion.
- Hex values only in §1 and its JS mirror `styles/tokens.ts` (manifest, OG, SW offline page),
  kept equal by a unit test. A grep gate fails on hex elsewhere.
- `cn()` extends tailwind-merge with the custom text sizes so `text-body-sm text-mist` both survive.
- Class names must be literal in source (Tailwind scans text); never build them with string
  replacement. Prefer canonical v4.3 names (`inset-s-*`, `bg-linear-*`).
- UI kit: antd wrappers above, plus server-safe `ButtonLink` (`buttonClassName`), `Card`,
  `Section`, `PageHeader`, `Prose`, and the brand pieces that are not generic controls.
- Accessibility: labels on icon controls, state never by colour alone, live regions for
  results, keyboard shortcuts that ignore inputs and open dialogs, 44px+ targets, logical
  properties for RTL, `lang` on foreign-script fragments.

## 10. PWA and offline

- `app/manifest.ts` (`id: '/'`, `start_url: '/<default-locale>'`, maskable icon, shortcuts).
- Service worker from a route handler (`app/sw.js/route.ts` + `helpers/pwa.ts`): inlined offline
  page; precache list; network-first navigations cached by path with locale-home fallback;
  cache-first `/_next/static`; stale-while-revalidate assets and Google Fonts; never intercept
  POST, other origins or RSC payloads (`_rsc`); `CACHE_URLS` message to cache assets/pages on demand.
- `ServiceWorkerRegistrar` (production only, `updateViaCache: 'none'`, update on visibility).
- Install: Hangman's `installPrompt.ts` (module-level `beforeinstallprompt` capture,
  `useSyncExternalStore`), header `InstallButton`, iOS `InstallHint` dialog with cooldown.
- IndexedDB (`helpers/offline/db.ts`): downloadable data packs and an **outbox** of results
  keyed by a client-generated id; flush on `online`, on sign-in and after each game; the server
  upsert is idempotent on (user, clientId).

## 11. Analytics and errors

- GA4: `constants/analytics.ts` (validated ID, init script with `send_page_view: false`),
  `helpers/analytics.ts` (`trackEvent` with a typed event union), `PageViewTracker`.
- Sentry, browser only: `constants/sentry.ts` (validated DSN), `instrumentation-client.ts`
  (replays on error only), `global-error.tsx`, `withSentryConfig` with a `/monitoring` tunnel and
  source maps. No server-side init in Next or the API: those errors go to the logs.
  `reportError(error, context, { silent })` is the only sanctioned silence.

## 12. Testing and guard rails

- `vitest.config.mts` with projects: **unit** (pure helpers, server services, i18n parity, token
  mirror, sitemap) and **integration** (supertest on `createApp()` against `<app>_test`).
- Integration setup **must be fail-safe**: Vitest does not pass `test.env` to `globalSetup`, so
  resolve the URL there, refuse any database not named `*_test`, use `migrate deploy` (never
  `reset` — Prisma blocks it for AI agents, and an unset URL would hit the dev DB), `TRUNCATE`
  the test tables, seed. Resolve server-only packages (`@prisma/client`, `sharp`) with
  `createRequire(server/package.json)`.
- Playwright: three viewports (desktop, tablet, phone), a no-JavaScript test proving server-
  rendered content, canonical/hreflang assertions, RTL, locale negotiation, a happy path.
- `scripts/gates.mjs`: hex outside tokens, `dark:`, raw `next/link`/`next/navigation`, default
  exports in components, swallowed promises, hand-rolled alerts, rendered server messages,
  `process.env` outside config, secrets read outside their module.
- `pnpm verify` = typecheck web → typecheck server → gates → lint → tests → build.

## 13. Deployment

- `next build` → `.next/standalone` + copied `public/` and `.next/static`; smoke-boot it in CI.
- API: `tsc` → `scripts/build-api-release.mjs` (pinned deps, own `pnpm-workspace.yaml` with
  `onlyBuiltDependencies` incl. Prisma and sharp) → host `pnpm install --prod` → `prisma generate`
  → `prisma migrate deploy` → restart API → health check → restart web → health check `/en`.
- systemd units with hardening (`ProtectSystem=strict`, explicit `ReadWritePaths`), env file
  written by the workflow (mode 600), runtime keys (`NODE_ENV/PORT/HOST/UPLOAD_DIR`) owned by the
  workflow. nginx: TLS, `/_next/static` and media from disk, `/uploads` alias on the API host,
  `sw.js` never cached, generous read timeout for AI routes.
- Secrets: `SSH_*`, `APP_DIR`, `ENV_API_BASE64` (`pnpm env:base64 production`), public URLs.

## 14. Pitfalls already paid for

- **Destructuring `requestLocale` makes every page dynamic.** In `getRequestConfig(async
  ({ requestLocale }) => …)` the destructuring evaluates a getter that calls `headers()`, even
  when `lang()` from `next/root-params` already gave the locale. Write
  `getRequestConfig(async (params) => (await lang()) ?? (await params.requestLocale) …)`.
  The deprecated `setRequestLocale` only masks it. Verify with `.next/prerender-manifest.json`,
  or set `export const dynamic = 'error'` on one page so the build names the dynamic API.
  (Bookie's `src/i18n/request.ts` has the same destructuring.)
- `@*` path alias swallowing `@sentry/*` in `next.config.ts`.
- `useSearchParams` without Suspense turns a static page into client rendering.
- `react-hooks` 7 forbids synchronous `setState` in effects — derive state, use
  `useSyncExternalStore` (online status, install prompt) or act in event handlers.
- Tailwind class names built at runtime are never generated.
- Next's tsconfig-path fallback works in app code but not in `next.config.ts`.
- A `/me` probe that 401s for guests logs a console error on every page — return `null` with 200.
- next/font for many script families inflates every page's CSS — load script fonts per locale.
- ISR pages built while the API is unreachable stay empty until revalidation — keep revalidate
  short for data-driven landing pages.

## 15. Reference files

| Need | Copy from |
|---|---|
| ESLint, Prettier, tsconfig, husky, lint-staged | this repo (root) — Bookie's originals in `../bookie` |
| i18n layer + proxy | `src/i18n/*`, `src/proxy.ts` (here; originals in Bookie) |
| Root layout, metadata builder, sitemap, robots, manifest, icons | `src/app/[lang]/layout.tsx`, `src/i18n/metadata.ts`, `src/app/{sitemap,robots,manifest,icon,apple-icon}.ts(x)` |
| API domain template | `src/api/leaderboards/*` (simple), `src/api/profile/*` (upload) |
| Store templates | `src/store/auth/*` (async + flags), `src/store/leaderboard/list/*` (latest-request-wins) |
| Design tokens + UI kit | `src/styles/tokens.ts`, `src/styles/theme.ts`, `src/styles/globals.css`, `src/components/AntdProvider.tsx`, `src/components/ui/*` |
| Service worker + offline | `src/helpers/pwa.ts`, `src/app/sw.js/route.ts`, `src/helpers/offline/*` |
| Install button / iOS hint | `src/helpers/installPrompt.ts`, `src/components/pwa/*` (originals in Hangman `src/helpers/utils/installPrompt.ts`, `src/components/downloadAppBtn`) |
| Server skeleton | `server/src/{app,index,config,load-env}.ts`, `server/src/lib/{api-response,error-response,request,rateLimit}.ts`, `server/src/middleware/*` |
| Google sign-in | `server/src/routes/identity.ts`, `server/src/lib/{google-oauth,oauth-state,session,return-path,cookie-domain}.ts` (fuller version with linking/registration in Bookie) |
| Gemini + validation + pool | `server/src/lib/gemini.ts`, `server/src/services/{questionGen,questionPool,phoneAFriend}.ts`, `server/src/jobs/poolRefill.ts` |
| Server-refereed sessions | `server/src/services/{runs,runRules}.ts` |
| Leaderboard SQL (best per user, rank, search) | `server/src/services/leaderboard.ts` |
| Tests | `vitest.config.mts`, `tests/setup/integration.ts`, `tests/integration/*`, `playwright.config.ts`, `tests/e2e/*` |
| Gates, catalogue tools, release tools | `scripts/*.mjs` |
| Deployment | `deployment/*`, `.github/workflows/*`, `docs/DEPLOYMENT.md` |
| Agent docs | `CLAUDE.md`, `src/CLAUDE.md`, `server/CLAUDE.md` (Bookie has per-directory CLAUDE.md files and skills in `.claude/`) |

## 16. Kickoff checklist for a new project

1. Choose ports, name, domain; copy root tooling (§15) and adjust names.
2. Scaffold `server/` skeleton (config, envelope, errors, middleware, health) and the Prisma
   schema; `docker compose up -d`; first migration; seed.
3. Scaffold the web: i18n layer, proxy, root layout, tokens, UI kit, App shell (header, footer,
   effects, toaster, PWA registrar), sitemap/robots/manifest/icons.
4. Build features domain by domain: Prisma model → service (pure parts unit-tested) → route →
   mapper → `src/api/<domain>` → store → components → page with `generateMetadata`.
5. Write `en.json` as you go; translate at the end with parallel agents + `check-messages`.
6. Unit + integration + e2e tests; gates; `pnpm verify`; screenshots at 390 / 768 / 1440 px,
   including an RTL locale.
7. Deployment files, CI/CD, docs (`CLAUDE.md` with a "where things live" table).
