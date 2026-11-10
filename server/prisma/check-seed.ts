/**
 * Checks a hand-written seed file before it is loaded: `prisma/seed/classic/<locale>.json`
 * (Classic, public) or `prisma/seed/ranked/<locale>.json` (the ranked reserve). The same checks
 * `parseGeneratedQuestions` runs on AI output, plus the shape of a good seed (questions per
 * level, a local/global and fact/reasoning mix, varied answers), plus no question repeated from
 * the language's other file.
 *
 *   npx tsx prisma/check-seed.ts hy            (Classic, from server/)
 *   npx tsx prisma/check-seed.ts hy ranked
 *
 * Prints every problem and exits 1 if there is any. Then lists the questions whose correct
 * answer also answers another question, for a person to confirm they are about different things.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCategory, type Level, LEVELS, OPTIONS_COUNT } from '../src/lib/game.js'
import { isLocale, LOCALE_INFO, type LocaleInfo } from '../src/lib/locales.js'
import { hasMixedScriptWord, questionHash, scriptShare } from '../src/services/questionGen.js'

export const SEED_KINDS = ['classic', 'ranked'] as const
export type SeedKind = (typeof SEED_KINDS)[number]

export type SeedQuestion = {
  level: number
  category: string
  scope: 'local' | 'global'
  /** `fact` (you know it or not), `reasoning` (solvable from the question), `reasoning+fact` (needs both). */
  kind: 'fact' | 'reasoning' | 'reasoning+fact'
  text: string
  options: string[]
  correctIndex: number
  /** English translation and a one-line note on the fact, for reviewers. Never stored. */
  gloss: string
}

/** A question of the language's other file, which a seed question may not repeat. */
export type CounterpartQuestion = Pick<SeedQuestion, 'text' | 'options' | 'correctIndex'> & { gloss?: string }
export type Counterpart = { name: string; questions: readonly CounterpartQuestion[] }

type LevelCounts = Record<Level, number>

/**
 * Questions per level a file holds after each phase, oldest first (docs/QUESTION_SEEDING_PLAN.md).
 * A file matches one of them exactly, so languages a phase has not reached yet still pass; a
 * phase appends its totals, and its writers add the difference to the existing file.
 */
export const LEVEL_TARGETS: Record<SeedKind, readonly LevelCounts[]> = {
  classic: [{ 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 }],
  // A run climbs a level every five correct answers and most end early: 56% of ranked serves are level 1.
  ranked: [{ 1: 28, 2: 14, 3: 5, 4: 2, 5: 1 }],
}

/** The newest phase's totals: what a writer fills a file to. */
export const currentTargets = (kind: SeedKind): LevelCounts => LEVEL_TARGETS[kind].at(-1)!

const formatCounts = (counts: LevelCounts): string => LEVELS.map((level) => counts[level]).join('/')

const RULES: Record<SeedKind, { maxText: number; maxOption: number; reasoning: readonly [number, number] }> = {
  // No clock: a puzzle may take a minute.
  classic: { maxText: 300, maxOption: 120, reasoning: [0.3, 0.55] },
  // Timed (Time Attack leaves about 8 s a question): quick to read, quick to think.
  ranked: { maxText: 160, maxOption: 60, reasoning: [0.1, 0.35] },
}

const KINDS = ['fact', 'reasoning', 'reasoning+fact']

/** Written without spaces between words, so a giveaway can hide inside any longer run of text. */
const UNSPACED = new Set(['zh-CN', 'zh-TW', 'ja', 'th', 'lo', 'km', 'my'])

/**
 * True when the answer is given away by the question: as a whole word where words are spaced
 * (Persian «انگل», "parasite", is not given away by «انگلیسی», "English"; "5.000" not by
 * "35.000"), anywhere otherwise.
 */
const givesAwayAnswer = (text: string, answer: string, locale: string): boolean => {
  const haystack = text.toLocaleLowerCase()
  const needle = answer.toLocaleLowerCase()
  if (UNSPACED.has(locale)) return haystack.includes(needle)
  const isWordChar = (char: string | undefined) => char !== undefined && /[\p{L}\p{M}\p{N}]/u.test(char)
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    if (!isWordChar(haystack[at - 1]) && !isWordChar(haystack[at + needle.length])) return true
  }
  return false
}

const SEED_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed')

export const seedFilePath = (kind: SeedKind, locale: string, seedDir = SEED_DIR): string => path.join(seedDir, kind, `${locale}.json`)

/**
 * The file a seed file may not repeat: Classic and ranked of one language check each other, and
 * English ranked checks the English fallback bank, which is English's Classic.
 */
export const readCounterpart = (kind: SeedKind, locale: string, seedDir = SEED_DIR): Counterpart | undefined => {
  const file =
    kind === 'ranked' && locale === 'en'
      ? path.join(seedDir, 'fallback-questions.en.json')
      : seedFilePath(kind === 'classic' ? 'ranked' : 'classic', locale, seedDir)
  if (!existsSync(file)) return undefined
  const questions = JSON.parse(readFileSync(file, 'utf8')) as CounterpartQuestion[]
  return { name: path.relative(seedDir, file).replaceAll('\\', '/'), questions }
}

export const checkSeed = (locale: string, kind: SeedKind, questions: SeedQuestion[], counterpart?: Counterpart): string[] => {
  if (!isLocale(locale)) return [`unknown locale ${locale}`]
  const { script, notNative }: LocaleInfo = LOCALE_INFO[locale]
  const rules = RULES[kind]
  const problems: string[] = []
  const hashes = new Map<string, number>()
  const counterpartHashes = new Map((counterpart?.questions ?? []).map(({ text }, index) => [questionHash(text), index]))

  questions.forEach((question, index) => {
    const at = `#${index + 1} (L${question.level})`
    const fail = (message: string) => problems.push(`${at}: ${message}`)
    const { text, options, correctIndex } = question

    if (!LEVELS.includes(question.level as never)) fail(`level ${question.level}`)
    if (!isCategory(question.category)) fail(`category ${question.category}`)
    if (question.scope !== 'local' && question.scope !== 'global') fail(`scope ${question.scope}`)
    if (!KINDS.includes(question.kind)) fail(`kind ${question.kind}`)
    if (question.kind === 'reasoning' && question.level >= 4) fail('levels 4-5 may not be pure reasoning; it needs knowledge too')
    if (typeof question.gloss !== 'string' || question.gloss.length < 10) fail('gloss missing')

    if (typeof text !== 'string' || text.trim().length < 8 || text.length > rules.maxText) {
      fail(`text must be 8-${rules.maxText} characters`)
      return
    }
    // Plain-space runs, tabs and line breaks only: French typography needs non-breaking spaces (U+00A0, U+202F).
    if (text !== text.trim() || /[ \t\r\n]{2,}|[\t\r\n]/.test(text)) fail('text has stray whitespace')
    if (script && scriptShare(text, script) < 0.6) fail(`text is not mainly in the ${LOCALE_INFO[locale].name} script`)
    if (hasMixedScriptWord(text)) fail('a word in the text mixes two alphabets')
    if (notNative?.test(text)) fail(`text contains a character native ${LOCALE_INFO[locale].name} never uses`)

    if (!Array.isArray(options) || options.length !== OPTIONS_COUNT) {
      fail('needs exactly four options')
      return
    }
    if (options.some((option) => typeof option !== 'string' || !option.trim() || option.length > rules.maxOption)) {
      fail(`options must be 1-${rules.maxOption} characters`)
    }
    if (options.some((option) => hasMixedScriptWord(option))) fail('an option mixes two alphabets in one word')
    if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== OPTIONS_COUNT) fail('options repeat')
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= OPTIONS_COUNT) {
      fail(`correctIndex ${correctIndex}`)
      return
    }
    const answer = options[correctIndex]!
    if (answer.length > 3 && givesAwayAnswer(text, answer, locale)) fail('the answer appears in the question')

    const hash = questionHash(text)
    if (hashes.has(hash)) fail(`same question as #${hashes.get(hash)! + 1}`)
    hashes.set(hash, index)
    if (counterpartHashes.has(hash)) fail(`same question as ${counterpart!.name} #${counterpartHashes.get(hash)! + 1}`)
  })

  const counts = Object.fromEntries(LEVELS.map((level) => [level, questions.filter((question) => question.level === level).length])) as LevelCounts
  const phases = LEVEL_TARGETS[kind]
  const matched = phases.find((phase) => LEVELS.every((level) => counts[level] === phase[level]))
  const targets = matched ?? currentTargets(kind)
  if (!matched) {
    const earlier = phases.length > 1 ? ` (or an earlier phase's ${phases.slice(0, -1).map(formatCounts).join(', ')})` : ''
    problems.push(`levels 1-5 have ${formatCounts(counts)} questions, wants ${formatCounts(targets)}${earlier}`)
  }

  const total = questions.length
  const share = (predicate: (question: SeedQuestion) => boolean) => questions.filter(predicate).length / (total || 1)
  const percent = (value: number) => `${Math.round(value * 100)}%`

  const local = share(({ scope }) => scope === 'local')
  if (local < 0.3 || local > 0.55) problems.push(`local share ${percent(local)}, wants about 40% (30-55%)`)

  const [minReasoning, maxReasoning] = rules.reasoning
  const reasoning = share(({ kind: questionKind }) => questionKind !== 'fact')
  if (reasoning < minReasoning || reasoning > maxReasoning) {
    problems.push(`reasoning share ${percent(reasoning)}, wants ${percent(minReasoning)}-${percent(maxReasoning)}`)
  }
  // A level of a handful of questions (ranked levels 4-5) may be all fact.
  for (const level of LEVELS) {
    if (targets[level] < 5) continue
    if (!questions.some((question) => question.level === level && question.kind !== 'fact')) problems.push(`level ${level} has no reasoning question`)
  }

  const categories = new Set(questions.map(({ category }) => category))
  if (categories.size < 10) problems.push(`only ${categories.size} categories; spread across at least 10 of the 16`)

  if (total >= 40) {
    const [fewest, most] = [Math.round(total * 0.14), Math.round(total * 0.36)]
    for (let index = 0; index < OPTIONS_COUNT; index++) {
      const count = questions.filter(({ correctIndex }) => correctIndex === index).length
      if (count < fewest || count > most) problems.push(`correct answer is option ${index} in ${count} questions; vary it (${fewest}-${most} each)`)
    }
  }

  return problems
}

/** Letters and digits only, so "Saturday." and "saturday" match. Small bare numbers answer too many puzzles to mean anything. */
const answerKey = (question: CounterpartQuestion): string | null => {
  const key = (question.options[question.correctIndex] ?? '').normalize('NFC').toLocaleLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '')
  return key && !/^\p{N}{1,3}$/u.test(key) ? key : null
}

/**
 * Pairs of questions with the same correct answer, in the file or against its counterpart. Not a
 * failure: "three" answers a riddle and a count of provinces alike. Each is for a person to read
 * and confirm the two are about different things.
 */
export const sameAnswerPairs = (questions: readonly SeedQuestion[], counterpart?: Counterpart): string[] => {
  const describe = (question: CounterpartQuestion) => question.gloss ?? question.text
  const notes: string[] = []
  const seen = new Map<string, number>()
  const counterpartAnswers = new Map<string, number>()
  counterpart?.questions.forEach((question, index) => {
    const key = answerKey(question)
    if (key && !counterpartAnswers.has(key)) counterpartAnswers.set(key, index)
  })

  questions.forEach((question, index) => {
    const key = answerKey(question)
    if (!key) return
    const earlier = seen.get(key)
    if (earlier !== undefined) notes.push(`#${earlier + 1} and #${index + 1}:\n      ${describe(questions[earlier]!)}\n      ${describe(question)}`)
    else seen.set(key, index)
    const other = counterpartAnswers.get(key)
    if (other !== undefined && counterpart) {
      notes.push(`#${index + 1} and ${counterpart.name} #${other + 1}:\n      ${describe(question)}\n      ${describe(counterpart.questions[other]!)}`)
    }
  })
  return notes
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const locale = process.argv[2] ?? ''
  const kind = (process.argv[3] ?? 'classic') as SeedKind
  if (!SEED_KINDS.includes(kind)) {
    console.error(`Unknown kind "${kind}": classic or ranked`)
    process.exit(1)
  }
  const file = seedFilePath(kind, locale)
  if (!existsSync(file)) {
    console.error(`Not found: ${file}`)
    process.exit(1)
  }
  let questions: SeedQuestion[]
  try {
    questions = JSON.parse(readFileSync(file, 'utf8')) as SeedQuestion[]
    if (!Array.isArray(questions)) throw new Error('not an array')
  } catch (error) {
    console.error(`Not valid JSON: ${(error as Error).message}`)
    process.exit(1)
  }
  const counterpart = readCounterpart(kind, locale)
  const problems = checkSeed(locale, kind, questions, counterpart)
  const notes = sameAnswerPairs(questions, counterpart)
  if (notes.length) {
    console.log(`Same correct answer; confirm each pair is about different things:`)
    for (const note of notes) console.log(`  - ${note}`)
  }
  if (problems.length) {
    console.error(`${locale} ${kind}: ${problems.length} problem(s)`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(`${locale} ${kind}: ${questions.length} questions, all checks passed`)
}
