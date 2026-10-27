# Millionaire Quiz

A "Who Wants to Be a Millionaire?"-style quiz game in 80 languages. A Next.js App Router PWA
and an Express/Prisma API in `server/`, in one pnpm workspace. Questions are written by
Gemini natively per language and pooled in Postgres; a curated English bank is the fallback.

**Stack:** Next.js 16 (App Router, `src/proxy.ts`) · React 19 · TypeScript 6 · Ant Design 6 +
Tailwind 4 (one token chain) · Zustand + immer · next-intl 4 · motion · idb · pnpm · Express 5 · Prisma 6 ·
PostgreSQL 16 · `@google/genai` · sharp · Sentry · GA4

## Commands

```bash
pnpm install                  # postinstall: prisma generate, then migrate deploy if Postgres is up (not in CI)
pnpm db:up && pnpm db:setup   # Postgres in Docker (port 5006), migrate + seed the English bank
pnpm dev                      # web :7006 + api :9006
pnpm verify                   # typecheck → typecheck:server → gates → lint → test → build — run before "done"
pnpm test:unit                # fast, no database
pnpm test:integration         # real API against a throwaway millionaire_test database
pnpm test:e2e                 # Playwright, needs `pnpm dev` running
pnpm check:messages           # all 79 catalogues match en.json (keys, placeholders, plurals)
pnpm i18n:sync [locales]      # Gemini-fills keys added to en.json since the last translation
pnpm i18n:formats             # regenerate src/i18n/numberFormats.ts (money/number patterns) from Node's ICU
pnpm export:fallback          # copy the English bank to public/packs/fallback-en.json
pnpm build:api                # server/dist + the deployable out/api release
pnpm env:base64 production | clip   # server/.env.production.local -> the ENV_API_BASE64 secret
```

## Path aliases

Explicit per folder — `@api/*`, `@store/*`, `@hooks/*`, `@interfaces/*`, `@i18n/*`,
`@constants/*`, `@helpers/*`, `@linkedDataSchema/*`, `@components/*`, `@styles/*`,
`@test/*`. **Not** a catch-all `@*`: that swallows scoped packages (`@sentry/nextjs` resolved
to `./src/sentry/...` and broke `next.config.ts`). Import order is enforced; `pnpm lint-fix`
sorts it.

## Where things live

| Looking for | Go to |
|---|---|
| Game rules (ladder, levels, modes, lifelines, badges) | `src/constants/game.ts` ↔ twin `server/src/lib/game.ts` |
| Lifeline maths (50:50, audience, friend's pick) | `src/helpers/game/lifelines.ts` ↔ twin `server/src/lib/lifelines.ts` |
| The game itself (state machine, pacing, sounds) | `src/store/game/session/` · UI in `src/components/game/` |
| Where questions come from (API → pack → bundled bank) | `src/helpers/offline/questionSource.ts`, `src/helpers/game/questionQueue.ts` |
| Question generation, validation, the pool | `server/src/services/questionGen.ts`, `questionPool.ts`, `jobs/poolRefill.ts` |
| Gemini (model chain, cooldowns, the only key reader) | `server/src/lib/gemini.ts` |
| Ranked runs (server-refereed, guests too) | `server/src/services/runs.ts` + pure `runRules.ts` · `server/src/routes/runs.ts` · guest cookie `lib/guest.ts` |
| Leaderboard SQL | `server/src/services/leaderboard.ts` |
| Google sign-in, session cookie | `server/src/routes/identity.ts`, `lib/google-oauth.ts`, `lib/oauth-state.ts`, `lib/session.ts` |
| Avatars | `server/src/routes/profile.ts` (multer → sharp → webp) |
| HTTP calls from the web | `src/api/<domain>/` — `endpoints`, `types`, `processors`, `main` |
| Client state | `src/store/<domain>/<slice>/{store,types}.ts` |
| Locales, routing, metadata, hreflang | `src/i18n/` · catalogues `src/messages/` · culture hints `server/src/lib/locales.ts` |
| Design tokens | `src/styles/tokens.ts` (owner) → `theme.ts` (antd) → `globals.css` §1 mirror + §2 `--ant-*` aliases |
| UI kit (antd wrappers) | `src/components/ui/` (`bare/` and `layout/` render on the server) · provider `src/components/AntdProvider.tsx` · antd locales `src/i18n/antdLocale.ts` |
| SEO: sitemap, robots, JSON-LD, OG | `src/app/sitemap.ts`, `robots.ts`, `src/linkedDataSchema/`, `src/app/*icon*` |
| PWA: manifest, service worker, install | `src/app/manifest.ts`, `src/app/sw.js/route.ts` + `src/helpers/pwa.ts`, `src/components/pwa/` |
| Offline packs (automatic, no UI) and the sync outbox | `src/helpers/offline/` (`ensurePack`) · `src/store/offline/packs/` |
| Contact form (mail engine, nothing stored) | `src/app/[lang]/contact/`, `src/components/contact/` · `server/src/routes/contact.ts`, `lib/mail.ts` |
| Leave-page guard (game, unsaved forms) | `src/hooks/useLeaveGuard.ts` · `src/components/LeaveGuard.tsx` |
| Sound (main theme off-stage, stings pause music) | `src/helpers/audio/audioManager.ts` · `src/components/AmbientMusic.tsx` |
| Deploying | `docs/DEPLOYMENT.md` (how) · `docs/PRODUCTION_SETUP.md` (manual setup, in order) · `deployment/`, `.github/workflows/` |
| Reusing this stack for a new project | `docs/STACK_BLUEPRINT.md` |

Per-layer rules: `src/CLAUDE.md` (web) and `server/CLAUDE.md` (API).

## Working rules

- **Inspect before writing.** Follow the structure of neighbouring files in the same domain.
- **Twin files stay identical** below their marker line — `tests/unit/game/twins.spec.ts`.
- **Named exports declared inline**; default exports only where a framework requires them
  (Next route modules, `src/i18n/request.ts`, config files).
- **Every async operation handles its errors for two audiences**: production shows
  translated copy by error *kind* (`ErrorAlert`, `classifyError`); development adds the
  original message. Never render a server's English message. A deliberate silence goes
  through `reportError`.
- **Every user-visible string** is in `src/messages/en.json`, then synced to the 79 other
  catalogues (`pnpm i18n:sync`, then `pnpm check:messages`).
- **No hex outside the token files, no `dark:`, no bare antd `Modal`/`Drawer`, no `var(--ant-*)`
  outside globals.css §2** — `pnpm gates` enforces it.
- **Server-render what crawlers should see.** Client components are islands; pages fetch on
  the server through `src/helpers/serverData.ts`, which degrades to empty when the API is down.
- Comment only where the purpose is not obvious from the code.

## Easy to get wrong

- `src/proxy.ts` is Next 16's middleware. Unprefixed URLs 307 to a negotiated locale.
- **Static rendering hinges on `src/i18n/request.ts`:** the locale comes from `lang()`
  (`next/root-params`), and `requestLocale` must never be destructured in the parameter list —
  it is a getter that calls `headers()`, which silently turns every page dynamic. No
  `setRequestLocale` (deprecated). `.next/prerender-manifest.json` must list 2489 routes.
- `useSearchParams` needs a `<Suspense>` boundary, or every static page falls back to
  client rendering — prefer reading `window.location` in an event handler.
- **No mode needs an account.** Marathon and Time Attack are always ranked and refereed by
  the server; a guest's run is tied to an httpOnly guest cookie and never reaches the
  leaderboard. Only Classic has custom settings (Settings page) and plays offline.
- Ranked runs never send `correctIndex` before the answer; the display order of options is
  per-serve (`Run.currentOrder`). Don't add an answer to `RunView`. Ranked questions come
  from the ranked reserve (`Question.ranked`), which Classic batches and offline packs never
  serve — otherwise their answers could be downloaded before a run.
- Integration tests only ever touch `millionaire_test` (guarded in `tests/setup/integration.ts`).
  Never run `prisma migrate reset` against the dev database.
- **The API's env file is picked by `NODE_ENV`:** `server/.env.<NODE_ENV>.local`, `development`
  when unset (`server/src/load-env.ts`, shared by `prisma.config.ts` and the seed). There is no
  `server/.env`.
