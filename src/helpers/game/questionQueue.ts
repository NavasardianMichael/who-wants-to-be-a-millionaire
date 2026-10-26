import type { Question } from '@interfaces/entities'
import { SEEN_QUESTIONS_LIMIT, STORAGE_KEYS } from '@constants/app'
import type { Category, Level } from '@constants/game'
import { fetchQuestions, type QuestionSource } from '@helpers/offline/questionSource'
import { readJson, writeJson } from '@helpers/storage'

/**
 * Questions waiting to be asked in an unranked game, by level.
 *
 * Classic fetches the whole game (plus a spare per level for Switch Question) up front, in
 * one request the server fills level by level in parallel. Marathon and Time Attack
 * practice fetch in smaller batches and top up in the background before a level runs dry,
 * so the next question is always already on the device.
 */
export const readSeenIds = (): string[] => readJson<string[]>(STORAGE_KEYS.seenQuestions, [])

export const rememberSeen = (id: string): void => {
  const seen = readSeenIds().filter((each) => each !== id)
  seen.push(id)
  writeJson(STORAGE_KEYS.seenQuestions, seen.slice(-SEEN_QUESTIONS_LIMIT))
}

type QueueConfig = { locale: string; categories: Category[] }

export class QuestionQueue {
  private queues = new Map<Level, Question[]>()
  private pending = new Map<Level, Promise<void>>()
  private served = new Set<string>()
  /** The weakest source used so far — drives the "backup questions" notice. */
  source: QuestionSource = 'online'

  constructor(private readonly config: QueueConfig) {}

  private rank = (source: QuestionSource): number => ({ online: 0, pack: 1, fallback: 2 })[source]

  private excludeIds(): string[] {
    const queued = Array.from(this.queues.values()).flat().map(({ id }) => id)
    return Array.from(new Set([...readSeenIds(), ...this.served, ...queued]))
  }

  size(level: Level): number {
    return this.queues.get(level)?.length ?? 0
  }

  /** Fetches `counts` more questions. Concurrent fills of one level share a request. */
  async fill(counts: Partial<Record<Level, number>>): Promise<void> {
    const levels = (Object.keys(counts).map(Number) as Level[]).filter((level) => (counts[level] ?? 0) > 0)
    const waiting = levels.map((level) => this.pending.get(level)).filter(Boolean)
    if (waiting.length === levels.length && levels.length) {
      await Promise.all(waiting)
      return
    }

    const request = fetchQuestions({
      locale: this.config.locale,
      counts,
      categories: this.config.categories,
      excludeIds: this.excludeIds(),
    }).then(({ questions, source }) => {
      if (this.rank(source) > this.rank(this.source)) this.source = source
      for (const question of questions) {
        const level = question.level as Level
        this.queues.set(level, [...(this.queues.get(level) ?? []), question])
      }
    })

    const settled = request.finally(() => levels.forEach((level) => this.pending.delete(level)))
    levels.forEach((level) => this.pending.set(level, settled))
    await settled
  }

  /** The next question at `level`, fetching if the level is empty. Null if nothing could be found. */
  async take(level: Level): Promise<Question | null> {
    if (!this.size(level)) await this.fill({ [level]: 4 })
    const queue = this.queues.get(level) ?? []
    // Nothing at this level anywhere: take the nearest level rather than stall the game.
    const question = queue.shift() ?? this.takeNearest(level)
    if (!question) return null
    this.served.add(question.id)
    rememberSeen(question.id)
    return question
  }

  private takeNearest(level: Level): Question | null {
    for (let distance = 1; distance <= 4; distance++) {
      for (const candidate of [level - distance, level + distance] as Level[]) {
        const queue = this.queues.get(candidate)
        if (queue?.length) return queue.shift()!
      }
    }
    return null
  }

  /** Background top-up: keeps `min` questions ready at `level`. */
  prefetch(level: Level, min = 3, batch = 8): void {
    if (this.size(level) >= min || this.pending.has(level)) return
    void this.fill({ [level]: batch })
  }
}
