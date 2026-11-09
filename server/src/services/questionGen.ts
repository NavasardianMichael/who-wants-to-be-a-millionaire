import { createHash } from 'node:crypto'
import { config } from '../config.js'
import { clip, generateJson, type JsonSchema } from '../lib/ai/index.js'
import { type Category, type Level, OPTIONS_COUNT } from '../lib/game.js'
import { type Locale, LOCALE_INFO, type LocaleInfo } from '../lib/locales.js'

/**
 * Writing quiz questions with the AI provider (`lib/ai`).
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
  scope: 'global' | 'local'
  hash: string
}

const MAX_QUESTION_LENGTH = 300
const MAX_OPTION_LENGTH = 120
/** Below this share of letters in the locale's own script, the question was half-written in another language. */
const MIN_SCRIPT_SHARE = 0.6

/**
 * Difficulty is pinned to how many adults in the audience would answer without help, so the
 * model (and the checker) calibrate against one shared scale rather than their own sense of "hard".
 */
const LEVEL_GUIDE: Record<Level, string> = {
  1: 'Level 1 (very easy, questions 1–3, $100–$300): about 9 in 10 adults in the region answer instantly, without a moment of doubt — school basics, everyday knowledge, a well-known proverb or saying. Still a real question with three clearly wrong options, not a joke.',
  2: 'Level 2 (easy, questions 4–6, $500–$2,000): about 3 in 4 adults know it — common general knowledge of someone who reads and follows the news.',
  3: 'Level 3 (medium, questions 7–9, $4,000–$16,000): about half of adults get it — needs solid general knowledge or a moment of reasoning; a casual player hesitates between two options.',
  4: 'Level 4 (hard, questions 10–12, $32,000–$125,000): about 1 in 4 adults get it — a well-read, curious person, by knowledge or deduction; most people would need a lifeline.',
  5: 'Level 5 (very hard, questions 13–15, $250,000–$1,000,000): about 1 in 10 adults get it — expert-level but fair: one precise, verifiable fact a true expert or a very well-read person knows, never obscure trivia, a disputed claim or an outdated record.',
}

const LEVEL_SCALE = (Object.keys(LEVEL_GUIDE).map(Number) as Level[]).map((level) => `- ${LEVEL_GUIDE[level]}`).join('\n')

/** How far the checker's difficulty rating may stray from the asked level before a question is dropped. */
const MAX_LEVEL_DRIFT = 1

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

const QUESTIONS_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          correctIndex: { type: 'integer' },
          scope: { type: 'string', enum: ['global', 'local'] },
        },
        required: ['question', 'options', 'correctIndex', 'scope'],
      },
    },
  },
  required: ['questions'],
}

const buildSystemInstruction = (locale: Locale): string => {
  const { name, culture, writing }: LocaleInfo = LOCALE_INFO[locale]
  return [
    `You are an experienced editor of a national TV quiz, writing in ${name} for an audience from ${culture}.`,
    `Write every question and option directly in natural, native ${name}, the way a well-educated native quiz writer would — never translate from English in your head, and never mix languages.`,
    writing ?? '',
    'Your players are curious, intelligent adults, and they judge the game by its questions. Quality is not difficulty: an easy question can be as well made as a hard one. Every question, at every level, should be one a thoughtful player enjoys and would call clever, fair and worth asking.',
    'What makes a good question:',
    '- It has a hook: one interesting detail, link or angle that makes it more than a lookup — a familiar thing seen from a fresh side, two facts connected, a clue a thinking player can reason from. The best ones leave a small "aha" or "I didn\'t know that, nice" when the answer is revealed.',
    '- It rewards understanding over rote memory. Ask about causes, connections, meanings, who did what and why, rather than bare dates, counts or measurements; use an exact number or year only when it is iconic.',
    '- It is academically correct: a stable, well-documented, undisputed fact that a textbook or encyclopedia states the same way. If you are not certain, choose a fact you are certain of. Never invent a person, work, date, place or quotation.',
    '- It is unambiguous: one reading, one correct answer, no hidden trick. A knowledgeable player never feels cheated.',
    '- It reads like a witty, well-read human quiz host wrote it: short, clear and direct. Avoid stock machine phrasing ("Which of the following…", "What is known as…", "is famous for being…"), bureaucratic or textbook wording, and dictionary-definition questions.',
    '- Avoid the stale and the pointless: the questions every quiz has already asked ("capital of a famous country", "the biggest / first / most famous"), questions whose only difficulty is obscurity, and weird or contrived questions nobody would care about.',
    `- "local" questions draw on what an educated person from ${culture} learns at school and through life — its history, writers, scientists, artists, landmarks, language and traditions — and must ring true to them, not read like a foreigner's guidebook. "global" questions are about the wider world and equally fair anywhere, but still phrased natively, with names in their established ${name} spelling.`,
    'Rules for the four options:',
    '- Exactly four options of the same kind (all people, all years, all cities…), similar in length, style and plausibility, each a real thing of that kind — no invented names or joke options.',
    '- Each option fits the question grammatically (case, number, gender, word form) exactly as the correct one does, so grammar never gives the answer away.',
    '- The wrong options tempt someone who half-knows the subject, yet are clearly wrong to someone who knows it. Exactly one option is correct.',
    '- Take wrong options from close to the answer — the same era, region, field or family — so choosing needs real knowledge, not elimination of the absurd.',
    '- No pattern gives the answer away: the correct option is not the longest, the most specific or the odd one out.',
    '- No "all of the above" or "none of the above", and the question must not give away the answer.',
    'Other rules:',
    '- Every question is your own original writing. Never reproduce or reword a question that was asked on a real TV quiz show — "Who Wants to Be a Millionaire?" and its national editions above all — or one taken from a quiz book, a trivia website or a pub quiz.',
    '- Numbers, dates, units and names are written as speakers of this language write them; use the metric system unless the culture does not.',
    '- No questions whose answer depends on the language itself (e.g. "how many letters are in this word") unless the category is about language.',
    '- No politics, wars, tragedies, or anything offensive, sexual or divisive.',
    '- In one batch every question is about a different subject — never two about the same person, event or work — and the phrasing varies.',
    '- correctIndex is the 0-based index of the correct option. Vary its position across questions.',
    'Difficulty: the game climbs a ladder of 15 questions on this scale, and every question must sit exactly at the level it is written for. Judge difficulty by how many adults in the audience would answer without help, not by how hard it feels to you. A hook makes a question more interesting, never harder; an easy question stays easy, and a hard one is hard because of what it asks, not because it is vague or obscure.',
    LEVEL_SCALE,
    'Before you answer, review every question as a demanding head writer would: is the fact certain, is there exactly one right answer, is it at the right level, and would an intelligent player find it worth asking? Rewrite or replace any question that is flat, ambiguous, merely obscure, or easier or harder than its level.',
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
    `Every question at exactly this level — no easier, no harder: ${LEVEL_GUIDE[level]}`,
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

const ALPHABETS = [/\p{Script=Latin}/u, /\p{Script=Cyrillic}/u, /\p{Script=Greek}/u, /\p{Script=Armenian}/u, /\p{Script=Georgian}/u, /\p{Script=Arabic}/u, /\p{Script=Hebrew}/u]

/**
 * True when one word mixes two alphabets ("единinná") — a model slipping between languages
 * mid-word. Never valid in any language; CJK scripts, which do mix within a word, are not checked.
 */
export const hasMixedScriptWord = (text: string): boolean =>
  (text.match(/\p{L}+/gu) ?? []).some((word) => ALPHABETS.filter((alphabet) => alphabet.test(word)).length > 1)

const QUOTES ='"\'«»„“”‘’‚‹›「」『』'
const WRAPPED = new RegExp(`^[${QUOTES}]\\s*([^${QUOTES}]+?)\\s*[${QUOTES}]$`, 'u')

/** Some models wrap the whole question in quotation marks (« … »); a quote inside the question stays. */
export const unquote = (text: string): string => WRAPPED.exec(text)?.[1] ?? text

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
    const question = unquote(clip(raw.question, MAX_QUESTION_LENGTH))
    if (question.length < 8) return []
    if (script && scriptShare(question, script) < MIN_SCRIPT_SHARE) return []
    if (hasMixedScriptWord(question)) return []
    if (notNative?.test(question)) return []

    const rawOptions = Array.isArray(raw.options) ? raw.options : []
    const options = rawOptions.map((option) => clip(option, MAX_OPTION_LENGTH))
    if (options.length !== OPTIONS_COUNT || options.some((option) => !option || hasMixedScriptWord(option))) return []
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
        scope: raw.scope === 'local' ? 'local' : 'global',
        hash,
      },
    ]
  })
}

const CHECK_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    answers: { type: 'array', items: { type: 'integer' } },
    levels: { type: 'array', items: { type: 'integer' } },
  },
  required: ['answers', 'levels'],
}

/**
 * Keeps the questions the checker answered the same way and, when it rated difficulty, rated
 * within `MAX_LEVEL_DRIFT` of `level`. A malformed reply keeps the batch (see `checkAnswers`).
 */
export const applyCheck = (questions: GeneratedQuestion[], level: Level, reply: unknown): GeneratedQuestion[] => {
  const { answers, levels } = (reply ?? {}) as { answers?: unknown; levels?: unknown }
  if (!Array.isArray(answers) || answers.length !== questions.length) return questions
  const rated = Array.isArray(levels) && levels.length === questions.length ? levels : null
  return questions.filter((question, index) => {
    if (answers[index] !== question.correctIndex) return false
    const rating = rated?.[index]
    return typeof rating !== 'number' || Math.abs(rating - level) <= MAX_LEVEL_DRIFT
  })
}

/**
 * A blind second opinion: a different model answers each question without being told the
 * answer, and rates how hard it is on the writer's scale. A question it answers differently,
 * or rates too far from its level, is dropped. Costs one call per batch; when that call fails
 * the batch is kept, since losing good questions to a quota blip is worse.
 */
export const checkAnswers = async (questions: GeneratedQuestion[], locale: Locale, level: Level): Promise<GeneratedQuestion[]> => {
  if (!questions.length) return questions

  const listing = questions
    .map((question, index) => `${index + 1}. ${question.text}\n${question.options.map((o, i) => `  ${i}) ${o}`).join('\n')}`)
    .join('\n\n')

  try {
    const { text } = await generateJson({
      role: 'checker',
      systemInstruction: [
        `You are a careful quiz expert answering questions written in ${LOCALE_INFO[locale].name} for an audience from ${LOCALE_INFO[locale].culture}.`,
        'For each question, return in `answers` the 0-based index of the correct option; -1 when no option is clearly correct, or when more than one could be argued correct.',
        'Also return in `levels` how hard each question is for that audience, 1 to 5, on this scale (judge by how many adults would answer without help):',
        LEVEL_SCALE,
      ].join('\n'),
      contents: listing,
      schema: CHECK_SCHEMA,
      temperature: 0,
      maxOutputTokens: 1024,
    })
    return applyCheck(questions, level, JSON.parse(text))
  } catch {
    return questions
  }
}

export type GenerationResult = { questions: GeneratedQuestion[]; model: string; truncated: boolean }

/** One AI call (plus the optional check). Throws `AllModelsFailedError` when the chain is exhausted. */
export const generateQuestions = async (params: GenerateParams): Promise<GenerationResult> => {
  const { text, model, truncated } = await generateJson({
    role: 'writer',
    systemInstruction: buildSystemInstruction(params.locale),
    contents: buildPrompt(params),
    schema: QUESTIONS_SCHEMA,
    // Reasoning counts toward the cap, and non-Latin scripts take several tokens per word.
    maxOutputTokens: 16384,
  })

  const parsed = parseGeneratedQuestions(text, params.locale)
  const questions = config.ai.verifyQuestions ? await checkAnswers(parsed, params.locale, params.level) : parsed
  return { questions, model, truncated }
}
