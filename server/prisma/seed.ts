import { PrismaClient } from '@prisma/client'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkClassicSeed, type ClassicSeedQuestion } from './check-classic-seed.js'
import { isCategory, isLevel, OPTIONS_COUNT } from '../src/lib/game.js'
import { questionHash, shuffleOptions } from '../src/services/questionGen.js'

import '../src/load-env.js'

/**
 * Loads the curated English fallback bank (`seed/fallback-questions.en.json`) into the pool
 * as `origin: 'seed'`. Idempotent: re-running skips questions whose hash already exists, so
 * adding questions to the file and seeding again only inserts the new ones, and retires the
 * seeded questions that are no longer in the file.
 */
type SeedQuestion = {
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

const isValid = (question: SeedQuestion): boolean =>
  isCategory(question.category) &&
  isLevel(question.level) &&
  typeof question.text === 'string' &&
  Array.isArray(question.options) &&
  question.options.length === OPTIONS_COUNT &&
  Number.isInteger(question.correctIndex) &&
  question.correctIndex >= 0 &&
  question.correctIndex < OPTIONS_COUNT

const main = async () => {
  const questions = JSON.parse(await readFile(SEED_FILE, 'utf8')) as SeedQuestion[]
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
  const { count: retired } = await prisma.question.updateMany({
    where: {
      origin: 'seed',
      locale: 'en',
      retiredAt: null,
      hash: { notIn: questions.map((question) => questionHash(question.text)) },
    },
    data: { retiredAt: new Date() },
  })

  console.log(`Seeded ${count} new fallback questions, retired ${retired} (${questions.length} in the bank).`)

  await seedClassicBanks()
}

/** `seed/classic/` beside this file under tsx, or under the release's `prisma/` when compiled. */
const SEED_DIR_CANDIDATES = [
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed'),
  path.resolve(process.cwd(), 'prisma', 'seed'),
]

const readTexts = async (file: string): Promise<string[]> =>
  existsSync(file) ? (JSON.parse(await readFile(file, 'utf8')) as { text: string }[]).map(({ text }) => text) : []

/**
 * The hand-written Classic banks, one file per language (`seed/classic/<locale>.json`, English
 * excepted: its bank is the fallback file above). A file that fails `checkClassicSeed` stops
 * the seed, so a bad bank never half-loads. Like the English bank, each file is mirrored: a
 * public seed question no longer in it is retired — unless its language's ranked file
 * (`seed/ranked/<locale>.json`) lists it, because ranked questions graduate into Classic.
 */
const seedClassicBanks = async () => {
  const seedDir = SEED_DIR_CANDIDATES.find((candidate) => existsSync(path.join(candidate, 'classic')))
  if (!seedDir) return

  const files = (await readdir(path.join(seedDir, 'classic'))).filter((name) => name.endsWith('.json')).sort()
  for (const file of files) {
    const locale = file.replace(/\.json$/, '')
    if (locale === 'en') {
      console.warn('seed/classic/en.json skipped: English Classic questions live in the fallback bank')
      continue
    }

    const questions = JSON.parse(await readFile(path.join(seedDir, 'classic', file), 'utf8')) as ClassicSeedQuestion[]
    const problems = checkClassicSeed(locale, questions)
    if (problems.length) throw new Error(`seed/classic/${file} fails its checks:\n  ${problems.join('\n  ')}`)

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
          hash: questionHash(question.text),
        }
      }),
      skipDuplicates: true,
    })

    const keep = [...questions.map(({ text }) => text), ...(await readTexts(path.join(seedDir, 'ranked', file)))].map(questionHash)
    const { count: retired } = await prisma.question.updateMany({
      where: { origin: 'seed', locale, ranked: false, retiredAt: null, hash: { notIn: keep } },
      data: { retiredAt: new Date() },
    })

    console.log(`Classic ${locale}: ${count} new, ${retired} retired (${questions.length} in the bank).`)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
