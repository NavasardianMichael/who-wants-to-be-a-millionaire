import { type Schema, Type } from '@google/genai'
import { createHash } from 'node:crypto'
import { config } from '../config.js'
import { type Category, type Level, OPTIONS_COUNT } from '../lib/game.js'
import { CHECKER_MODEL, clip, generateJson, WRITER_MODEL } from '../lib/gemini.js'
import { type Locale, LOCALE_INFO, type LocaleInfo } from '../lib/locales.js'

/**
 * Writing quiz questions with Gemini.
 *
 * The prompt asks for questions **written natively** in the target language and anchored in
 * its culture, not translated from English: a pun, an idiom or a "which of these rhymes"
 * question only works in the language it was written in, and a question about a local
 * poet or holiday is what makes the game feel like it belongs to its players.
 *
 * The model writes the fact first (`explanation` leads the schema) and builds the question on
 * it, so it commits to something it knows before it phrases anything.
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
/** Below this share of letters in the locale's own script, the question was half-written in another language. */
const MIN_SCRIPT_SHARE = 0.6

const LEVEL_GUIDE: Record<Level, string> = {
  1: 'Level 1 (very easy, the $100–$300 questions): almost every adult in the region knows the answer instantly — school basics, everyday knowledge, a well-known proverb or saying. Easy, but still a real question with three clearly wrong options, not a joke.',
  2: 'Level 2 (easy, $500–$2,000): common general knowledge that most adults who read and follow the news know.',
  3: 'Level 3 (medium, $4,000–$16,000): needs solid general knowledge or a moment of reasoning; a casual player hesitates between two options.',
  4: 'Level 4 (hard, $32,000–$125,000): a well-read, curious person can get it by knowledge or deduction; most people would need a lifeline.',
  5: 'Level 5 (very hard, $250,000–$1,000,000): expert-level but fair — one precise, verifiable fact that a true expert knows, never obscure trivia, a disputed claim or an outdated record.',
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
        required: ['explanation', 'question', 'options', 'correctIndex', 'scope'],
        propertyOrdering: ['explanation', 'question', 'options', 'correctIndex', 'scope'],
      },
    },
  },
  required: ['questions'],
}

const buildSystemInstruction = (locale: Locale): string => {
  const { name, culture, writing }: LocaleInfo = LOCALE_INFO[locale]
  return [
    `You are an experienced editor of a national "Who Wants to Be a Millionaire"-style TV quiz, writing in ${name} for an audience from ${culture}.`,
    `Write every question, option and explanation directly in natural, native ${name}, the way a well-educated native quiz writer would — never translate from English in your head, and never mix languages.`,
    writing ?? '',
    'What makes a good question:',
    '- It tests knowledge, being well-informed or reasoning — the kind a smart player is proud to get right. Prefer questions that make the player think (connect two facts, reason it out, recall precisely) over bare lookups of numbers.',
    '- It is academically correct: a stable, well-documented, undisputed fact that a textbook or encyclopedia states the same way. If you are not certain, choose a fact you are certain of. Never invent a person, work, date, place or quotation.',
    '- It is interesting: the answer teaches something or recalls something worth knowing. No weird, contrived or pointless questions.',
    '- It reads like a human quiz host wrote it: short, clear and direct. Avoid stock machine phrasing ("Which of the following…", "What is known as…", "is famous for being…"), bureaucratic or textbook wording, and the stalest "biggest / first / most famous" questions.',
    `- "local" questions draw on what an educated person from ${culture} learns at school and through life — its history, writers, scientists, artists, landmarks, language and traditions — and must ring true to them, not read like a foreigner's guidebook. "global" questions are about the wider world and equally fair anywhere, but still phrased natively, with names in their established ${name} spelling.`,
    'Rules for the four options:',
    '- Exactly four options of the same kind (all people, all years, all cities…), similar in length, style and plausibility, each a real thing of that kind — no invented names or joke options.',
    '- Each option fits the question grammatically (case, number, gender, word form) exactly as the correct one does, so grammar never gives the answer away.',
    '- The wrong options tempt someone who half-knows the subject, yet are clearly wrong to someone who knows it. Exactly one option is correct.',
    '- No "all of the above" or "none of the above", and the question must not give away the answer.',
    'Other rules:',
    '- Numbers, dates, units and names are written as speakers of this language write them; use the metric system unless the culture does not.',
    '- No questions whose answer depends on the language itself (e.g. "how many letters are in this word") unless the category is about language.',
    '- No politics, wars, tragedies, or anything offensive, sexual or divisive.',
    '- In one batch every question is about a different subject — never two about the same person, event or work — and the phrasing varies.',
    '- explanation: one short sentence stating the fact the question is built on; write it first. Never start it with "Correct" or similar.',
    '- correctIndex is the 0-based index of the correct option. Vary its position across questions.',
  ]
    .filter(Boolean)
    .join('\n')
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

/** The share of the text's letters that are in `script`; 1 when it has no letters. */
export const scriptShare = (text: string, script: RegExp): number => {
  const letters = text.match(/\p{L}/gu) ?? []
  return letters.length ? letters.filter((letter) => script.test(letter)).length / letters.length : 1
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

  const { script, notNative }: LocaleInfo = LOCALE_INFO[locale]
  const seen = new Set<string>()

  return items.flatMap((item): GeneratedQuestion[] => {
    const raw = item as Record<string, unknown>
    const question = clip(raw.question, MAX_QUESTION_LENGTH)
    if (question.length < 8) return []
    if (script && scriptShare(question, script) < MIN_SCRIPT_SHARE) return []
    if (notNative?.test(question)) return []

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
      systemInstruction: `You are a careful quiz expert answering questions written in ${LOCALE_INFO[locale].name}. For each question, return the 0-based index of the correct option. Return -1 when no option is clearly correct, or when more than one could be argued correct.`,
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

export type GenerationResult = { questions: GeneratedQuestion[]; model: string; truncated: boolean }

/** One Gemini call (plus the optional check). Throws `AllModelsFailedError` when the chain is exhausted. */
export const generateQuestions = async (params: GenerateParams): Promise<GenerationResult> => {
  const { text, model, truncated } = await generateJson({
    startAt: WRITER_MODEL,
    systemInstruction: buildSystemInstruction(params.locale),
    contents: buildPrompt(params),
    schema: QUESTIONS_SCHEMA,
    // Thinking counts toward the cap, and non-Latin scripts take several tokens per word.
    maxOutputTokens: 16384,
  })

  const parsed = parseGeneratedQuestions(text, params.locale)
  const questions = config.gemini.verifyQuestions ? await checkAnswers(parsed, params.locale) : parsed
  return { questions, model, truncated }
}
