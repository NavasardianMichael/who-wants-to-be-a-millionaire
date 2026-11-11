# Writer brief: 50 ranked seed questions for one language

> Given to one writer agent per language by the process in [QUESTION_SEEDING.md](QUESTION_SEEDING.md).
> Paths are relative to the repository root.

You are writing hand-made questions for the **ranked reserve** of **Millionaire**, a quiz game
in the TV quiz-show format, played in 80 languages. Your language is named in your task.
Ranked questions are played in Marathon and Time Attack, the two scored modes with a
leaderboard. Their answers are never sent to a player before they answer. Each question is
stored once and shown to many players. Later, once well used, it moves into Classic too. So the
quality bar is the same as for Classic. Only the format differs: **these are played against a
clock.**

## Read first, in this order

1. [QUESTION_SEEDING_BRIEF.md](QUESTION_SEEDING_BRIEF.md), the Classic writer brief. **Everything
   in it applies to you** (the house style in `questionGen.ts`, your language's `LOCALE_INFO`
   entry, the Armenian sample as the quality bar and not as a template, the quality bar, the
   `gloss` format, the workspace rules) **except what this brief changes below.**
2. **Your language's existing questions, which you must not repeat:**
   `server/prisma/seed/classic/<code>.json`. For English, read
   `server/prisma/seed/fallback-questions.en.json` instead, since that is English's Classic bank.
   Their answers are public, because Classic sends answers to the device. A ranked question that
   repeats one would hand its answer to anyone who looked.

## What changes for ranked

**The clock.** Marathon gives 120 seconds a question and ends at the first wrong answer. Time
Attack gives 3 minutes for the whole run and no lifelines, so players spend about 8 seconds a
question. So:

- **Quick to read:** a player should take the question in within about 5 seconds. The checker
  allows up to 160 characters; aim for about 110 in alphabetic scripts and less in Chinese or
  Japanese. One sentence is ideal.
- **Short options:** a name, a number, a word or two. The checker allows up to 60 characters.
- **Quick reasoning only:** about **20% non-`fact`** (the checker allows 10–35%). A reasoning
  question must click in a few seconds: one step you see at a glance (how a word is built, a
  quick count, a one-step pattern, an autopilot trap). **No multi-step puzzles**, nothing that
  needs pen and paper. At least one non-`fact` question at levels 1, 2 and 3. Levels 4–5 are
  `fact` or `reasoning+fact`, never pure `reasoning`.

**The level split: exactly 50 questions.**

| Level | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Questions | 28 | 14 | 5 | 2 | 1 |

Every run starts at level 1 and moves up a level only every five correct answers, so most of
what players see is level 1. **Level 1 is where the quality shows**: 28 questions, each on a
different subject, spread across many categories. "Level 1" means easy for an adult of your
culture, not trivial or childish (see `LEVEL_GUIDE`).

Earlier ranked files had to replace a third of their level 1 for these, so **none of them**:
stock riddles (a kilo of cotton or of iron, pills every half hour, "what gets bigger the more you
take away", folk riddles every player already knows), stale superlatives (largest ocean, tallest
animal, longest bone, "where is the Eiffel Tower"), battles and wars, and empty items ("which
insect makes honey", counting the letters of a plain word). A quick reasoning question should
use something only your language has: a tone or accent mark, a word with no plural, native
number words, how a word is built.

**Unchanged from Classic:** about 40% `local` (30–55%), at least 10 of the 16 categories, every
question about a different subject, and each of the four answer positions correct 7–18 times.

## Never repeat

- **No subject that the existing file already covers.** Not reworded, not the same fact asked
  from another angle, not the same person, work or place as the subject of the question. Make a
  list of the existing questions' subjects before you write, and check each of yours against it.
- No two of your own questions about the same subject either.
- The checker rejects a question whose text matches one in the other file. It also **lists
  every pair of questions with the same correct answer**, in your file or across both. For each
  pair, replace yours unless the two are plainly about different things (for example, "three"
  answering both a riddle and a count of provinces). Your final message accounts for each pair
  left.

## Output

Write a JSON array of 50 objects to `server/prisma/seed/ranked/<code>.json` (UTF-8, 2-space
indent), in the same object format as the Classic brief (`level`, `category`, `scope`, `kind`,
`text`, `options`, `correctIndex`, `gloss`).

Then run the checker from the `server` folder, and fix and re-run until it passes:

```
cd server
npx tsx prisma/check-seed.ts <code> ranked
```

## Your final message (under 200 words)

The checker's last line; your counts (local, reasoning, per level); every same-answer pair the
checker listed, with one line each on why the two differ; and any question you are not fully
certain of, with why (ideally none: replace doubtful ones instead of reporting them).
