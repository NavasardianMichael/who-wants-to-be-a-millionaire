# Writer brief: 50 Classic seed questions for one language

> Given to one writer agent per language by the process in [QUESTION_SEEDING.md](QUESTION_SEEDING.md).
> Paths are relative to the repository root.

You are writing the permanent, hand-made question bank for **Millionaire**, a quiz game in the
TV quiz-show format, played in 80 languages. Your language is named in your task. These
questions are stored once and served to every player of that language, many times, so
quality matters far more than speed.

## Read first, in this order

1. `server/src/services/questionGen.ts`: `buildSystemInstruction`, `LEVEL_GUIDE` and
   `CATEGORY_GUIDE`. **Every rule in that writer prompt applies to you verbatim.** It is the
   house style: native writing (never translated in your head), hooks, certain facts, one
   right answer, tempting wrong options of the same kind, grammar that never gives the answer
   away, no stale or pointless questions, no politics/wars/tragedies/offensive topics, and
   never reproducing a real TV quiz or pub quiz question.
2. `server/src/lib/locales.ts`: your language's `LOCALE_INFO` entry (`culture` = whom "local"
   questions are about; `writing` = spelling, punctuation and quotation rules you MUST follow).
3. [QUESTION_SEEDING_SAMPLE_HY.md](QUESTION_SEEDING_SAMPLE_HY.md), the approved Armenian sample:
   the quality bar. Note how wrong options come from the same family, how traps are built, and
   how each reasoning question works. Do not translate its questions; write your own for your
   culture. **Do not reuse its ideas or templates either**: no "A is taller/older than B, B than
   C", clock-hand angles, leap years, a day on the Moon, brothers-and-sisters counts, weekday
   names or letters-as-numbers unless your language has its own genuinely different twist.
   Every language gets the same templates otherwise, and the game feels translated.

## What to write: exactly 50 questions

- **10 per level** (levels 1–5, difficulty exactly as `LEVEL_GUIDE` defines it, judged for
  adults in your language's culture).
- **About 40% local** (`scope: "local"`, about the culture in `culture`), the rest `global`.
  Local questions must ring true to a native, not read like a tourist guide.
- **About 40% need reasoning, not just memory** (`kind`):
  - `fact`: you know it or you don't. Still needs a hook and tempting wrong options.
  - `reasoning`: solvable from what the question says, or one very common fact plus a step
    of thinking (ordering, a pattern in words or numbers, a trap for autopilot).
  - `reasoning+fact`: needs real knowledge AND a step of thinking; neither alone gives the
    answer.
  - At least one non-`fact` question on every level.
  - **Levels 4 and 5 may never be pure `reasoning`**: at the top of the ladder, pure logic is
    too easy. Use `reasoning+fact` or `fact` there.
  - The best reasoning questions work only in YOUR language: wordplay, how words are built,
    native number words, the script, proverbs, the calendar, loanwords.
- **Spread across at least 10 of the 16 categories** in `CATEGORY_GUIDE`; `localCulture` and
  `language` are especially valuable. A reasoning question goes under the category it is about
  (`general`, `language`, `science`, ...); there is no "logic" category.
- **Every question about a different subject.** Vary the phrasing.
- **Vary which option is correct**: each of the four positions should be correct 7–18 times.
- These are for Classic, which has no clock, so a puzzle may take a minute. Keep the question
  under 300 characters and each option under 120.

## Quality bar (the owner rejects anything below it)

- **Certain facts only.** If you are not sure a fact is exactly right and undisputed, use
  another question. Never invent people, works, dates or quotations. A wrong "correct"
  answer is the worst possible defect.
- Exactly one defensible answer. Check every wrong option is really wrong, including
  options that could be right under another reading (the Armenian sample dropped Norway from a
  Bluetooth question because Harald Bluetooth ruled Norway too). Prefer wording that only
  claims the well-documented core of a story, not its legends.
- Native, natural, well-edited language in the standard variety from `writing`, with the
  native punctuation and quotation marks. Established native spellings of foreign names.
  Non-breaking spaces (U+00A0, U+202F) are fine where your typography needs them.
- Never twist natural wording just to pass the checker. If a check looks wrong for your
  language, say so in your report.
- Before you finish, review every question as a demanding head writer: fact certain? one
  answer? right level? would an intelligent player enjoy it? Rewrite or replace the weak.

## Output

Write a JSON array of 50 objects to `server/prisma/seed/classic/<code>.json` (UTF-8, 2-space
indent), each:

```json
{
  "level": 1,
  "category": "language",
  "scope": "local",
  "kind": "fact",
  "text": "Ըստ առածի՝ մի ծաղկով ի՞նչ չի գա։",
  "options": ["Ամառ", "Գարուն", "Աշուն", "Ձմեռ"],
  "correctIndex": 1,
  "gloss": "One flower doesn't bring... what? — Spring: the proverb «Մի ծաղկով գարուն չի գա»."
}
```

`gloss` is English: a translation of the question, then ` — ` and the answer with a one-line
note (why it's true, or how the reasoning works). It is for reviewers and never shown to
players.

Then run the checker from the `server` folder, and fix and re-run until it passes:

```
cd server
npx tsx prisma/check-classic-seed.ts <code>
```

## Rules of the workspace

- Write only your own file. Don't edit other files, don't run git, tests or `pnpm verify`,
  and never open `.env` files. Temporary helper scripts belong in your scratchpad, not the repo.

## Your final message (under 150 words)

The checker's last line; your counts (local, reasoning, per level); and any question you are
not fully certain of, with why (ideally none: replace doubtful ones instead of reporting them).
