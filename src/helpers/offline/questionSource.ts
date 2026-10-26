import { getQuestionBatchAPI } from '@api/questions/main'
import type { Question } from '@interfaces/entities'
import type { Category, Level } from '@constants/game'
import { reportError } from '@helpers/reportError'
import { getPack } from './packs'

/**
 * Where a game's questions come from, in order:
 *   1. the API — the locale's AI-written pool (which itself falls back to the English bank);
 *   2. a downloaded language pack, when offline or the API is unreachable;
 *   3. the bundled English bank (`/packs/fallback-en.json`, precached by the service worker).
 * Shortfalls are filled level by level from the next source, so a half-empty pack still
 * yields a full game.
 */
export type QuestionRequest = {
  locale: string
  counts: Partial<Record<Level, number>>
  categories: Category[]
  excludeIds: string[]
}

export type QuestionSource = 'online' | 'pack' | 'fallback'

export type SourcedQuestions = { questions: Question[]; source: QuestionSource }

const FALLBACK_URL = '/packs/fallback-en.json'

let fallbackBank: Promise<Question[]> | null = null

const loadFallbackBank = (): Promise<Question[]> => {
  fallbackBank ??= fetch(FALLBACK_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`fallback bank: ${response.status}`)
      return response.json() as Promise<Question[]>
    })
    .catch((error: unknown) => {
      fallbackBank = null
      reportError(error, 'questions:fallback')
      return []
    })
  return fallbackBank
}

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

/** Picks `count` per level, unseen first, honouring categories when there are enough. */
const pickFrom = (bank: Question[], request: QuestionRequest, counts: Partial<Record<Level, number>>): Question[] =>
  (Object.entries(counts) as [string, number][]).flatMap(([levelKey, count]) => {
    const level = Number(levelKey)
    const atLevel = shuffle(bank.filter((question) => question.level === level))
    const unseen = atLevel.filter((question) => !request.excludeIds.includes(question.id))
    const inCategory = request.categories.length
      ? unseen.filter((question) => request.categories.includes(question.category))
      : unseen
    const ordered = [...inCategory, ...unseen.filter((q) => !inCategory.includes(q)), ...atLevel.filter((q) => !unseen.includes(q))]
    return ordered.slice(0, count)
  })

const missingCounts = (counts: Partial<Record<Level, number>>, have: Question[]): Partial<Record<Level, number>> =>
  Object.fromEntries(
    (Object.entries(counts) as [string, number][])
      .map(([level, count]) => [level, count - have.filter((question) => question.level === Number(level)).length])
      .filter(([, missing]) => (missing as number) > 0)
  )

const isEmpty = (counts: Partial<Record<Level, number>>): boolean => Object.keys(counts).length === 0

export const fetchQuestions = async (request: QuestionRequest): Promise<SourcedQuestions> => {
  let questions: Question[] = []
  let source: QuestionSource = 'online'

  const online = typeof navigator === 'undefined' || navigator.onLine
  if (online) {
    try {
      questions = await getQuestionBatchAPI(request)
    } catch (error) {
      reportError(error, 'questions:online', { silent: true })
    }
  }

  let missing = missingCounts(request.counts, questions)
  if (!isEmpty(missing)) {
    const pack = await getPack(request.locale)
    if (pack?.questions.length) {
      const fromPack = pickFrom(
        pack.questions.map((question) => ({ ...question, fallback: false })),
        { ...request, excludeIds: [...request.excludeIds, ...questions.map(({ id }) => id)] },
        missing
      )
      if (fromPack.length) {
        questions = questions.concat(fromPack)
        source = 'pack'
      }
    }
  }

  missing = missingCounts(request.counts, questions)
  if (!isEmpty(missing)) {
    const bank = await loadFallbackBank()
    const fromBank = pickFrom(
      bank.map((question) => ({ ...question, fallback: request.locale !== 'en' })),
      { ...request, excludeIds: [...request.excludeIds, ...questions.map(({ id }) => id)] },
      missing
    )
    if (fromBank.length) {
      questions = questions.concat(fromBank)
      source = 'fallback'
    }
  }

  return { questions, source }
}
