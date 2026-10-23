import { type Schema, Type } from '@google/genai'
import { createHash } from 'node:crypto'
import { config } from '../config.js'
import { type Category, type Level, OPTIONS_COUNT } from '../lib/game.js'
import { CHECKER_MODEL, clip, generateJson } from '../lib/gemini.js'
import { type Locale, LOCALE_INFO } from '../lib/locales.js'

/**
 * Writing quiz questions with Gemini.
 *
 * The prompt asks for questions **written natively** in the target language and anchored in
 * its culture, not translated from English: a pun, an idiom or a "which of these rhymes"
 * question only works in the language it was written in, and a question about a local
 * poet or holiday is what makes the game feel like it belongs to its players.
 *
 * Everything the model returns is validated (`parseGeneratedQuestions`) before it can reach
 * the pool, and optionally cross-checked by a second, blind model pass (`checkAnswers`).
 */

export type GeneratedQuestion = {
  text: string
  options: string[]
  correctIndex: number
  explanation: string
  scope: 'global' | 'local'
  hash: string
}

const MAX_QUESTION_LENGTH = 300
const MAX_OPTION_LENGTH = 120
const MAX_EXPLANATION_LENGTH = 300

const LEVEL_GUIDE: Record<Level, string> = {
  1: 'Level 1 (very easy, the $100–$300 questions): almost every adult in the region knows the answer instantly. Light-hearted, show-style questions — everyday life, common sayings, playful wordplay that works in this language — are welcome.',
  2: 'Level 2 (easy, $500–$2,000): common general knowledge most adults know.',
  3: 'Level 3 (medium, $4,000–$16,000): needs solid general knowledge; a casual player hesitates.',
  4: 'Level 4 (hard, $32,000–$125,000): a keen quiz enthusiast knows it; most people would need a lifeline.',
  5: 'Level 5 (very hard, $250,000–$1,000,000): expert-level but fair — one precise, verifiable fact, never trivia that is disputed or outdated.',
}

const CATEGORY_GUIDE: Record<Category, string> = {
  general: 'general knowledge of any kind',
  history: 'history — events, people, dates, empires, inventions',
  geography: 'geography — countries, capitals, rivers, mountains, landmarks, flags',
  science: 'science — physics, chemistry, biology, astronomy, the human body, mathematics',
  nature: 'nature — animals, plants, weather, ecosystems',
  literature: 'literature — writers, poets, books, characters, famous lines',
  art: 'art and architecture — painters, sculptures, buildings, styles',
  music: 'music — composers, performers, songs, instruments, genres',
  filmTv: 'film and television — movies, series, actors, directors, cartoons',
  sports: 'sports — teams, athletes, competitions, rules, records',
  technology: 'technology — computers, the internet, gadgets, engineering, inventions',
  food: 'food and drink — dishes, ingredients, cuisines, customs at the table',
  mythology: 'mythology, legends, folklore and religion (respectfully, factual only)',
  language: 'language and words — meanings, idioms, proverbs, spelling, etymology in this language',
  popCulture: 'pop culture — celebrities, viral moments, games, fashion, brands (stick to facts that will not go stale within a year)',
  localCulture: 'the local culture itself — traditions, holidays, famous people, landmarks, folk tales, cuisine and everyday life',
}

const QUESTIONS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: '4', maxItems: '4' },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          scope: { type: Type.STRING, enum: ['global', 'local'] },
        },
        required: ['question', 'options', 'correctIndex', 'explanation', 'scope'],
        propertyOrdering: ['question', 'options', 'correctIndex', 'explanation', 'scope'],
      },
    },
  },
  required: ['questions'],
}

const buildSystemInstruction = (locale: Locale): string => {
  const { name, culture } = LOCALE_INFO[locale]
  return [
    `You write questions for "Who Wants to Be a Millionaire"-style quiz games, in ${name}.`,
    `Write every question, option and explanation directly in natural, native ${name} — never translate from English, and never mix languages.`,
    `Your players are speakers of ${name}, mostly from ${culture}. Questions marked "local" must be about that culture; "global" ones must be equally meaningful anywhere in the world.`,
    'Rules for every question:',
    '- Exactly four options of the same kind (all people, all years, all cities…), similar in length and plausibility.',
    '- Exactly one option is correct, and the fact is stable, well documented and not disputed. If unsure, write a different question.',
    '- The question must not give away the answer, and no option may be "all of the above" or "none of the above".',
    '- No questions whose answer depends on the language itself (e.g. "how many letters are in this word") unless the category is about language.',
    '- No politics, tragedies, or anything offensive, sexual or divisive.',
    '- correctIndex is the 0-based index of the correct option. Vary its position across questions.',
    '- explanation: one short sentence with the fact behind the answer.',
  ].join('\n')
}

export type GenerateParams = {
  locale: Locale
  category: Category
  level: Level
  count: number
  /** Recent questions from the same bucket, so the model does not write them again. */
  avoid: string[]
}

const buildPrompt = ({ locale, category, level, count, avoid }: GenerateParams): string => {
  const { culture } = LOCALE_INFO[locale]
  const mix =
    category === 'localCulture'
      ? `All of them must be "local", about the culture of ${  culture  }.`
      : `About 40% should be "local" (about ${culture}); the rest "global".`
  const avoidText = avoid.length
    ? `\nDo not repeat or rephrase any of these existing questions:\n${avoid.map((text) => `- ${text}`).join('\n')}`
    : ''

  return [
    `Write ${count} different quiz questions.`,
    `Category: ${CATEGORY_GUIDE[category]}.`,
    LEVEL_GUIDE[level],
    mix,
    avoidText,
  ].join('\n')
}

/** Lowercased, punctuation- and whitespace-free text, so trivial rewordings collide. */
export const questionHash = (text: string): string =>
  createHash('sha1')
    .update(text.toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu, ''))
    .digest('hex')

/** Fisher–Yates over `0..length-1`. */
export const shuffledOrder = (length: number, random: () => number = Math.random): number[] => {
  const order = Array.from({ length }, (_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}

/** Shuffles the options, carrying the correct index along. */
export const shuffleOptions = (
  options: string[],
  correctIndex: number,
  random: () => number = Math.random
): { options: string[]; correctIndex: number } => {
  const order = shuffledOrder(options.length, random)
  return { options: order.map((index) => options[index]!), correctIndex: order.indexOf(correctIndex) }
}

/**
 * Validates the model's JSON. Every check is a reason a question would be wrong or unfair
 * in play; a failing question is dropped, never repaired.
 */
export const parseGeneratedQuestions = (text: string, locale: Locale): GeneratedQuestion[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }

  const items = (parsed as { questions?: unknown })?.questions
  if (!Array.isArray(items)) return []

  const script = LOCALE_INFO[locale].script
  const seen = new Set<string>()

  return items.flatMap((item): GeneratedQuestion[] => {
    const raw = item as Record<string, unknown>
    const question = clip(raw.question, MAX_QUESTION_LENGTH)
    if (question.length < 8) return []
    if (script && !script.test(question)) return []

    const rawOptions = Array.isArray(raw.options) ? raw.options : []
    const options = rawOptions.map((option) => clip(option, MAX_OPTION_LENGTH))
    if (options.length !== OPTIONS_COUNT || options.some((option) => !option)) return []
    if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== OPTIONS_COUNT) return []

    const correctIndex = raw.correctIndex
    if (typeof correctIndex !== 'number' || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      return []
    }

    // An answer that appears verbatim in the question is a giveaway.
    if (question.toLocaleLowerCase().includes(options[correctIndex]!.toLocaleLowerCase()) && options[correctIndex]!.length > 3) {
      return []
    }

    const hash = questionHash(question)
    if (seen.has(hash)) return []
    seen.add(hash)

    const shuffled = shuffleOptions(options, correctIndex)
    return [
      {
        text: question,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: clip(raw.explanation, MAX_EXPLANATION_LENGTH),
        scope: raw.scope === 'local' ? 'local' : 'global',
        hash,
      },
    ]
  })
}

const CHECK_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: { answers: { type: Type.ARRAY, items: { type: Type.INTEGER } } },
  required: ['answers'],
}

/**
 * A blind second opinion: a different model answers each question without being told the
 * answer, and any question where it disagrees is dropped. Costs one call per batch; when that
 * call fails the batch is kept, since losing good questions to a quota blip is worse.
 */
export const checkAnswers = async (questions: GeneratedQuestion[], locale: Locale): Promise<GeneratedQuestion[]> => {
  if (!questions.length) return questions

  const listing = questions
    .map((question, index) => `${index + 1}. ${question.text}\n${question.options.map((o, i) => `  ${i}) ${o}`).join('\n')}`)
    .join('\n\n')

  try {
    const { text } = await generateJson({
      model: CHECKER_MODEL,
      systemInstruction: `You are a careful quiz expert answering questions written in ${LOCALE_INFO[locale].name}. For each question, return the 0-based index of the correct option. Return -1 when no option is clearly correct.`,
      contents: listing,
      schema: CHECK_SCHEMA,
      temperature: 0,
      maxOutputTokens: 1024,
    })
    const answers = (JSON.parse(text) as { answers?: unknown }).answers
    if (!Array.isArray(answers) || answers.length !== questions.length) return questions
    return questions.filter((question, index) => answers[index] === question.correctIndex)
  } catch {
    return questions
  }
}

export type GenerationResult = { questions: GeneratedQuestion[]; model: string }

/** One Gemini call (plus the optional check). Throws `AllModelsFailedError` when the chain is exhausted. */
export const generateQuestions = async (params: GenerateParams): Promise<GenerationResult> => {
  const { text, model } = await generateJson({
    systemInstruction: buildSystemInstruction(params.locale),
    contents: buildPrompt(params),
    schema: QUESTIONS_SCHEMA,
    maxOutputTokens: 8192,
  })

  const parsed = parseGeneratedQuestions(text, params.locale)
  const questions = config.gemini.verifyQuestions ? await checkAnswers(parsed, params.locale) : parsed
  return { questions, model }
}
