# Millionaire Quiz

The quiz-show game — fifteen questions to the million — rebuilt as a multilingual
progressive web app.

- **Three modes:** Classic (the ladder, two safe havens, walk away), Marathon (endless, one
  mistake ends it) and Time Attack (180 seconds, wrong answers cost time).
- **Four lifelines:** 50:50, Ask the Audience, Phone a Friend (an AI friend who is right about
  as often as a real one), and Switch the Question.
- **80 languages**, every page server-rendered and indexed under its own URL
  (`/en/play`, `/hy/play`, `/ja/play` …) with hreflang alternates and a sitemap.
- **Questions written by Gemini natively in each language**, mixing world knowledge with the
  culture of the people who speak it. They are pooled, validated and reused; a curated English
  bank is the fallback.
- **Global leaderboards** for Marathon and Time Attack, refereed by the server, filterable by
  language and searchable by name. Google sign-in, uploadable avatars, 20 badges.
- **Offline-first:** installable; the current language's questions are saved automatically, so Classic plays offline; results synced when the
  connection returns.

## Run it locally

Requirements: Node 24, pnpm 10, Docker.

```bash
pnpm install
cp server/.env.example server/.env      # add GEMINI_KEY (free at aistudio.google.com/apikey)
pnpm db:up && pnpm db:setup             # Postgres on :5006, migrations, English fallback bank
pnpm dev                                # web http://localhost:7006 · API http://localhost:9006
```

Without a `GEMINI_KEY` everything works on the English bank. Without Google OAuth credentials
sign-in is unavailable and every run is a guest run (refereed, but off the leaderboard).

## Verify

```bash
pnpm verify        # typecheck (web + API), grep gates, lint, unit + integration tests, build
pnpm test:e2e      # Playwright on desktop, tablet and phone viewports (needs `pnpm dev`)
```

## Learn the codebase

- [`CLAUDE.md`](CLAUDE.md) — commands, where things live, working rules.
- [`src/CLAUDE.md`](src/CLAUDE.md) and [`server/CLAUDE.md`](server/CLAUDE.md) — per-layer invariants.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production setup.
- [`docs/STACK_BLUEPRINT.md`](docs/STACK_BLUEPRINT.md) — how to build a new project on this stack.

Millionaire Quiz is a fan-made game and is not affiliated with any television programme or
rights holder. The sounds in `public/audio/` were carried over from the project's earlier version.
