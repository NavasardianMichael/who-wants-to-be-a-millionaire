/**
 * Checks a hand-written Classic seed file, `prisma/seed/classic/<locale>.json`, before it is
 * loaded. The same checks `parseGeneratedQuestions` runs on AI output, plus the shape of a
 * good seed: 10 questions per level, a local/global and fact/reasoning mix, varied answers.
 *
 *   npx tsx prisma/check-classic-seed.ts hy        (from server/)
 *
 * Prints every problem and exits 1 if there is any.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCategory, LEVELS, OPTIONS_COUNT } from '../src/lib/game.js'
import { isLocale, LOCALE_INFO, type LocaleInfo } from '../src/lib/locales.js'
import { hasMixedScriptWord, questionHash, scriptShare } from '../src/services/questionGen.js'

export type ClassicSeedQuestion = {
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

export const PER_LEVEL = 10
const KINDS = ['fact', 'reasoning', 'reasoning+fact']

export const seedFilePath = (locale: string): string =>
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed', 'classic', `${locale}.json`)

export const checkClassicSeed = (locale: string, questions: ClassicSeedQuestion[]): string[] => {
  if (!isLocale(locale)) return [`unknown locale ${locale}`]
  const { script, notNative }: LocaleInfo = LOCALE_INFO[locale]
  const problems: string[] = []
  const hashes = new Map<string, number>()

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

    if (typeof text !== 'string' || text.trim().length < 8 || text.length > 300) {
      fail('text must be 8-300 characters')
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
    if (options.some((option) => typeof option !== 'string' || !option.trim() || option.length > 120)) fail('options must be 1-120 characters')
    if (options.some((option) => hasMixedScriptWord(option))) fail('an option mixes two alphabets in one word')
    if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== OPTIONS_COUNT) fail('options repeat')
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= OPTIONS_COUNT) {
      fail(`correctIndex ${correctIndex}`)
      return
    }
    const answer = options[correctIndex]!
    if (answer.length > 3 && text.toLocaleLowerCase().includes(answer.toLocaleLowerCase())) fail('the answer appears in the question')

    const hash = questionHash(text)
    if (hashes.has(hash)) fail(`same question as #${hashes.get(hash)! + 1}`)
    hashes.set(hash, index)
  })

  for (const level of LEVELS) {
    const count = questions.filter((question) => question.level === level).length
    if (count !== PER_LEVEL) problems.push(`level ${level} has ${count} questions, wants ${PER_LEVEL}`)
  }

  const total = questions.length
  const share = (predicate: (question: ClassicSeedQuestion) => boolean) => questions.filter(predicate).length / (total || 1)
  const local = share(({ scope }) => scope === 'local')
  if (local < 0.3 || local > 0.55) problems.push(`local share ${Math.round(local * 100)}%, wants about 40% (30-55%)`)
  const reasoning = share(({ kind }) => kind !== 'fact')
  if (reasoning < 0.3 || reasoning > 0.55) problems.push(`reasoning share ${Math.round(reasoning * 100)}%, wants about 40% (30-55%)`)
  for (const level of LEVELS) {
    if (!questions.some((question) => question.level === level && question.kind !== 'fact')) problems.push(`level ${level} has no reasoning question`)
  }

  const categories = new Set(questions.map(({ category }) => category))
  if (categories.size < 10) problems.push(`only ${categories.size} categories; spread across at least 10 of the 16`)

  for (let index = 0; index < OPTIONS_COUNT; index++) {
    const count = questions.filter(({ correctIndex }) => correctIndex === index).length
    if (total >= 40 && (count < 7 || count > 18)) problems.push(`correct answer is option ${index} in ${count} questions; vary it (7-18 each)`)
  }

  return problems
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const locale = process.argv[2] ?? ''
  const file = seedFilePath(locale)
  if (!existsSync(file)) {
    console.error(`Not found: ${file}`)
    process.exit(1)
  }
  let questions: ClassicSeedQuestion[]
  try {
    questions = JSON.parse(readFileSync(file, 'utf8')) as ClassicSeedQuestion[]
  } catch (error) {
    console.error(`Not valid JSON: ${(error as Error).message}`)
    process.exit(1)
  }
  const problems = checkClassicSeed(locale, Array.isArray(questions) ? questions : [])
  if (problems.length) {
    console.error(`${locale}: ${problems.length} problem(s)`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(`${locale}: ${questions.length} questions, all checks passed`)
}
