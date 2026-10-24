# Deployment

Push to `master` → GitHub Actions builds → two tarballs land on the server → symlink flip →
`systemctl restart` → health check. Same machinery as Bookie, on the same host.

## Shape

```
  who-wants-to-be-a-millionaire.mnavasardian.com ──► nginx ──► 127.0.0.1:7006  millionaire-web  (Next standalone)
                                                       └────► /_next/static/, /audio/, /packs/  from disk
  api.who-wants-to-be-a-millionaire.mnavasardian.com ──► nginx ──► 127.0.0.1:9006  millionaire-api  (Express)
                                                       └────► /uploads/   from disk
                                                                     │
                                                                     ▼
                                                     127.0.0.1:5006  Postgres (Docker)
```

Two origins, not one. `GOOGLE_REDIRECT_URI` points at the **API** host, because only the API
holds `JWT_SECRET` and so only it can mint `millionaire_session`. `CORS_ORIGIN` names the
**web** origin, and in production its hostname is also the cookie's `Domain`
(`server/src/lib/cookie-domain.ts`), so the cookie the API sets is sent to both hosts.

On-host layout:

```
$APP_DIR/                         /home/michael/apps/millionaire
  web/releases/<sha>/             server.js · .next · public · node_modules
  web/current        -> releases/<sha>
  api/releases/<sha>/             dist · prisma · package.json · node_modules
  api/current        -> releases/<sha>
  shared/uploads/                 avatars — persistent, outside every release
  shared/.env.api                 mode 600, written by the deploy
  db/docker-compose.prod.yml
  db/.env                         POSTGRES_* for the container
```

`WorkingDirectory` in both units points at `current`; systemd resolves the symlink at start,
so `systemctl restart` is what promotes a release.

## One-time server setup

Node 24, pnpm and nginx are already on the host for Bookie; step 2 is only a check.

```bash
# 1. directory tree
sudo -u michael mkdir -p /home/michael/apps/millionaire/{web/releases,api/releases,shared/uploads,db}

# 2. toolchain (already present for Bookie — verify, don't reinstall)
node -v                                    # v24.x
sudo -u michael /home/michael/.local/bin/pnpm --version

# 3. Postgres — its own container, port 5006 (Bookie holds 5004)
sudo -u michael cp deployment/docker-compose.prod.yml /home/michael/apps/millionaire/db/
sudo -u michael cp deployment/db.env.example /home/michael/apps/millionaire/db/.env
openssl rand -hex 32      # paste as POSTGRES_PASSWORD in that file
cd /home/michael/apps/millionaire/db
sudo -u michael docker compose -f docker-compose.prod.yml up -d
# No manual schema work: `prisma migrate deploy` runs on every deploy and creates the
# citext and pg_trgm extensions; the English fallback bank is seeded right after.

# 4. systemd units
sudo cp deployment/millionaire-web.service deployment/millionaire-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable millionaire-web millionaire-api    # do not start yet — no release exists

# 5. let the deploy user restart exactly these two units
sudo tee /etc/sudoers.d/millionaire-deploy >/dev/null <<'SUDOERS'
michael ALL=(root) NOPASSWD: /usr/bin/systemctl restart millionaire-web, /usr/bin/systemctl restart millionaire-api
SUDOERS
sudo visudo -c        # check `which systemctl` — it is /bin/systemctl on some distros

# 6. DNS — two A records to the VPS:
#    who-wants-to-be-a-millionaire.mnavasardian.com
#    api.who-wants-to-be-a-millionaire.mnavasardian.com
#    (and www.who-wants-to-be-a-millionaire… if you want the redirect). If the zone is on
#    Cloudflare, grey-cloud the api record — see Gotchas.

# 7. nginx + TLS
# The API vhost is HTTPS-only and names files under
# /etc/letsencrypt/live/api.who-wants-to-be-a-millionaire.mnavasardian.com/ — enable it only
# after that cert exists, or `nginx -t` fails.
sudo cp deployment/who-wants-to-be-a-millionaire.mnavasardian.com.conf \
        deployment/api.who-wants-to-be-a-millionaire.mnavasardian.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/who-wants-to-be-a-millionaire.mnavasardian.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d who-wants-to-be-a-millionaire.mnavasardian.com -d www.who-wants-to-be-a-millionaire.mnavasardian.com
# The API conf has no :80 block, so use certonly with the webroot the :80 vhosts serve.
sudo certbot certonly --webroot -w /var/www/html -d api.who-wants-to-be-a-millionaire.mnavasardian.com
sudo ln -s /etc/nginx/sites-available/api.who-wants-to-be-a-millionaire.mnavasardian.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. CI's SSH key — reuse Bookie's deploy key or add a new one to
#    /home/michael/.ssh/authorized_keys

# 9. verify — as michael, NOT root
sudo -u michael bash deployment/preflight.sh /home/michael/apps/millionaire
```

`preflight.sh` changes nothing. It checks Node and pnpm the way the deploy reaches them, the
directory tree and that `shared/uploads` is writable, that Postgres is up, reachable as the
configured role and published on loopback only, both units installed and enabled,
passwordless `systemctl restart`, `nginx -t`, and that 7006/9006/5006 are free or held by
these units. Fix everything it reports before the first deploy.

The first deploy creates the release directories, migrates, seeds the fallback bank and
starts both services.

## Google OAuth and Gemini

- **Google:** Google Cloud console → APIs & Services → Credentials → OAuth client ID (Web).
  Authorized redirect URI:
  `https://api.who-wants-to-be-a-millionaire.mnavasardian.com/identity/google/callback`.
  No JavaScript origins are needed — the browser never talks to Google directly. Publish the
  consent screen before real users arrive.
- **Gemini:** a key from https://aistudio.google.com/apikey into `GEMINI_KEY`. The free tier
  is enough: generated questions are pooled and reused, and `POOL_REFILL_MAX_CALLS` caps the
  background top-up.
- **Mail engine** (contact form): the engine bookie uses. `MAIL_API_URL`, `MAIL_API_KEY`,
  `MAIL_APP_ID="millionaire"`. Messages go to the engine's internal inbox; nothing is stored.
  Without a key the contact form answers 503 in production.

## GitHub configuration

**Secrets** (Settings → Secrets and variables → Actions):

| Name                   | Value                                                         |
| ---------------------- | ------------------------------------------------------------- |
| `SSH_HOST`             | server hostname or IP                                         |
| `SSH_USER`             | `michael`                                                     |
| `SSH_KEY`              | private half of the deploy key (full PEM)                     |
| `SSH_PORT`             | optional, defaults to 22                                      |
| `APP_DIR`              | `/home/michael/apps/millionaire`                              |
| `ENV_API_BASE64`       | see below                                                     |
| `NEXT_PUBLIC_API_URL`  | `https://api.who-wants-to-be-a-millionaire.mnavasardian.com`  |
| `NEXT_PUBLIC_SITE_URL` | `https://who-wants-to-be-a-millionaire.mnavasardian.com`      |

Optional, inlined at build time (Secrets or Variables; empty turns the feature off):
`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`,
and for source maps `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.

The `NEXT_PUBLIC_*` values are inlined into the browser bundle, so they are public by
construction. The workflow reads `secrets.*` first, then `vars.*` — different stores, a value
in one is invisible to the other. Deploy fails closed if either origin is missing, loopback or
`http://`.

`ENV_API_BASE64` holds group A of `server/.env.example`: `DATABASE_URL`, `JWT_SECRET`,
`CORS_ORIGIN`, `GEMINI_KEY`, `GOOGLE_*`, `MAIL_API_URL`, `MAIL_API_KEY`, `MAIL_APP_ID`, optionally
`VERIFY_QUESTIONS`, `POOL_REFILL_*`, `SENTRY_DSN_API`. Do **not** put `NODE_ENV`, `PORT`, `HOST` or `UPLOAD_DIR` in it: the deploy
strips and rewrites those four so they cannot drift from the units.

```bash
# server/.env.production.local, then:
pnpm env:base64 production              # base64 on stdout, key names (never values) on stderr
pnpm env:base64 production | clip       # Windows
```

Three values must match character for character:

|                       | must equal                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `CORS_ORIGIN`         | `NEXT_PUBLIC_SITE_URL` — `requireSameOrigin` compares them; its hostname is the cookie Domain |
| `GOOGLE_REDIRECT_URI` | the Authorized redirect URI on the Google client, on the `api.` host                         |
| `DATABASE_URL`        | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` in `$APP_DIR/db/.env`, port 5006       |

## The workflows

|              |                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`     | PR → master. Postgres service container; typecheck · typecheck:server · gates · lint · catalogues · unit · integration · build · build:api.              |
| `deploy.yml` | Push to `master` (or **Run workflow**). `changes` picks the sides, `verify` runs the non-build gates, `build-web` and `build-api` in parallel, `deploy`. |

The API deploys **first**: server-rendered pages and ISR call it, so the schema and API must
be new before new pages serve. API side: `pnpm install --prod --frozen-lockfile` →
`prisma generate` → `prisma migrate deploy` → `node dist/prisma/seed.js` (idempotent English
bank) → restart → poll `/health`. Web side: extract, flip the symlink, restart, poll `/en`
(never `/`, which is a 307).

The web bundle is booted in CI before it ships (standalone output can miss traced files), and
the API ships as a standalone package with pinned dependencies (`scripts/build-api-release.mjs`)
— both for the reasons documented in Bookie's `docs/DEPLOYMENT.md`.

## Ports

| Port | What     | Declared in                                                                                                        |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| 7006 | Next     | `millionaire-web.service`, `who-wants-to-be-a-millionaire.mnavasardian.com.conf`, `deploy.yml` (`WEB_PORT`)        |
| 9006 | Express  | deploy's env file (`PORT`), `millionaire-web.service` (`API_INTERNAL_URL`), API `.conf`, `deploy.yml` (`API_PORT`) |
| 5006 | Postgres | `docker-compose.prod.yml`, `DATABASE_URL` inside `ENV_API_BASE64`                                                  |

Bookie holds 7004/9004/5004 and hangman 7005 on the same host. Changing a port means editing
every row above — grep for the old number afterwards.

## Operations

```bash
journalctl -u millionaire-web -f
journalctl -u millionaire-api -f
systemctl status millionaire-web millionaire-api

# rollback — migrations do NOT roll back
ls -t /home/michael/apps/millionaire/web/releases
ln -sfn /home/michael/apps/millionaire/web/releases/<sha> /home/michael/apps/millionaire/web/current
sudo systemctl restart millionaire-web                     # same shape for api

# question pool health
docker exec millionaire-postgres-prod psql -U millionaire -d millionaire \
  -c 'select locale, level, count(*) from "Question" where "retiredAt" is null group by 1,2 order by 1,2;'
```

After the first deploy, submit `https://who-wants-to-be-a-millionaire.mnavasardian.com/sitemap.xml`
in Google Search Console (1350 URLs, every page × 50 locales with hreflang).

## Gotchas

- **Cloudflare Universal SSL does not cover `api.who-wants-to-be-a-millionaire.mnavasardian.com`**
  (two labels under the zone; the free cert covers one). Grey-cloud that record and let origin
  nginx terminate TLS, as these templates assume — the same fix as Bookie's API host.
- **Changing `NEXT_PUBLIC_*` requires a rebuild** — they are inlined.
- **Never add `proxy_cache`** to the web host, **never strip `Origin`/`Referer`** on the API
  host, **one API process only** — see `deployment/CLAUDE.md`.
- **ISR writes into the release's `.next/cache`**, which is why `ReadWritePaths` covers `web/`.
  A deploy starts with a fresh cache: the first visit to each page after a deploy renders it.
- **`shared/uploads` is state** — back it up with the database.
