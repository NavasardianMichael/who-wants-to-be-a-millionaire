import { PrismaClient } from '@prisma/client'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkSeed, readCounterpart, SEED_KINDS, type SeedQuestion } from './check-seed.js'
import { isCategory, isLevel, OPTIONS_COUNT } from '../src/lib/game.js'
import { questionHash, shuffleOptions } from '../src/services/questionGen.js'

import '../src/load-env.js'

/**
 * Loads the curated English fallback bank (`seed/fallback-questions.en.json`) into the pool
 * as `origin: 'seed'`. Idempotent: re-running skips questions whose hash already exists, so
 * adding questions to the file and seeding again only inserts the new ones, and retires the
 * seeded questions that are no longer in the file.
 */
type FallbackQuestion = {
  category: string
  level: number
  text: string
  options: string[]
  correctIndex: number
}

const prisma = new PrismaClient()
/**
 * Beside this file when run with tsx (`prisma/seed.ts`); from the working directory when run
 * compiled in a release (`node dist/prisma/seed.js`, cwd = the release, which ships `prisma/`).
 */
const SEED_CANDIDATES = [
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed', 'fallback-questions.en.json'),
  path.resolve(process.cwd(), 'prisma', 'seed', 'fallback-questions.en.json'),
]
const SEED_FILE = SEED_CANDIDATES.find((candidate) => existsSync(candidate)) ?? SEED_CANDIDATES[0]!

const isValid = (question: FallbackQuestion): boolean =>
  isCategory(question.category) &&
  isLevel(question.level) &&
  typeof question.text === 'string' &&
  Array.isArray(question.options) &&
  question.options.length === OPTIONS_COUNT &&
  Number.isInteger(question.correctIndex) &&
  question.correctIndex >= 0 &&
  question.correctIndex < OPTIONS_COUNT

const main = async () => {
  const questions = JSON.parse(await readFile(SEED_FILE, 'utf8')) as FallbackQuestion[]
  const invalid = questions.filter((question) => !isValid(question))
  if (invalid.length) throw new Error(`Invalid seed questions: ${invalid.map(({ text }) => text).join(' | ')}`)

  const { count } = await prisma.question.createMany({
    data: questions.map((question) => ({
      locale: 'en',
      category: question.category,
      level: question.level,
      scope: 'global' as const,
      text: question.text,
      options: question.options,
      correctIndex: question.correctIndex,
      origin: 'seed' as const,
      hash: questionHash(question.text),
    })),
    skipDuplicates: true,
  })

  // A question taken out of the bank file is retired; the cleanup job deletes it once no run shows it.
  // English ranked seeds are not the bank's: those still in the reserve are left alone, and
  // those that graduated into Classic are kept while `seed/ranked/en.json` lists them.
  const rankedEnglish = await readTexts(path.join(path.dirname(SEED_FILE), 'ranked', 'en.json'))
  const { count: retired } = await prisma.question.updateMany({
    where: {
      origin: 'seed',
      locale: 'en',
      ranked: false,
      retiredAt: null,
      hash: { notIn: [...questions.map(({ text }) => text), ...rankedEnglish].map(questionHash) },
    },
    data: { retiredAt: new Date() },
  })

  console.log(`Seeded ${count} new fallback questions, retired ${retired} (${questions.length} in the bank).`)

  await seedHandWrittenBanks()
}

/** `seed/` beside this file under tsx, or under the release's `prisma/` when compiled. */
const SEED_DIR_CANDIDATES = [
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed'),
  path.resolve(process.cwd(), 'prisma', 'seed'),
]

const readTexts = async (file: string): Promise<string[]> =>
  existsSync(file) ? (JSON.parse(await readFile(file, 'utf8')) as { text: string }[]).map(({ text }) => text) : []

/**
 * The hand-written banks, one file per language and kind:
 *
 * - `seed/classic/<locale>.json`, public Classic questions (English excepted: its Classic bank
 *   is the fallback file above);
 * - `seed/ranked/<locale>.json`, the ranked reserve, which no answer-carrying endpoint serves.
 *
 * A file that fails `checkSeed` (including a question repeated from the language's other file)
 * stops the seed, so a bad bank never half-loads. Like the English bank, each file is mirrored:
 * a seed question no longer in its file is retired. A ranked question that has graduated into
 * Classic is public now and stays while either file lists it.
 */
const seedHandWrittenBanks = async () => {
  const seedDir = SEED_DIR_CANDIDATES.find((candidate) => existsSync(path.join(candidate, 'classic')))
  if (!seedDir) return

  const filesOf = async (kind: string) => {
    const dir = path.join(seedDir, kind)
    return existsSync(dir) ? (await readdir(dir)).filter((name) => name.endsWith('.json')) : []
  }
  const locales = [...new Set((await Promise.all(SEED_KINDS.map(filesOf))).flat())].map((file) => file.replace(/\.json$/, '')).sort()

  for (const locale of locales) {
    for (const kind of SEED_KINDS) {
      const file = path.join(seedDir, kind, `${locale}.json`)
      if (!existsSync(file)) continue
      if (kind === 'classic' && locale === 'en') {
        console.warn('seed/classic/en.json skipped: English Classic questions live in the fallback bank')
        continue
      }

      const questions = JSON.parse(await readFile(file, 'utf8')) as SeedQuestion[]
      const problems = checkSeed(locale, kind, questions, readCounterpart(kind, locale, seedDir))
      if (problems.length) throw new Error(`seed/${kind}/${locale}.json fails its checks:\n  ${problems.join('\n  ')}`)

      const ranked = kind === 'ranked'
      // Inserts only: a text already in the pool (say, an AI question) is skipped, and a public question never turns ranked.
      const { count } = await prisma.question.createMany({
        data: questions.map((question) => {
          // Stored in a random order, like every AI question; re-seeding skips it by hash, so the order holds.
          const { options, correctIndex } = shuffleOptions(question.options, question.correctIndex)
          return {
            locale,
            category: question.category,
            level: question.level,
            scope: question.scope,
            text: question.text,
            options,
            correctIndex,
            origin: 'seed' as const,
            ranked,
            hash: questionHash(question.text),
          }
        }),
        skipDuplicates: true,
      })

      const texts = questions.map(({ text }) => text)
      const keep = ranked ? texts : [...texts, ...(await readTexts(path.join(seedDir, 'ranked', `${locale}.json`)))]
      const { count: retired } = await prisma.question.updateMany({
        where: { origin: 'seed', locale, ranked, retiredAt: null, hash: { notIn: keep.map(questionHash) } },
        data: { retiredAt: new Date() },
      })

      console.log(`${ranked ? 'Ranked' : 'Classic'} ${locale}: ${count} new, ${retired} retired (${questions.length} in the bank).`)
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
