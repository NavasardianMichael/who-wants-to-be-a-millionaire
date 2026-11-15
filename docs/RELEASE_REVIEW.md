# Review — 2026-11-15: what to bring over from guests

Guests had a whole-app pre-release review (`guests/docs/RELEASE_REVIEW.md`, commits `459761f` and
`8a717d0`), and it took in fixes from crossword's and CV Builder's reviews too. This is the part of
it that fits Millionaire, checked against the code at `fca0709`. Nothing here is implemented yet.

Millionaire has no payments, PDFs or autosave, so most of guests' list does not apply. What does
apply is the shared stack: the deploy script, the API's config and rate limits, the shutdown, and
the health check. Analytics consent applies too. Each item is small and copies code guests
already has.

**Size:** S = under an hour, M = a few hours.

## Status (2026-11-15)

All nine items are implemented. The [manual steps](#manual-steps-once-implemented) at the end
are what is left: the server, GitHub and Google Cloud.

- **1** — `readJwtSecret` (`server/src/config.ts`); `pnpm env:base64` warns about a short or
  placeholder secret.
- **2** — `friendCallAllowed` (`lib/generationBudget.ts`, `AI_FRIEND_CALLS_PER_DAY`, default
  2,000), checked in `callFriend`.
- **3** — `clientAddress` and `isLoopback` (`lib/request.ts`) in every limiter; the per-address
  login limit; the app-wide `addressLimit` (`middleware/rateLimit.ts`, 1,200 a minute, loopback
  exempt).
- **4** — `deploy.yml`: side directory on a re-run, rollback on a failed health poll, a dump
  before migrating, a 0600 env copy removed by `trap`, the env file read literally.
- **5, 6** — `/health` runs `SELECT 1`; SIGTERM drains for up to 25 s (`server/src/index.ts`).
- **7** — `src/constants/consent.ts`, `src/helpers/consent.ts`, `components/consent/`, the
  footer's "Cookie settings", and the privacy text (dated 2026-11-15). Analytics only: the ad_*
  signals stay with AdSense's own message.
  - **One question, never two at once.** On a page that loads the ad code, our banner waits for
    Google's message (`followGoogleConsent`, called by `AutoAds`). The answer given there to IAB
    TCF Purpose 1 (storing information on the device) becomes the analytics answer. Where TCF does
    not apply, or Google's message never loads (an ad blocker), ours asks after 10 s.
- **429 copy** — `Errors.rateLimited` now says the server is busy ("The server is busy right now.
  Please try again a little later."), not that the player is going too fast.
- **Translations** of the new and changed copy (`Consent.*`, `Legal.privacyAnalyticsBody`,
  `Errors.rateLimited`) were written by hand, not by `i18n:sync`. Each follows its catalogue's
  existing address form; a few catalogues (be, bg, ca, cs, el, cy, et, hr, hu, it, ka, lt, lv, mk,
  ro, sk, sl, sq, sr, uk) still use the familiar "you" throughout, against the polite-address
  rule — a whole-catalogue pass, separate from this. Least certain, worth a native reader:
  om, so, su, yo, zu, ig, my, ps.
- **8** — HSTS on the three HTTPS blocks, gzip on the API host, `nosniff` and CORS `maxAge` in
  Express.
- **9** — `MemoryHigh=512M`, `MemoryMax=768M` on `millionaire-api.service`.

Tests: `clientAddress`, `isLoopback` and the daily cap (`tests/unit/server/`), and consent by
region (`tests/unit/consent/`).

## P0 — do first

### 1. The session secret has a public fallback — S
- **Where:** `server/src/config.ts:33`. `jwtSecret` falls back to `'dev-secret-change-me'`.
- **Risk:** if `JWT_SECRET` is ever missing from `ENV_API_BASE64`, production quietly signs
  sessions with a secret that is in the repo. Anyone could then forge a session for any player.
- **Fix:** guests' `readJwtSecret`. In production the API refuses to start when the secret is
  missing, under 32 characters, or the dev default. `pnpm env:base64` warns about the same
  things.

### 2. Phone-a-Friend has no cost ceiling — S
- **Where:** `server/src/routes/lifelines.ts:18`. It needs no account, makes one AI call per
  request (`services/phoneAFriend.ts:80`), and allows 10 a minute per IP address.
- **Risk:** a script can call it about 14,000 times a day from one address, or without limit by
  rotating through an IPv6 /64 (item 3). Each call is a paid Gemini request, and it draws on the
  same key and quota that question generation needs.
- **Fix:**
  - A process-wide daily cap on AI calls inside `callFriend`, for example 2,000. Past it the
    friend answers from the template, which is already the fallback when the model fails, so
    players see nothing wrong.
  - Item 3 for the per-address key.
  - Manual: a budget cap on the Gemini key (below).

### 3. Rate limits key on the raw IP — S
- **Where:**
  - The app-wide limit, which covers every API request: nginx `limit_req` at 20/s per address,
    bursts of 100 (`api.who-wants-to-be-a-millionaire.eapps.site.conf:22`, `:62`).
  - The per-route limits:
    - `server/src/middleware/rateLimit.ts:13`
    - `server/src/routes/identity.ts:64, 103, 136, 157, 178, 219`
    - `server/src/routes/contact.ts:50`
    - `server/src/routes/questions.ts:47, 110`
- **Risk:** nginx listens on IPv6. One phone or household gets a whole /64 (2⁶⁴ addresses) and
  can rotate through it. Then no limit holds, including the app-wide one, since nginx keys it
  on the full address.
- **Fix:**
  - Guests' `clientAddress` (`server/src/lib/request.ts`) reduces IPv6 to its /64 and an
    IPv4-mapped address to plain IPv4. Use it everywhere `req.ip` is used, and port its unit
    test.
  - Repeat the app-wide limit once in Express: one `app.use` before every router in `app.ts`,
    keyed on `clientAddress`, with the same budget as nginx (about 1,200 a minute). nginx cannot
    group IPv6 by /64 on its own, so this is where a rotating /64 meets the limit. Keep nginx's
    limit too: it stops a flood before it reaches Node.
    (Guests, crossword and cv-builder have no app-wide limit; this one is Millionaire's own.)
  - Add guests' plain per-address login limit (40 per 15 min). Login is limited per address
    *and email* (`identity.ts:103`), so changing the email gives unlimited argon2 runs, at
    64 MiB each.

### 4. The deploy can take the site down, and nothing is dumped before a migration — M
All in `.github/workflows/deploy.yml`, copied from guests' version of the same script:

- **Re-run deletes the live release** (`:459`, `:541`). `rm -rf "$NEW"` removes the directory
  `current` points to when the same commit is deployed again (a re-run, or `workflow_dispatch`).
  - Fix: install into a side directory when it is already live.
- **No rollback** (`:533-535`, `:543-546`). The symlink switches before the health check, so a
  release that fails to start stays live.
  - Fix: remember the previous release, and switch back to it if the health wait fails.
- **No dump before migrating** (`:525`, `:531`). Migrations and the seed's retirements change the
  live database, and neither can be undone.
  - Fix: a `pg_dump` into `$APP_DIR/backups` before `migrate deploy`, keeping the last 5 (about
    3 MB each).
  - Then drop the "run the script by hand before a migration" step from `DRIVE_BACKUP.md`.
- **Secrets file** (`:330`, `:556`). `/tmp/env.api` is written with the default umask, and it
  is removed only when the whole script succeeds.
  - Fix: `umask 077`, plus `trap … EXIT` to remove it however the script ends.
- **The env file is run as shell code** (`:523`, `set -a; . file`). A `$` or `&` in a value
  expands or runs in the background, and `DATABASE_URL` then arrives empty or wrong.
  - Fix: read the file line by line, the way systemd reads it (guests' loop).

## P1 — soon

### 5. `/health` passes with the database down — S
- **Where:** `server/src/app.ts:38`.
- **Why now:** item 4's rollback and the uptime monitor (manual step 4) both rely on it.
- **Fix:** run `SELECT 1` and answer 503 when it fails, as guests does.

### 6. No graceful shutdown — S
- **Where:** `server/src/index.ts`. Every deploy's restart cuts requests that are mid-flight:
  answers in a ranked run, a sign-in, an avatar upload.
- **Fix:** guests' handler. On SIGTERM: `server.close()`, wait up to 25 s (systemd's
  `TimeoutStopSec` is 30), then `prisma.$disconnect()`. A pool refill caught in the middle is
  simply lost; the next run refills it.

### 7. Google Analytics runs without consent in the EU — M
- **Where:** `src/constants/analytics.ts`. GA4 loads on every page, with cookies, in every
  country.
- **The privacy page doesn't match:** `Legal.privacyAnalyticsBody` promises "privacy-friendly
  analytics".
- **Fix:** guests' consent (`constants/consent.ts`, `helpers/consent.ts`, `ConsentBanner`,
  `ConsentSettingsLink`, Consent Mode v2 defaults).
  - The banner shows only in the EU/EEA, UK and Switzerland, detected by the device's time zone.
    Elsewhere GA runs from the first page, as now.
  - Closing the banner counts as accepting.
  - "Cookie settings" goes in the footer, and the privacy text is updated.
- **Decide before implementing:**
  - **A second prompt on ad pages.** On EU content pages, AdSense already shows Google's own
    consent message (`ADSENSE_SETUP.md` §6), so those pages would show two prompts. Guests has
    no ads, so this case is new. Recommendation: accept the two prompts. They ask about
    different things, and it keeps the code the same as guests'.
  - **Translations.** The new strings and the privacy text go into `en.json`, then
    `pnpm i18n:sync` fills them into the 79 other languages, which spends Gemini. Ask first.

## P2 — hardening

### 8. Headers and compression — S (nginx needs a manual re-paste)
- **HSTS:** no host sends it, so a first visit over `http://` (a typed address, an old link) can
  be intercepted on a hostile network before the redirect to HTTPS.
  - Add guests' line to all three HTTPS server blocks: the site
    (`who-wants-to-be-a-millionaire.eapps.site.conf:49`), `www` (`:36`) and the API
    (`api.…conf:35`):
    `add_header Strict-Transport-Security "max-age=31536000" always;`
  - No `includeSubDomains` and no `preload`, as in guests: other apps share `eapps.site`, and a
    preload is very hard to undo.
- **Uncompressed API responses:** the API host has no `gzip`; the web host has it
  (`who-wants-to-be-a-millionaire.eapps.site.conf:114`). Add the same block on the API host, so
  question batches and leaderboards go out compressed.
- **Express (`app.ts:28`):**
  - `X-Content-Type-Options: nosniff`.
  - `cors({ …, maxAge: 7200 })`, so the browser stops sending a preflight before every answer
    in a ranked run.

### 9. The API has no memory cap — S
- **Where:** `deployment/millionaire-api.service` sets no `MemoryHigh` or `MemoryMax`, and this
  host runs four apps. A login flood (item 3) or a leak can starve the others.
- **Fix:** check what it uses first (`systemctl status millionaire-api`), then set a limit with
  room to spare, as cv-builder does (`MemoryHigh=512M`, `MemoryMax=768M`). Manual re-copy of the
  unit.

## Not brought over, on purpose

- **Payments, the PDF queue, autosave, two-tab conflicts, photo import:** Millionaire has none
  of them.
- **The seed's local-only guard:** guests' seed creates dev accounts. Millionaire's seed is the
  question bank, and production runs it on every deploy, by design.
- **`returnTo` cleaning:** `isAllowedReturnPath` already refuses everything guests' version cleans.
- **The deploy's "Check configuration" job** (guests' `check-deploy-config.mjs`, 170 lines):
  - The web build already refuses empty or loopback origins, and `pnpm env:base64` checks the
    required keys.
  - Item 1 makes the API refuse a weak secret at boot.
  - The rest isn't worth a new job here.
- **A CSP:** AdSense loads scripts and frames from many Google hosts. A policy strict enough to
  matter would break ads, and `X-Frame-Options: DENY` already covers framing.
- **Sentry on the API:** guests didn't add it either. Errors stay in journald, and the uptime
  monitor covers "the API is down".
- **Pinning the SSH host key:** this already uses `ssh-keyscan`, as every app does.

## Suggested order

One commit each:

1. **API safety:** items 1, 2, 3, 5 and 6, plus the `app.ts` part of item 8.
   - `server/` only, with unit tests for `clientAddress` and the daily cap.
   - `pnpm verify`.
2. **Deploy:** item 4.
3. **Consent:** item 7, after the two decisions above.
4. **Host files:** nginx (item 8) and the systemd unit (item 9), with manual re-copy steps.

## Manual steps (once implemented)

**[PC]** your machine · **[GH]** GitHub → Settings · **[SRV]** the server, as `michael` · **[EXT]** a
third-party console · **[WEB]** a browser.

1. **Before pushing commit 1** **[PC]**: check that `JWT_SECRET` in
   `server/.env.production.local` is at least 32 random characters. If not:
   - Set it to the output of `openssl rand -hex 64`.
   - Run `pnpm env:base64 production | clip`, and paste the result into **[GH]**
     `ENV_API_BASE64`.
   - Everyone is signed out once.
2. **Cap the Gemini spend** **[EXT]** (Gemini is the only AI provider in use,
   `server/src/lib/ai/index.ts:12`):
   - Google Cloud → the project of `GEMINI_API_KEY` → Billing → Budgets & alerts. For example,
     10 USD a month, with alerts at 50/90/100%.
   - APIs & Services → Generative Language API → Quotas: lower the daily request limit to what
     question generation needs.
3. **After the deploy is green: nginx (HSTS on all three HTTPS blocks, gzip on the API)** **[SRV]**.
   nginx reads its own copies, not the repo, so nothing changes until they are replaced. For each
   file, empty it, paste the repo file into it, save (Ctrl+O, Enter, Ctrl+X):
   ```bash
   sudo truncate -s 0 /etc/nginx/sites-available/who-wants-to-be-a-millionaire.eapps.site.conf
   sudo nano /etc/nginx/sites-available/who-wants-to-be-a-millionaire.eapps.site.conf       # paste deployment/who-wants-to-be-a-millionaire.eapps.site.conf
   sudo truncate -s 0 /etc/nginx/sites-available/api.who-wants-to-be-a-millionaire.eapps.site.conf
   sudo nano /etc/nginx/sites-available/api.who-wants-to-be-a-millionaire.eapps.site.conf   # paste deployment/api.who-wants-to-be-a-millionaire.eapps.site.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```
   If `nginx -t` reports an error, don't reload: the old config keeps serving. Fix the paste first.
   Then check from **[PC]** (PowerShell); each of the first three prints
   `Strict-Transport-Security: max-age=31536000`, and the last prints `content-encoding: gzip`:
   ```powershell
   curl.exe -sI https://who-wants-to-be-a-millionaire.eapps.site/en | findstr /i strict
   curl.exe -sI https://www.who-wants-to-be-a-millionaire.eapps.site/ | findstr /i strict
   curl.exe -sI https://api.who-wants-to-be-a-millionaire.eapps.site/health | findstr /i strict
   curl.exe -s -D - -o NUL -H "Accept-Encoding: gzip" https://api.who-wants-to-be-a-millionaire.eapps.site/questions/packs/en | findstr /i content-encoding
   ```
   HSTS is a one-year promise to every browser that sees it: the site must stay HTTPS-only. To
   take it back, change the line to `max-age=0` and reload; browsers forget it on their next visit.
4. **The API's memory cap** **[SRV]**, same way:
   ```bash
   sudo truncate -s 0 /etc/systemd/system/millionaire-api.service
   sudo nano /etc/systemd/system/millionaire-api.service    # paste deployment/millionaire-api.service
   sudo systemctl daemon-reload && sudo systemctl restart millionaire-api
   systemctl status millionaire-api --no-pager | head -12   # "active (running)", and a Memory: line with "high: 512M max: 768M"
   ```
5. **Uptime alerts** **[EXT]**: UptimeRobot, two HTTP(s) monitors, every 5 minutes:
   - `https://api.who-wants-to-be-a-millionaire.eapps.site/health`, with the keyword `"status":"ok"`
   - `https://who-wants-to-be-a-millionaire.eapps.site/en`
6. **Consent check** **[WEB]**, after commit 3:
   - From Armenia, a private window shows no banner and sets `_ga*` cookies.
   - Set DevTools → Sensors → Location to Berlin, then reload in a fresh private window:
     - **A game page** (`/en/play`, no ad code): our banner shows, and there are no `_ga*`
       cookies until you accept.
     - **An ad page** (`/en`): Google's message shows, and ours does not. Answer Google's; ours
       must not appear afterwards, and `_ga*` cookies follow that answer. Google's message decides
       by the visitor's IP, not the time zone, so from Armenia it may not show at all; then ours
       shows after about 10 seconds instead.
