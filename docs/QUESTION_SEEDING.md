# Writing the hand-made question seed

How the Classic question banks in `server/prisma/seed/classic/` are written, checked and
shipped. Written for the Claude session that continues the work. The owner starts it with
something like *"continue the question seeding per docs/QUESTION_SEEDING.md"*.

## What exists

- **One file per language:** `server/prisma/seed/classic/<locale>.json`, 50 Classic questions,
  10 per level. English is the exception: its 150 questions are the fallback bank
  (`server/prisma/seed/fallback-questions.en.json`); never add `classic/en.json`.
- **The checker:** `server/prisma/check-classic-seed.ts`. It runs the same validation as AI
  output (`parseGeneratedQuestions`) plus the mix rules: 10 per level, 30–55% local, 30–55%
  reasoning, reasoning on every level, no pure `reasoning` at levels 4–5, at least 10
  categories, varied answer positions, and the answer not given away in the question.
- **The loader:** `server/prisma/seed.ts` loads every file on each API deploy
  (`node dist/prisma/seed.js` in `deploy.yml`). It merges: only missing questions are inserted
  (unique per locale + normalised text hash), AI questions are never touched, options are
  stored shuffled, and a seed question removed from its file is retired. A file that fails the
  checker stops the deploy before the release is switched in.
- **The writer brief:** [QUESTION_SEEDING_BRIEF.md](QUESTION_SEEDING_BRIEF.md), given to
  every writer.
- **The quality bar:** [QUESTION_SEEDING_SAMPLE_HY.md](QUESTION_SEEDING_SAMPLE_HY.md), the
  owner-approved Armenian sample.

**Which languages are done:** the files in `server/prisma/seed/classic/` are the source of
truth. All 79 non-English locales are in `server/src/lib/locales.ts`; the missing ones are the
remaining work.

## The process

1. **Pick the next three missing languages.** Three writers run in parallel, in a pack.
   More at once burns through the 5-hour usage limit within minutes.
2. **Start one writer agent per language** (Agent tool, `general-purpose`) with this prompt:

   > Read the brief at docs/QUESTION_SEEDING_BRIEF.md and follow it exactly.
   > Your language: `<English name>`, code `<code>`. Output file: server/prisma/seed/classic/`<code>`.json.

   **Model:** see the table below. A writer takes about 7–10 minutes and about
   100–150k tokens.
3. **Check every report.** Writers list the facts they were least sure of. Look at each one
   yourself, by printing the question, options and gloss:

   ```bash
   cd server
   node -e "const q=require('./prisma/seed/classic/<code>.json').filter(q=>/<keyword>/i.test(q.gloss));q.forEach(x=>console.log(x.level,x.text,'\n ',x.options.join(' | '),'->',x.options[x.correctIndex],'\n ',x.gloss))"
   ```

   Check the fact, and that **no wrong option could also be argued right**. Fix a wrong
   question in the JSON yourself, or ask the writer (SendMessage) to replace it. When a
   writer bent its wording to pass the checker, the checker is usually what's wrong: fix the
   checker, not the language (both earlier cases were like that: French non-breaking spaces,
   and Persian «انگل» inside «انگلیسی»).
4. **When all three pass**, run `npx tsx prisma/check-classic-seed.ts <code>` for each (from
   `server/`), then `pnpm db:seed` from the root (loads them into the dev database: the real
   loader, run for real).
5. **Commit and push the pack** to master (the owner's standing rule: push directly to
   master, never a branch unasked):

   ```bash
   git add server/prisma/seed/classic/<a>.json server/prisma/seed/classic/<b>.json server/prisma/seed/classic/<c>.json
   git commit -m "Classic seed: <A>, <B>, <C> (50 questions each)"
   git push origin master
   ```

   The push deploys the API, and the deploy seeds production. Deploys queue
   (`cancel-in-progress: false`), so packs never collide. If the checker or any shared code
   changed, run `pnpm verify` first.
6. **Next pack.** Stop when the owner's agreed number of packs is pushed, or when the usage
   limit stops the writers. Only files that pass the checker are ever committed. A writer
   stopped by the limit saves nothing until it finishes; resume it after the reset with
   SendMessage ("continue from where you stopped, same brief, same file").

## Model per language

Quality is the point (the bank is permanent and played many times), so the choice is per
language, not one model for all:

- **Opus, effort `medium`**: languages with less training data, where native fluency and real
  local knowledge are hardest. Everything not in the next list.
- **Sonnet, effort `high`**: the major languages, which Sonnet writes natively well. The
  higher effort buys a careful fact-check pass:
  `zh-CN zh-TW es fr de pt-BR ru ja ko it nl pl uk sv da nb fi cs ro hu el he ar id vi ca bg hr sk`

## What the writers got wrong before (watch for it)

- **Copying the sample's puzzle templates** ("A is older than B…", the shirt-drying puzzle)
  into every language. The brief now forbids it. Expect each language's reasoning questions
  to use its own words, script, numbers or calendar instead.
- **Two arguable answers.** For example, an option that is also true under another reading
  (Harald Bluetooth also ruled Norway). Look at every flagged question's wrong options.
- **Legend presented as fact.** Prefer wording that claims only the documented core (Ziryab
  moved to Córdoba and shaped its music; not the toothpaste stories).
- **Level drift.** Writers sometimes note a level-5 question may really be level 4. That's fine
  to leave; worse is a level-1 question that's hard.

## Status when this was written (10 Nov 2026)

Seeded and pushed, 22: `ar bn de es fa fr hi hy it ja ka ko mr pt-BR ru sw ta te th uk ur zh-CN`.
In progress in the first session: `gu kn nl`, then planned `ml pa pl` and `fil ms sv`.
Check the folder, not this list.
