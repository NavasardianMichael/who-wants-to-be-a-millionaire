# API — invariants

- **Layers:** `routes/*` (HTTP, validation, mounted only in `app.ts`) → `services/*` (logic,
  pure where possible) → `lib/*` (shared utilities) → Prisma. `mappers/entities.ts` shapes rows
  for the web app.
- **Envelope:** every response is `ok(res, value)` / `fail(res, message, code, status)`.
  Throw `HttpError` for expected failures; anything else is mapped by `lib/error-response.ts`
  (generic in production, detailed in development).
- **Validation:** no schema library; read bodies with `lib/request.ts` helpers and the `is*`
  guards in `lib/game.ts` / `lib/locales.ts`.
- **Config:** every `process.env` read lives in `config.ts` (a gate enforces it). Each secret has
  one reader: `OPENROUTER_KEY` → `lib/ai/openrouter.ts`, `GEMINI_KEY` → `lib/ai/gemini.ts`, Google secret → `lib/google-oauth.ts`,
  `MAIL_API_KEY` → `lib/mail.ts` (contact form to us; account emails to the player, written
  from the web's `Email.*` catalogue keys by `lib/account-mail.ts`).
- **Security:** `requireSameOrigin` on every write, `optionalAuth` globally, `requireAuth` on
  private routers, per-route `rateLimit`, `trust proxy` = 1 (nginx).
- **AI:** call through `generateJson` from `lib/ai/index.ts`, never a provider directly; the
  provider is one line there. Schemas are plain JSON Schema (`JsonSchema`), the model chain
  is picked by `role` (`writer` / `checker` / `reply`), each provider keeps its own cooldowns. Code decides outcomes
  (who is right, which option a friend names); the model only writes words, and every
  answer is validated before it is stored or shown. A batch a player request starts is charged
  to `lib/generationBudget.ts` (per player and server-wide, per hour): pass the requester to
  `generateIntoPool`, never call it bare from a request path, or a script can buy batches at will.
- **Pool:** generated questions are kept (`Question`, unique per locale + hash). Serving draws
  least-served first; generation happens only for a short bucket; the English seed is last.
  `Question.ranked` marks the **ranked reserve**: only `getRunQuestion` draws from it, and no
  endpoint that returns `correctIndex` (batch, packs, samples) may ever include it.
- **Ranked runs:** the run row is the referee. `/runs` is behind `requireAuth` — Marathon and
  Time Attack need an account, so every run has a `userId`. Leaderboard SQL skips runs
  flagged `usedPublicQuestions` (the reserve ran dry).
  `services/runRules.ts` is pure and unit-tested; never put `correctIndex` in a `RunView`.
  Every run write goes through `writeRun` (optimistic `version` check), so racing requests
  cannot use a lifeline twice or answer one question twice.
- **Questions cross from ranked to Classic only** (`rankedGraduation`: well-served, the reserve
  keeps a minimum, never one on screen). Nothing may ever set `ranked = true` on a question
  that was public — its answer has been downloadable.
- **Jobs** start in `index.ts` only (`poolRefill`, `runSweeper`, `questionCleanup`, `rankedGraduation`), never in
  `createApp`, so tests never poll.
- **Reported questions:** after three reports an AI question is deleted, not kept; one a
  ranked run has on screen is only retired until `questionCleanup` deletes it.
- **Imports** are ESM with explicit `.js` extensions.
