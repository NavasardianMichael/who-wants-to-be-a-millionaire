# Question seeding plan: phases and language order

What gets seeded next, in which order, and why. The process (writers, review, commit) is in
[QUESTION_SEEDING.md](QUESTION_SEEDING.md). Written for the owner and for the Claude session
that continues the work, on any machine: everything needed is in this file and the repo.

**The files are the source of truth for progress.** A language is done for a phase when its
file reaches the phase's level targets and the checker passes.

## Why seed at all, and where

Gemini is called only when a player has no unseen question left at a level
(`getQuestionBatch`, `getRunQuestion` in `server/src/services/questionPool.ts`). Each call writes
8 questions into a pool every later player of that language shares. So the spend follows the
**most dedicated player of each language, level by level**, and a hand-written question saves
Gemini only where players actually run out. When Gemini is busy (429) or the hourly budget is
spent, a Classic player gets English questions and a ranked player gets repeats, so seeding
those languages also fixes what players see.

- **Classic:** a game fetches all five levels at its start, excluding what the device (and, signed
  in, the account) has already *shown*. Levels 1–3 are shown most, so they run dry first.
- **Ranked** (Marathon, Time Attack) draws only from the ranked reserve and never repeats a
  question from the player's earlier runs while unseen ones remain. A run that reaches a level
  wants up to five questions there.

## Phases

| Phase | File | Level 1 / 2 / 3 / 4 / 5 | Status |
|---|---|---|---|
| 1 | `seed/classic/<code>.json` | 10 / 10 / 10 / 10 / 10 | done, 79 languages (11 Nov 2026) |
| 2 | `seed/ranked/<code>.json` (new) | 28 / 14 / 5 / 2 / 1 | done, 80 languages (Nov 2026) |
| 3 | `seed/classic/<code>.json` grows | 25 / 23 / 20 / 17 / 15 (+15 / 13 / 10 / 7 / 5) | **current**: the order below |
| 4 | `seed/ranked/<code>.json` grows | 48 / 29 / 15 / 5 / 3 (+20 / 15 / 10 / 3 / 2) | **current**: the order below |

The level targets live in `LEVEL_TARGETS` in `server/prisma/check-seed.ts`, one entry per phase
of each kind; a file must match one of them exactly, so languages not yet topped up keep passing
(and deploying). Writers fill to the newest totals and add the difference to the existing file.

## Phases 3 and 4: in this order

From the production numbers of 19 Nov 2026 (the queries are below). Ranked phase 2 went live on
11 Nov and cut Gemini from 120–280 calls a day to 6–60. What still calls it, since 11 Nov:

| # | Kind | Code | Language | Calls | Refused (budget) | Failed (429) | Out at |
|---|---|---|---|---|---|---|---|
| 1 | Classic | mk | Macedonian | 10 | 49 | 10 | all levels; L1–L3 never-shown 0 |
| 2 | Classic | ru | Russian | 29 | 21 | 1 | L1–L2 (28 calls in 7 days) |
| 3 | Classic | lt | Lithuanian | 37 | 1 | 10 | L1–L4 never-shown 0 |
| 4 | Ranked | fr | French | 11 | ~40 | 0 | one Time Attack player has seen all of L1–L4 |
| 5 | Classic | sq | Albanian | 21 | 0 | 5 | L1–L3 |
| 6 | Classic | sr | Serbian | 21 | 0 | 3 | L1–L3 never-shown 0 |
| 7 | Classic | sk | Slovak | 15 | 0 | 0 | L1–L2 never-shown 0 |
| 8 | Classic | pl | Polish | 10 | 3 | 0 | L1, L3 never-shown 0 |

Packs of three: **mk, ru, lt** · **fr (ranked), sq, sr** · **sk, pl**, all three pushed on
19 Nov 2026. Next: **re-run the queries** (blocks 1 and 4 at least) a few days after that
deploy, and check that these languages stopped calling Gemini, before seeding more.

Review notes from these packs: writers still reach for school-textbook globals (CO₂ in fizzy
drinks, the hummingbird flying backwards, Orwell's 1984, Vivaldi's Four Seasons, the Fibonacci
sequence, Tereshkova, bromine as the liquid non-metal) even after a self-check. Read every global
question, at every level, not only level 1.

**Second round, Classic, same data** (the owner chose to go on without waiting for new numbers).
These languages barely call Gemini yet; the order is where the next shortage will come from:

| Pack | Codes | Why |
|---|---|---|
| 4 | hr · el · uz | hr, el: every L1–L4 question already shown, steady demand (125, 60 requests, last 18–19 Nov). uz: only 10 questions at L2–L5, L2 shown in full |
| 5 | ar · ka · kk | every L1 question shown (ar also L3), demand 19–95 |
| 6 | sv · id · mr | no AI pool, failed calls already served English |

All three packs pushed on 20 Nov 2026, so 17 languages now hold 100 Classic questions (French
ranked 100). Next: re-run the queries before seeding more.

Waiting for the next measurement: fr and ro Classic (deep pools despite the most demand);
ranked L3 for ar and ro (5 questions each, one player at or near the bottom), once runs return.

Not worth seeding now: de, mn, sl, cs, vi, en, pt-BR, hy, es, ro Classic. Their AI pools (60–360 a
level) were bought before 11 Nov and have needed almost nothing since.

French ranked is one player who plays about 200 questions a week. 50 more questions buy
weeks, not a cure; after that they get repeats when their hourly budget is spent, which is fine.

## The queries

Run on the server. Paste each block into a shell there (prefix `docker` with `sudo` if needed).
Totals only: no user ids, emails or IPs.

**1. AI calls** per language, mode and level. Each call stores one batch of up to 8 with one
`createdAt`, so batches count calls. Only calls whose questions still exist; a ranked question
that graduated into Classic counts as Classic.

```bash
docker exec -i millionaire-postgres-prod psql -U millionaire -d millionaire -P pager=off <<'SQL'
\echo '=== A1. AI calls per language (one call = one batch of up to 8)'
WITH calls AS (
  SELECT locale, ranked, level, category, date_trunc('second', "createdAt") AS at
  FROM "Question" WHERE origin = 'ai' GROUP BY 1, 2, 3, 4, 5
)
SELECT locale,
       count(*) FILTER (WHERE NOT ranked AND at > now() - interval '7 days')  AS classic_7d,
       count(*) FILTER (WHERE ranked     AND at > now() - interval '7 days')  AS ranked_7d,
       count(*) FILTER (WHERE NOT ranked AND at > now() - interval '30 days') AS classic_30d,
       count(*) FILTER (WHERE ranked     AND at > now() - interval '30 days') AS ranked_30d,
       count(*) FILTER (WHERE at > '2026-11-19')                              AS since_nov19,
       count(*)                                                               AS all_time
FROM calls GROUP BY locale
ORDER BY count(*) FILTER (WHERE at > now() - interval '30 days') DESC, all_time DESC;

\echo '=== A2. AI calls, last 30 days, per language, mode and level'
WITH calls AS (
  SELECT locale, ranked, level, category, date_trunc('second', "createdAt") AS at
  FROM "Question" WHERE origin = 'ai' AND "createdAt" > now() - interval '30 days' GROUP BY 1, 2, 3, 4, 5
)
SELECT locale, CASE WHEN ranked THEN 'ranked' ELSE 'classic' END AS mode, level,
       count(*) AS calls, max(at)::date AS last_call
FROM calls GROUP BY 1, 2, 3 ORDER BY calls DESC, 1, 2, 3;

\echo '=== A3. AI calls per day, last 21 days'
WITH calls AS (
  SELECT locale, ranked, level, category, date_trunc('second', "createdAt") AS at
  FROM "Question" WHERE origin = 'ai' AND "createdAt" > now() - interval '21 days' GROUP BY 1, 2, 3, 4, 5
)
SELECT at::date AS day, count(*) FILTER (WHERE NOT ranked) AS classic_calls,
       count(*) FILTER (WHERE ranked) AS ranked_calls, count(DISTINCT locale) AS locales
FROM calls GROUP BY 1 ORDER BY 1;
SQL
```

**2. Stock against play, and players near the bottom.** In B1, a bucket with `c_never_shown`
(or `r_never_shown`) at 0 has been shown in full: its next request calls Gemini. In C1 and C2,
`players_near_out` counts players who have seen 80% of a bucket.

```bash
docker exec -i millionaire-postgres-prod psql -U millionaire -d millionaire -P pager=off <<'SQL'
\echo '=== B1. Stock against play per language and level (c_ = Classic, r_ = ranked)'
SELECT locale, level,
       count(*) FILTER (WHERE NOT ranked AND origin = 'seed')    AS c_seed,
       count(*) FILTER (WHERE NOT ranked AND origin = 'ai')      AS c_ai,
       coalesce(sum("servedCount") FILTER (WHERE NOT ranked), 0) AS c_shown,
       count(*) FILTER (WHERE NOT ranked AND "servedCount" = 0)  AS c_never_shown,
       count(*) FILTER (WHERE ranked AND origin = 'seed')        AS r_seed,
       count(*) FILTER (WHERE ranked AND origin = 'ai')          AS r_ai,
       coalesce(sum("servedCount") FILTER (WHERE ranked), 0)     AS r_shown,
       count(*) FILTER (WHERE ranked AND "servedCount" = 0)      AS r_never_shown
FROM "Question"
WHERE "retiredAt" IS NULL
  AND locale IN (SELECT locale FROM "Question" WHERE origin = 'ai' OR "servedCount" > 0)
GROUP BY 1, 2 ORDER BY 1, 2;

\echo '=== C1. Ranked: how much of each bucket the keenest players have seen'
WITH seen AS (
  SELECT r."userId", r.locale, q.level, count(DISTINCT q.id) AS seen
  FROM "Run" r CROSS JOIN LATERAL unnest(r."servedQuestionIds") AS s(id)
  JOIN "Question" q ON q.id = s.id AND q.ranked
  GROUP BY 1, 2, 3
), stock AS (
  SELECT locale, level, count(*) AS stock FROM "Question" WHERE ranked AND "retiredAt" IS NULL GROUP BY 1, 2
)
SELECT s.locale, s.level, st.stock, count(*) AS players, max(s.seen) AS max_seen,
       round(percentile_cont(0.9) WITHIN GROUP (ORDER BY s.seen)) AS p90_seen,
       count(*) FILTER (WHERE s.seen >= 0.8 * st.stock) AS players_near_out
FROM seen s JOIN stock st USING (locale, level)
GROUP BY 1, 2, 3 ORDER BY players_near_out DESC, max_seen DESC;

\echo '=== C2. Classic (signed-in): how much of each bucket the keenest players have seen'
WITH seen AS (
  SELECT sq."userId", q.locale, q.level, count(*) AS seen
  FROM "SeenQuestion" sq
  JOIN "Question" q ON q.id = sq."questionId" AND NOT q.ranked AND q."retiredAt" IS NULL
  GROUP BY 1, 2, 3
), stock AS (
  SELECT locale, level, count(*) AS stock FROM "Question" WHERE NOT ranked AND "retiredAt" IS NULL GROUP BY 1, 2
)
SELECT s.locale, s.level, st.stock, count(*) AS players, max(s.seen) AS max_seen,
       round(percentile_cont(0.9) WITHIN GROUP (ORDER BY s.seen)) AS p90_seen,
       count(*) FILTER (WHERE s.seen >= 0.8 * st.stock) AS players_near_out
FROM seen s JOIN stock st USING (locale, level)
GROUP BY 1, 2, 3 ORDER BY players_near_out DESC, max_seen DESC;
SQL
```

**3. Play per mode, demand, stock per language.**

```bash
docker exec -i millionaire-postgres-prod psql -U millionaire -d millionaire -P pager=off <<'SQL'
\echo '=== D1. Ranked runs per language and mode'
SELECT locale, mode,
       count(*) FILTER (WHERE "startedAt" > now() - interval '7 days')  AS runs_7d,
       count(*) FILTER (WHERE "startedAt" > now() - interval '30 days') AS runs_30d,
       count(*) AS runs_all,
       count(DISTINCT "userId") FILTER (WHERE "startedAt" > now() - interval '30 days') AS players_30d,
       round(avg("correctCount"), 1) AS avg_correct, max("correctCount") AS max_correct,
       count(*) FILTER (WHERE "usedPublicQuestions") AS ran_out_of_reserve
FROM "Run" GROUP BY 1, 2 ORDER BY runs_30d DESC, runs_all DESC;

\echo '=== D2. Classic games (signed-in) per language, by level reached'
SELECT locale,
       count(*) FILTER (WHERE "playedAt" > now() - interval '7 days')  AS games_7d,
       count(*) FILTER (WHERE "playedAt" > now() - interval '30 days') AS games_30d,
       count(DISTINCT "userId") FILTER (WHERE "playedAt" > now() - interval '30 days') AS players_30d,
       count(*) FILTER (WHERE "reachedStage" <= 3)              AS reached_l1,
       count(*) FILTER (WHERE "reachedStage" BETWEEN 4 AND 6)   AS reached_l2,
       count(*) FILTER (WHERE "reachedStage" BETWEEN 7 AND 9)   AS reached_l3,
       count(*) FILTER (WHERE "reachedStage" BETWEEN 10 AND 12) AS reached_l4,
       count(*) FILTER (WHERE "reachedStage" >= 13)             AS reached_l5
FROM "ClassicGame" GROUP BY 1 ORDER BY games_30d DESC, 1;

\echo '=== E. Demand buckets (signed-out players included)'
SELECT locale, CASE WHEN ranked THEN 'ranked' ELSE 'classic' END AS mode, level, requests,
       "lastRequestedAt"::date AS last_requested
FROM "GenerationDemand" ORDER BY requests DESC;

\echo '=== F. Hand-written and AI stock per language'
SELECT locale,
       count(*) FILTER (WHERE origin = 'seed' AND NOT ranked) AS classic_seed,
       count(*) FILTER (WHERE origin = 'seed' AND ranked)     AS ranked_seed,
       count(*) FILTER (WHERE origin = 'ai')                  AS ai_total,
       count(*) FILTER (WHERE "retiredAt" IS NOT NULL)        AS retired,
       coalesce(sum("reportCount"), 0)                        AS reports
FROM "Question" GROUP BY 1 ORDER BY 1;
SQL
```

**4. What the database can't show:** calls refused by the hourly budget, failed calls (those
players got English or repeats), and Phone-a-Friend, one Gemini call per use.

```bash
J() { sudo journalctl -u millionaire-api --since -14d --no-pager -o cat; }
echo "--- settings"; grep -E '^(POOL_REFILL|AI_LIVE)' ~/apps/who-wants-to-be-a-millionaire/shared/.env.api || echo "(defaults)"
echo "--- AI refused, hourly budget spent, per bucket"; J | grep -oE 'budget spent; [A-Za-z-]+/L[0-9]' | sort | uniq -c | sort -rn | head -40
echo "--- generation failed, per bucket"; J | grep -oE '(ranked )?generation failed for [A-Za-z-]+/L[0-9]' | sort | uniq -c | sort -rn | head -40
echo "--- failure reasons"; J | grep -E 'generation failed|^\[refill\]|^\[gemini\]' | sed -E 's/^.*(failed for [A-Za-z-]+\/L[0-9]:|\[refill\]|\[gemini\])//' | cut -c1-140 | sort | uniq -c | sort -rn | head -15
echo "--- graduated to Classic"; J | grep -oE '\[graduation\] [0-9]+' | awk '{s+=$2} END {print s+0}'
echo "--- phone-a-friend fallbacks"; J | grep -c 'phone-a-friend\] fell back'
echo "--- nginx: requests that can trigger AI"
sudo sh -c 'zcat -f /var/log/nginx/access.log*' | grep -oE '"POST /(questions/batch|runs|runs/[^/ ]+/answer|lifelines/phone-a-friend)[ ?]' | sed -E 's#/runs/[^/ ]+/answer#/runs/:id/answer#; s/[ ?]$//' | sort | uniq -c | sort -rn
echo "--- phone-a-friend per day"
sudo sh -c 'zcat -f /var/log/nginx/access.log*' | grep '"POST /lifelines/phone-a-friend' | grep -oE '\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}' | sort | uniq -c | tail -21
```

Caveats: `E` and `B1`'s shown counts include signed-out players; `C2` and `D2` only signed-in
ones. A ranked question that graduates into Classic restarts its `servedCount` at 0.
