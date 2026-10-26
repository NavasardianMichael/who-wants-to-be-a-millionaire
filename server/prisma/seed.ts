import { PrismaClient } from '@prisma/client'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCategory, isLevel, OPTIONS_COUNT } from '../src/lib/game.js'
import { questionHash } from '../src/services/questionGen.js'

import 'dotenv/config'

/**
 * Loads the curated English fallback bank (`seed/fallback-questions.en.json`) into the pool
 * as `origin: 'seed'`. Idempotent: re-running skips questions whose hash already exists, so
 * adding questions to the file and seeding again only inserts the new ones.
 */
type SeedQuestion = {
  category: string
  level: number
  text: string
  options: string[]
  correctIndex: number
  explanation: string
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
      explanation: question.explanation,
      origin: 'seed' as const,
      hash: questionHash(question.text),
    })),
    skipDuplicates: true,
  })

  console.log(`Seeded ${count} new fallback questions (${questions.length} in the bank).`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
