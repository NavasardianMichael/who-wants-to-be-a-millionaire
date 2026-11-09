import { describe, expect, it } from 'vitest'
import { applyCheck, type GeneratedQuestion, parseGeneratedQuestions, questionHash, shuffleOptions } from '../../../server/src/services/questionGen'

const valid = {
  question: 'Which planet is known as the Red Planet?',
  options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
  correctIndex: 1,
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

  it('drops quotation marks wrapping the whole question, and only those', () => {
    expect(parse([{ ...valid, question: '« Quelle planète est surnommée la planète rouge ? »' }])[0]!.text).toBe(
      'Quelle planète est surnommée la planète rouge ?'
    )
    expect(parse([{ ...valid, question: '"Which planet is known as the Red Planet?"' }])[0]!.text).toBe(valid.question)
    expect(parse([{ ...valid, question: 'Who wrote "Hamlet" and "Macbeth"?', options: ['A', 'B', 'C', 'D'] }])[0]!.text).toBe(
      'Who wrote "Hamlet" and "Macbeth"?'
    )
    expect(parse([{ ...valid, question: '"Hamlet" was written by which playwright, "the Bard"', options: ['A', 'B', 'C', 'D'] }])[0]!.text).toBe(
      '"Hamlet" was written by which playwright, "the Bard"'
    )
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

  it('drops a question with a word that mixes two alphabets', () => {
    const czech = { ...valid, question: 'Která památka je zapsána jako jediná památka v zemi?' }
    expect(parse([czech], 'cs')).toHaveLength(1)
    expect(parse([{ ...czech, question: 'Která památka je zapsána jako единinná památka v zemi?' }], 'cs')).toEqual([])
    // Separate words in separate alphabets are fine, and Japanese mixes scripts inside words by design.
    expect(parse([{ ...valid, question: 'Как по-английски называют Красную планету — Mars?', options: ['A', 'B', 'C', 'D'] }], 'ru')).toHaveLength(1)
    expect(parse([{ ...valid, question: '赤い惑星として知られている惑星はどれ？' }], 'ja')).toHaveLength(1)
  })

  it('drops questions half-written in another language', () => {
    const armenian = { ...valid, question: 'Ո՞ր մոլորակն են անվանում Կարմիր մոլորակ։' }
    expect(parse([armenian], 'hy')).toHaveLength(1)
    expect(parse([{ ...armenian, question: 'Ո՞ր planet is known as the Red Planet?' }], 'hy')).toEqual([])
  })

  it('drops questions with punctuation a native text never uses', () => {
    expect(parse([{ ...valid, question: 'Ո՞ր մոլորակն են անվանում Կարմիր մոլորակ?' }], 'hy')).toEqual([])
    expect(parse([{ ...valid, question: 'Ποιος πλανήτης λέγεται Κόκκινος Πλανήτης?' }], 'el')).toEqual([])
    expect(parse([{ ...valid, question: 'Ποιος πλανήτης λέγεται Κόκκινος Πλανήτης;' }], 'el')).toHaveLength(1)
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

describe('applyCheck', () => {
  const question = (correctIndex: number): GeneratedQuestion => ({
    text: `Question ${correctIndex}`,
    options: ['a', 'b', 'c', 'd'],
    correctIndex,
    scope: 'global',
    hash: String(correctIndex),
  })
  const batch = [question(0), question(1), question(2)]

  it('drops a question the checker answers differently', () => {
    expect(applyCheck(batch, 3, { answers: [0, 2, 2], levels: [3, 3, 3] })).toEqual([batch[0], batch[2]])
  })

  it('drops a question rated two or more levels from its own', () => {
    expect(applyCheck(batch, 1, { answers: [0, 1, 2], levels: [1, 2, 3] })).toEqual([batch[0], batch[1]])
    expect(applyCheck(batch, 5, { answers: [0, 1, 2], levels: [5, 4, 2] })).toEqual([batch[0], batch[1]])
  })

  it('keeps the batch when the reply is malformed, and skips the level check without ratings', () => {
    expect(applyCheck(batch, 3, { answers: [0] })).toEqual(batch)
    expect(applyCheck(batch, 3, null)).toEqual(batch)
    expect(applyCheck(batch, 1, { answers: [0, 1, 2], levels: [5] })).toEqual(batch)
  })
})
