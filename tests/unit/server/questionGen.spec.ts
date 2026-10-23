import { describe, expect, it } from 'vitest'
import { parseGeneratedQuestions, questionHash, shuffleOptions } from '../../../server/src/services/questionGen'

const valid = {
  question: 'Which planet is known as the Red Planet?',
  options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
  correctIndex: 1,
  explanation: 'Iron oxide gives Mars its colour.',
  scope: 'global',
}

const parse = (questions: unknown[], locale: Parameters<typeof parseGeneratedQuestions>[1] = 'en') =>
  parseGeneratedQuestions(JSON.stringify({ questions }), locale)

describe('parseGeneratedQuestions', () => {
  it('keeps a valid question and still points at the right answer after shuffling', () => {
    const [question] = parse([valid])
    expect(question).toBeDefined()
    expect(question!.options[question!.correctIndex]).toBe('Mars')
    expect([...question!.options].sort()).toEqual([...valid.options].sort())
  })

  it('rejects malformed JSON and a missing list', () => {
    expect(parseGeneratedQuestions('not json', 'en')).toEqual([])
    expect(parseGeneratedQuestions('{"items": []}', 'en')).toEqual([])
  })

  it.each([
    ['three options', { ...valid, options: ['A', 'B', 'C'] }],
    ['duplicate options', { ...valid, options: ['Mars', 'mars', 'Venus', 'Saturn'] }],
    ['an empty option', { ...valid, options: ['Mars', '', 'Venus', 'Saturn'] }],
    ['an index out of range', { ...valid, correctIndex: 4 }],
    ['a fractional index', { ...valid, correctIndex: 1.5 }],
    ['a too-short question', { ...valid, question: 'Why?' }],
    ['the answer inside the question', { ...valid, question: 'Is Mars the Red Planet, or which planet is?' }],
  ])('drops a question with %s', (_label, question) => {
    expect(parse([question])).toEqual([])
  })

  it('drops questions written in the wrong script', () => {
    expect(parse([valid], 'ja')).toEqual([])
    expect(parse([{ ...valid, question: '赤い惑星として知られている惑星はどれ？' }], 'ja')).toHaveLength(1)
  })

  it('keeps one copy of a question repeated in the same batch', () => {
    expect(parse([valid, { ...valid, question: 'Which planet is known as the red planet ?' }])).toHaveLength(1)
  })
})

describe('questionHash', () => {
  it('ignores case, punctuation and spacing', () => {
    expect(questionHash('Which planet is red?')).toBe(questionHash('which  planet is RED'))
    expect(questionHash('Which planet is red?')).not.toBe(questionHash('Which planet is blue?'))
  })
})

describe('shuffleOptions', () => {
  it('carries the correct index along', () => {
    const random = (() => {
      let n = 0.1
      return () => (n = (n * 7.3) % 1)
    })()
    for (let run = 0; run < 20; run++) {
      const shuffled = shuffleOptions(['a', 'b', 'c', 'd'], 2, random)
      expect(shuffled.options[shuffled.correctIndex]).toBe('c')
    }
  })
})
