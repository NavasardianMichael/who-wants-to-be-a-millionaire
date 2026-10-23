# Deployment — invariants

Host-side configuration templates. Procedure, server setup and the secrets table live in
[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md); this file holds the rules that must not break.

```
deployment/
  who-wants-to-be-a-millionaire.mnavasardian.com.conf      nginx, web host -> 127.0.0.1:7006
  api.who-wants-to-be-a-millionaire.mnavasardian.com.conf  nginx, API host -> 127.0.0.1:9006
  millionaire-web.service   systemd, Next standalone
  millionaire-api.service   systemd, Express
  docker-compose.prod.yml   production Postgres, loopback-bound on 5006
  db.env.example            POSTGRES_* for that container, copied to $APP_DIR/db/.env
  preflight.sh              read-only readiness check, run on the host before deploying
```

**These are templates, not live config.** Nothing deploys them — they are copied to the
server by hand. Paths assume `APP_DIR=/home/michael/apps/millionaire`. When you change one
here, say so in the PR: someone has to re-copy it.

## Rules

- **The release symlink is the deploy mechanism.** Both units set `WorkingDirectory` to
  `…/current`; `systemctl restart` is what promotes a release. Never point a unit at a
  concrete `releases/<sha>` path.
- **Never add `proxy_cache` to the web host.** `src/proxy.ts` answers unprefixed requests
  with personalised 307s (`Vary: Accept-Language, Cookie`, `no-store`). Pages are already
  cached inside Next (ISR).
- **`/sw.js` is never cached** anywhere — a stale worker pins old pages on every installed copy.
- **Never clear or rewrite `Origin`/`Referer` on the API host** — `requireSameOrigin` rejects
  state-changing requests without them in production.
- **`proxy_buffering off` on the web host is load-bearing** — Next streams RSC payloads.
- **`/_next/static/`, `/audio/`, `/packs/` and `/uploads/` are served from disk; `/_next/image`
  is not** — it is the optimizer and must reach Node.
- **Two origins, deliberately.** `CORS_ORIGIN`, `GOOGLE_REDIRECT_URI` (API host) and the
  session cookie's `Domain` (web host) all depend on it.
- **`shared/uploads` and `shared/.env.api` live outside the releases** — rotation deletes
  everything under `releases/`.
- **One API process.** Rate limits, the Gemini model cooldowns and the in-flight generation
  map are in-memory and per-process; `trust proxy` = 1 assumes exactly one hop.
- **Ports 7006 / 9006 / 5006** sit beside bookie (7004/9004/5004) and hangman (7005) on the
  same host. Changing one means editing every file listed in docs/DEPLOYMENT.md "Ports".
