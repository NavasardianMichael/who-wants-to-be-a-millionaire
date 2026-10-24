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
  one reader: `GEMINI_KEY` → `lib/gemini.ts`, Google secret → `lib/google-oauth.ts`,
  `MAIL_API_KEY` → `lib/mail.ts` (contact form only; nothing is stored).
- **Security:** `requireSameOrigin` on every write, `optionalAuth` globally, `requireAuth` on
  private routers, per-route `rateLimit`, `trust proxy` = 1 (nginx).
- **Gemini:** call through `generateJson` (model chain + cooldowns). Code decides outcomes
  (who is right, which option a friend names); the model only writes words, and every
  answer is validated before it is stored or shown.
- **Pool:** generated questions are kept (`Question`, unique per locale + hash). Serving draws
  least-served first; generation happens only for a short bucket; the English seed is last.
- **Ranked runs:** the run row is the referee, for users and guests alike (`RunOwner`: a
  `userId`, or a `guestId` from the `millionaire_guest` cookie). Leaderboard SQL counts only
  runs with a user. `services/runRules.ts` is pure and unit-tested;
  never put `correctIndex` in a `RunView`.
- **Jobs** start in `index.ts` only (`poolRefill`, `runSweeper`), never in `createApp`, so tests
  never poll.
- **Imports** are ESM with explicit `.js` extensions.
