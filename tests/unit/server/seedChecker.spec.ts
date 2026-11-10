import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  checkSeed,
  currentTargets,
  LEVEL_TARGETS,
  readCounterpart,
  sameAnswerPairs,
  SEED_KINDS,
  seedFilePath,
  type SeedKind,
  type SeedQuestion,
} from '../../../server/prisma/check-seed'
import { CATEGORIES, LEVELS } from '../../../server/src/lib/game'

const WORDS = ['amber', 'birch', 'cedar', 'delta', 'ember', 'fjord', 'grove', 'harbor', 'iris', 'juniper']

/** Ranked: a fifth reasoning, at levels 1-3. Classic: two fifths, never pure reasoning at levels 4-5. */
const kindAt = (kind: SeedKind, index: number, level: number): SeedQuestion['kind'] => {
  if (index % 5 === 0 && level <= 3) return 'reasoning+fact'
  if (kind === 'classic' && index % 5 === 1) return level <= 3 ? 'reasoning' : 'reasoning+fact'
  return 'fact'
}

/** A file that meets every rule of its kind: the right count per level, 40% local, 20% reasoning, varied answers. */
const validFile = (kind: SeedKind): SeedQuestion[] =>
  LEVELS.flatMap((level) => Array.from({ length: currentTargets(kind)[level] }, () => level)).map((level, index) => ({
    level,
    category: CATEGORIES[index % 12]!,
    scope: index % 5 < 2 ? 'local' : 'global',
    kind: kindAt(kind, index, level),
    text: `Which ${WORDS[index % 10]} fits riddle ${kind} ${index}?`,
    options: [`Choice ${index}a`, `Choice ${index}b`, `Choice ${index}c`, `Choice ${index}d`],
    correctIndex: index % 4,
    gloss: `Riddle ${index} — choice ${index % 4}`,
  }))

describe('checkSeed', () => {
  it.each(SEED_KINDS)('passes a well-formed %s file', (kind) => {
    expect(checkSeed('en', kind, validFile(kind))).toEqual([])
  })

  it('holds each kind to its own level targets', () => {
    expect(checkSeed('en', 'classic', validFile('ranked'))).toContain('levels 1-5 have 28/14/5/2/1 questions, wants 10/10/10/10/10')
  })

  it('accepts a file that matches any phase, so a phase can roll out one language at a time', () => {
    const phases = LEVEL_TARGETS.classic
    LEVEL_TARGETS.classic = [...phases, { 1: 12, 2: 10, 3: 10, 4: 10, 5: 10 }]
    try {
      const old = validFile('ranked').filter(({ level }) => level > 1)
      expect(checkSeed('en', 'classic', validFile('classic'))).toEqual([])
      expect(checkSeed('en', 'classic', old)).toContain("levels 1-5 have 0/14/5/2/1 questions, wants 12/10/10/10/10 (or an earlier phase's 10/10/10/10/10)")
    } finally {
      LEVEL_TARGETS.classic = phases
    }
  })

  it('keeps ranked questions short', () => {
    const file = validFile('ranked')
    file[0] = { ...file[0]!, text: `Which ${'very '.repeat(40)}long riddle?` }
    expect(checkSeed('en', 'ranked', file)).toContain('#1 (L1): text must be 8-160 characters')
  })

  it('rejects a question repeated from the language’s other file', () => {
    const file = validFile('ranked')
    const counterpart = { name: 'classic/en.json', questions: [{ text: file[3]!.text.toUpperCase(), options: ['a', 'b', 'c', 'd'], correctIndex: 0 }] }
    expect(checkSeed('en', 'ranked', file, counterpart)).toContain('#4 (L1): same question as classic/en.json #1')
  })
})

describe('sameAnswerPairs', () => {
  const question = (text: string, answer: string): SeedQuestion => ({
    level: 1,
    category: 'general',
    scope: 'global',
    kind: 'fact',
    text,
    options: [answer, 'x', 'y', 'z'],
    correctIndex: 0,
    gloss: `${text} — ${answer}`,
  })

  it('lists a shared answer within the file and against the other file, ignoring case and punctuation', () => {
    const notes = sameAnswerPairs([question('Q one', 'Saturday'), question('Q two', 'saturday.')], {
      name: 'classic/en.json',
      questions: [question('Q three', 'SATURDAY')],
    })
    expect(notes).toHaveLength(3)
    expect(notes[1]).toContain('#1 and #2')
  })

  it('ignores small bare numbers, which answer too many puzzles to mean anything', () => {
    expect(sameAnswerPairs([question('Q one', '12'), question('Q two', '12')])).toEqual([])
  })
})

describe('the committed seed files', () => {
  for (const kind of SEED_KINDS) {
    const dir = path.dirname(seedFilePath(kind, 'xx'))
    const locales = existsSync(dir) ? readdirSync(dir).map((file) => file.replace(/\.json$/, '')).filter((locale) => locale !== 'en' || kind === 'ranked') : []
    it.each(locales)(`${kind} %s passes its checks`, (locale) => {
      const questions = JSON.parse(readFileSync(seedFilePath(kind, locale), 'utf8')) as SeedQuestion[]
      expect(checkSeed(locale, kind, questions, readCounterpart(kind, locale))).toEqual([])
    })
  }
})
