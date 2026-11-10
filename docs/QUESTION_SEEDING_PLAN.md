# Question seeding plan: phases and language order

What gets seeded next, in which order, and why. The process (writers, review, commit) is in
[QUESTION_SEEDING.md](QUESTION_SEEDING.md). Written for the owner and for the Claude session
that continues the work, on any machine: everything needed is in this file and the repo.

**The files are the source of truth for progress.** A language is done for a phase when its
file exists (ranked) or reaches the phase's level targets (Classic), and the checker passes.

## Why seed at all, and where

Gemini is called only when a player has no unseen question left at a level
(`getQuestionBatch`, `getRunQuestion` in `server/src/services/questionPool.ts`). Each call writes
8 questions into a pool every later player of that language shares. So the spend follows the
**most dedicated player of each language, level by level**, and a hand-written question saves
Gemini only where players will actually run out. Seed where play is, at the levels it reaches.

- **Classic** draws from the public pool. Many busy languages already have deep AI pools
  (French ~350 a level, Romanian ~150, German, Mongolian, Czech, Slovenian, Vietnamese,
  Portuguese 70–110), so more Classic seed saves little there.
- **Ranked** (Marathon, Time Attack) draws only from the ranked reserve, which was AI-only and is
  small everywhere (at most 186 questions in a language, all levels together). A run uses ~20
  questions and never repeats one from the player's earlier runs, so this is where Gemini keeps
  being called. Ranked is seeded first.

## Phases

| Phase | File | Level 1 / 2 / 3 / 4 / 5 | Status |
|---|---|---|---|
| 1 | `seed/classic/<code>.json` | 10 / 10 / 10 / 10 / 10 | done, 79 languages (11 Nov 2026) |
| 2 | `seed/ranked/<code>.json` (new) | 28 / 14 / 5 / 2 / 1 | **current**: follow the order below |
| 3 | `seed/classic/<code>.json` grows | from data, not before 25 Nov 2026 | planned: see "Phase 3" |

The level targets live in `LEVEL_TARGETS` in `server/prisma/check-seed.ts`, one entry per phase
of each kind; a file must match one of them exactly. A later phase appends its totals, and its
writers add the difference to the existing file.

**Phase 2's split** is the real ranked play: of 583 ranked serves in production, 56% were
level 1, 28% level 2, 10% level 3, 5% level 4, 1% level 5 (a run climbs one level every five
correct answers, and most end early).

## Phase 2: ranked, in this order

Ordered by the production numbers of 11 Nov 2026 (the queries are below). Work down the list,
three languages at a time. **Stop after tier C** and re-run the queries: a language nobody plays
ranked costs no Gemini, so tiers D and E are seeded only once ranked runs appear there (move
such a language up to tier B).

**Tier A: reserve already used up** (level-1 serves ≥ level-1 stock, runs in the last 30 days)

| # | Code | Language | Ranked L1 stock / served | Runs (30 d) |
|---|---|---|---|---|
| 1 | lv | Latvian | 16 / 34 | 7 |
| 2 | uz | Uzbek (Latin) | 61 / 82 | 20 |
| 3 | es | Spanish | 70 / 68 | 16 |
| 4 | pt-BR | Brazilian Portuguese | 16 / 16 | 4 |
| 5 | vi | Vietnamese | 32 / 30 | 8 |

**Tier B: ranked play, reserve not yet used up**

| # | Code | Language | Ranked L1 stock / served | Runs (30 d) |
|---|---|---|---|---|
| 6 | ru | Russian | 63 / 44 | 11 |
| 7 | uk | Ukrainian | 61 / 43 | 8 |
| 8 | hr | Croatian | 8 / 4 | 2 |
| 9 | ar | Arabic | 8 / 4 | 1 |
| 10 | ro | Romanian | 63 / 1 | 1 |
| 11 | el | Greek | 0 / 0 | 1 |

**Tier C: a Classic audience, no ranked play yet** (most Classic game requests first; these
players are the likeliest to try ranked)

| # | Code | Language | Classic requests |
|---|---|---|---|
| 12 | fr | French | 526 |
| 13 | de | German | 53 |
| 14 | en | English | 50 |
| 15 | mn | Mongolian (Cyrillic) | 30 |
| 16 | cs | Czech | 28 |
| 17 | sk | Slovak | 28 |
| 18 | mk | Macedonian | 26 |
| 19 | sl | Slovenian | 25 |
| 20 | it | Italian | 23 |
| 21 | fa | Persian | 21 |
| 22 | ka | Georgian | 21 |
| 23 | hy | Armenian | 19 |
| 24 | he | Hebrew | 17 |
| 25 | nl | Dutch | 16 |

English has no Classic seed file (its Classic bank is the fallback,
`seed/fallback-questions.en.json`), but it does get a ranked file like every other language.

**Tier D: a little Classic play** (fewer than 15 requests), seed when ranked play appears:
26 da · 27 pl · 28 mr · 29 sq · 30 kk · 31 sr · 32 hu · 33 id · 34 ky

**Tier E: no play yet**, seed when ranked play appears (listed by speakers):
35 zh-CN · 36 hi · 37 bn · 38 ur · 39 ja · 40 sw · 41 te · 42 ta · 43 ko · 44 th · 45 gu · 46 kn ·
47 ml · 48 pa · 49 fil · 50 ms · 51 sv · 52 fi · 53 nb · 54 bg · 55 zh-TW · 56 jv · 57 ha · 58 am ·
59 yo · 60 ne · 61 my · 62 ig · 63 si · 64 km · 65 ps · 66 or · 67 zu · 68 so · 69 af · 70 lo ·
71 ca · 72 lt · 73 be · 74 gl · 75 et · 76 eu · 77 cy · 78 is · 79 om · 80 su

## Phase 3: Classic +50 (planned)

**Why it waits.** Until 9 Nov 2026 Classic counted every *fetched* question as served, spares
and unreached levels included (fixed in `0628020`). So the Classic `servedCount` in production
is flat across levels and says nothing about how far players get. Since then it counts only
questions actually shown. Two weeks of clean counting gives the real level split.

**When:** from 25 Nov 2026.

1. Run both queries below on the server.
2. **The level split:** subtract the baseline (end of this file) from today's `classic_shown`
   per level. Those differences are the real Classic play since 11 Nov. Share 50 new questions
   in proportion, but only among levels that run short (a level whose stock is many times its
   play needs none).
   GA4 can confirm it: the `game_end` event carries `score` (questions answered), `mode` and
   `locale`, signed-out players included; once `score` and `mode` are registered as custom
   dimensions (Admin → Custom definitions), an exploration of `game_end` with mode = classic,
   by score, shows where players drop out.
3. **The language order:** most Classic play since the baseline first, among languages whose
   pool is thin at the levels players reach (`c_never_shown` low against that play). Write the
   order into this file as a table like phase 2's.
4. Append the new totals (for example `{ 1: 35, 2: 28, 3: 17, 4: 10, 5: 10 }`) to
   `LEVEL_TARGETS.classic` in `server/prisma/check-seed.ts`, and update this file's phase table.
   A file passes when it matches any phase's totals exactly, so languages not yet topped up keep
   passing (and deploying) while the phase rolls out over weeks; writers fill to the newest.
5. Writers follow [QUESTION_SEEDING_BRIEF.md](QUESTION_SEEDING_BRIEF.md): they add to the
   existing file and repeat nothing from it or from the ranked file.

## The queries

Run on the server. Paste each block into a shell there (prefix `docker` with `sudo` if needed).

**Per language:** where Gemini has been spent, and how much each language is played.

```bash
docker exec -i millionaire-postgres-prod psql -U millionaire -d millionaire <<'SQL'
WITH questions AS (
  SELECT locale,
         coalesce(sum("servedCount") FILTER (WHERE NOT ranked), 0) AS classic_shown,
         coalesce(sum("servedCount") FILTER (WHERE ranked), 0)     AS ranked_shown,
         count(*) FILTER (WHERE origin = 'ai' AND NOT ranked)      AS classic_ai,
         count(*) FILTER (WHERE origin = 'ai' AND ranked)          AS ranked_ai
  FROM "Question" WHERE "retiredAt" IS NULL GROUP BY locale
), batches AS (
  SELECT locale, max(requests) FILTER (WHERE NOT ranked) AS classic_requests
  FROM "GenerationDemand" GROUP BY locale
), runs AS (
  SELECT locale, count(*) AS runs_30d, count(DISTINCT "userId") AS ranked_players_30d
  FROM "Run" WHERE "startedAt" > now() - interval '30 days' GROUP BY locale
), classic_players AS (
  SELECT locale, count(DISTINCT "userId") AS classic_players_30d
  FROM "ClassicGame" WHERE "playedAt" > now() - interval '30 days' GROUP BY locale
), accounts AS (
  SELECT locale, count(*) AS accounts FROM "User" GROUP BY locale
)
SELECT q.locale,
       q.classic_ai + q.ranked_ai          AS gemini_questions,
       q.classic_ai, q.ranked_ai,
       q.classic_shown, q.ranked_shown,
       coalesce(b.classic_requests, 0)     AS classic_requests,
       coalesce(cp.classic_players_30d, 0) AS classic_players_30d,
       coalesce(r.runs_30d, 0)             AS runs_30d,
       coalesce(r.ranked_players_30d, 0)   AS ranked_players_30d,
       coalesce(a.accounts, 0)             AS accounts
FROM questions q
LEFT JOIN batches b          USING (locale)
LEFT JOIN runs r             USING (locale)
LEFT JOIN classic_players cp USING (locale)
LEFT JOIN accounts a         USING (locale)
ORDER BY gemini_questions DESC, classic_shown + ranked_shown DESC, classic_requests DESC;
SQL
```

**Per language and level:** stock against play. `c_` is Classic, `r_` the ranked reserve. A
bucket with high `shown` and few `never_shown` (Classic) or `r_shown` near `r_stock` (ranked) is
about to call Gemini. The second table is the level split across all languages.

```bash
docker exec -i millionaire-postgres-prod psql -U millionaire -d millionaire <<'SQL'
SELECT locale, level,
       count(*) FILTER (WHERE NOT ranked AND origin = 'seed')      AS c_seed,
       count(*) FILTER (WHERE NOT ranked AND origin = 'ai')        AS c_ai,
       coalesce(sum("servedCount") FILTER (WHERE NOT ranked), 0)   AS c_shown,
       count(*) FILTER (WHERE NOT ranked AND "servedCount" = 0)    AS c_never_shown,
       count(*) FILTER (WHERE ranked)                              AS r_stock,
       coalesce(sum("servedCount") FILTER (WHERE ranked), 0)       AS r_shown
FROM "Question"
WHERE "retiredAt" IS NULL
  AND locale IN (SELECT locale FROM "Question" WHERE origin = 'ai' OR "servedCount" > 0)
GROUP BY 1, 2 ORDER BY 1, 2;

SELECT level,
       sum("servedCount") FILTER (WHERE NOT ranked) AS classic_shown,
       sum("servedCount") FILTER (WHERE ranked)     AS ranked_shown,
       count(*) FILTER (WHERE origin = 'ai' AND NOT ranked) AS classic_ai,
       count(*) FILTER (WHERE origin = 'ai' AND ranked)     AS ranked_ai
FROM "Question" WHERE "retiredAt" IS NULL
GROUP BY 1 ORDER BY 1;
SQL
```

Caveats: `classic_requests` and `classic_shown` include signed-out players, the `*_players_30d`
columns and `accounts` only signed-in ones. A ranked question that graduates into Classic
restarts its `servedCount` at 0.

## Baseline: Classic `c_shown`, 11 Nov 2026

Phase 3 subtracts these from later numbers (pre-fix counts, see "Phase 3"). Levels 1 / 2 / 3 / 4 / 5.

**All languages:** 5155 / 4782 / 4601 / 4495 / 4393

| Code | c_shown by level | Code | c_shown by level |
|---|---|---|---|
| ar | 202 / 119 / 63 / 41 / 40 | lv | 27 / 22 / 20 / 16 / 16 |
| cs | 108 / 108 / 108 / 108 / 108 | mk | 68 / 68 / 68 / 68 / 68 |
| da | 12 / 6 / 5 / 0 / 0 | mn | 151 / 112 / 112 / 112 / 64 |
| de | 212 / 212 / 212 / 212 / 212 | mr | 3 / 3 / 1 / 0 / 0 |
| el | 18 / 18 / 13 / 7 / 0 | nl | 8 / 8 / 8 / 8 / 8 |
| en | 1075 / 708 / 628 / 596 / 579 | pl | 21 / 8 / 2 / 0 / 0 |
| es | 40 / 40 / 40 / 40 / 40 | pt-BR | 183 / 196 / 198 / 216 / 216 |
| fa | 0 / 0 / 0 / 0 / 0 | ro | 561 / 724 / 766 / 760 / 760 |
| fr | 1661 / 1742 / 1730 / 1719 / 1719 | ru | 67 / 52 / 52 / 52 / 40 |
| he | 24 / 18 / 6 / 0 / 0 | sk | 80 / 40 / 21 / 16 / 16 |
| hr | 92 / 54 / 31 / 8 / 7 | sl | 100 / 100 / 100 / 100 / 100 |
| hu | 4 / 4 / 4 / 4 / 4 | sr | 3 / 0 / 0 / 0 / 0 |
| hy | 74 / 72 / 72 / 72 / 72 | uk | 18 / 15 / 13 / 12 / 12 |
| id | 3 / 0 / 0 / 0 / 0 | uz | 0 / 0 / 0 / 0 / 0 |
| it | 89 / 83 / 80 / 80 / 65 | vi | 176 / 176 / 176 / 176 / 176 |
| ka | 67 / 66 / 64 / 64 / 63 | | |
| kk | 8 / 8 / 8 / 8 / 8 | | |

Every other language: 0 at every level.
