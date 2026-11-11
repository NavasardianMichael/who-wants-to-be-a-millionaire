# Writing the hand-made question seed

How the hand-written question banks in `server/prisma/seed/` are written, checked and shipped.
Written for the Claude session that continues the work. The owner starts it with something like
*"continue the question seeding per docs/QUESTION_SEEDING.md"*. **What to seed next, and in
which order, is in [QUESTION_SEEDING_PLAN.md](QUESTION_SEEDING_PLAN.md).**

## What exists

- **Classic banks:** `server/prisma/seed/classic/<locale>.json`, public questions served in
  Classic and offline packs. English is the exception: its Classic bank is the fallback
  (`server/prisma/seed/fallback-questions.en.json`); never add `classic/en.json`.
- **Ranked banks:** `server/prisma/seed/ranked/<locale>.json`, the ranked reserve: questions
  only Marathon and Time Attack draw, never sent with their answer. English gets one too. A
  well-used ranked question later moves into Classic (`rankedGraduation`).
- **The checker:** `server/prisma/check-seed.ts`. It runs the same validation as AI output
  (`parseGeneratedQuestions`), plus each kind's rules: questions per level (`LEVEL_TARGETS`, one
  entry per phase), the local and reasoning mix, at least 10 categories, varied answer positions,
  the answer not given away, lengths (ranked is shorter, since it's timed), and **no question
  repeated from the language's other file**. It also lists pairs of questions with the same
  correct answer for a person to check.
- **The loader:** `server/prisma/seed.ts` loads every file on each API deploy
  (`node dist/prisma/seed.js` in `deploy.yml`). It merges: only missing questions are inserted
  (unique per locale + normalised text hash), AI questions are never touched, options are stored
  shuffled, and a seed question removed from its file is retired. A file that fails the checker
  stops the deploy before the release is switched in.
- **The writer briefs:** [QUESTION_SEEDING_BRIEF.md](QUESTION_SEEDING_BRIEF.md) (Classic) and
  [QUESTION_SEEDING_BRIEF_RANKED.md](QUESTION_SEEDING_BRIEF_RANKED.md) (ranked).
- **The quality bar:** [QUESTION_SEEDING_SAMPLE_HY.md](QUESTION_SEEDING_SAMPLE_HY.md), the
  owner-approved Armenian sample.

## The process

1. **Pick the next three languages** of the current phase in the plan's order whose file is
   missing (ranked) or below the newest targets (Classic). Three writers run in parallel, in a
   pack. More at once burns through the 5-hour usage limit within minutes.
2. **Start one writer agent per language** (Agent tool, `general-purpose`) with this prompt:

   Ranked:
   > Read the brief at docs/QUESTION_SEEDING_BRIEF_RANKED.md and follow it exactly.
   > Your language: `<English name>`, code `<code>`. Output file: server/prisma/seed/ranked/`<code>`.json.

   Classic:
   > Read the brief at docs/QUESTION_SEEDING_BRIEF.md and follow it exactly.
   > Your language: `<English name>`, code `<code>`. Output file: server/prisma/seed/classic/`<code>`.json.

   **Model:** see the table below. A writer takes about 7–10 minutes and about 100–150k tokens.
3. **Check every report.** Writers list the facts they were least sure of, and every
   same-answer pair the checker listed. Look at each yourself, by printing the question, options
   and gloss:

   ```bash
   cd server
   node -e "const q=require('./prisma/seed/<kind>/<code>.json').filter(q=>/<keyword>/i.test(q.gloss));q.forEach(x=>console.log(x.level,x.text,'\n ',x.options.join(' | '),'->',x.options[x.correctIndex],'\n ',x.gloss))"
   ```

   Check the fact, and that **no wrong option could also be argued right**. For a same-answer
   pair, confirm the two questions are about different things. Fix a wrong question in the JSON
   yourself, or ask the writer (SendMessage) to replace it. When a writer bent its wording to
   pass the checker, the checker is usually what's wrong: fix the checker, not the language
   (both earlier cases were like that: French non-breaking spaces, and Persian «انگل» inside
   «انگلیسی»).
4. **When all three pass**, run `npx tsx prisma/check-seed.ts <code> [ranked]` for each (from
   `server/`), then `pnpm db:seed` from the root (loads them into the dev database: the real
   loader, run for real).
5. **Commit and push the pack** to master (the owner's standing rule: push directly to
   master, never a branch unasked):

   ```bash
   git add server/prisma/seed/<kind>/<a>.json server/prisma/seed/<kind>/<b>.json server/prisma/seed/<kind>/<c>.json
   git commit -m "Ranked seed: <A>, <B>, <C> (50 questions each)"
   git push origin master
   ```

   The push deploys the API, and the deploy seeds production. Deploys queue
   (`cancel-in-progress: false`), so packs never collide. If the checker or any shared code
   changed, run `pnpm verify` first.
6. **Next pack.** Stop when the owner's agreed number of packs is pushed, when the plan says to
   stop and re-check the data, or when the usage limit stops the writers. Only files that pass
   the checker are ever committed. A writer stopped by the limit saves nothing until it
   finishes; resume it after the reset with SendMessage ("continue from where you stopped, same
   brief, same file").

## Model per language

Quality is the point (the bank is permanent and played many times), so the choice is per
language, not one model for all:

- **Opus, effort `medium`**: languages with less training data, where native fluency and real
  local knowledge are hardest. Everything not in the next list.
- **Sonnet, effort `high`**: the major languages, which Sonnet writes natively well. The
  higher effort buys a careful fact-check pass:
  `en zh-CN zh-TW es fr de pt-BR ru ja ko it nl pl uk sv da nb fi cs ro hu el he ar id vi ca bg hr sk`

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
- **Ranked only (new, watch closely in the first packs):** puzzles too slow for a clock, and a
  subject the Classic file already covers, asked from another angle. The checker catches neither
  for certain: the same-answer list is the best hint.
- **Ranked level 1 padded with filler** (the first ranked packs: pt-BR, vi, ru had 16 of 150
  replaced, and every file passed the checker). With 28 level-1 slots to fill, writers reach for:
  - **stock riddles**: a kilo of cotton or a kilo of iron, three pills every half hour, "what
    gets bigger the more you take away", "what is yours but others use more", local folk riddles
    every player knows the answer to;
  - **stale superlatives**: largest ocean, tallest animal, longest bone or river, only flying
    mammal, "which city is the Eiffel Tower in";
  - **wars**: famous battles and victories, which the writer prompt bans outright;
  - **childish or empty items**: "which insect makes honey", counting the letters or syllables
    of a plain word.

  The checker catches none of these. Read the whole level-1 block of every ranked file, not
  only what the writer flagged. Replacements for a riddle should be quick reasoning that works
  only in that language (a tone or accent mark, a word with no plural, native number words).
