import { type GenerateContentConfig, GoogleGenAI, type Schema, ThinkingLevel } from '@google/genai'
import { config } from '../config.js'

/**
 * The only reader of `GEMINI_KEY`. Ported from hangman's `getWord/route.ts`.
 *
 * Free-tier quotas are **per model**, so falling through a chain of models adds capacity
 * rather than just redundancy. A model that answers 429/500/503 is cooled down — for the
 * `retryDelay` Google names on a quota error, or 15 s on overload — and skipped until then.
 */
const MODELS = [
  { name: 'gemini-3.5-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  { name: 'gemini-3.6-flash', thinkingLevel: ThinkingLevel.LOW },
  // 3.8-flash rejects MINIMAL
  { name: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
] as const

/** The cheapest model, for the blind answer-check pass in `services/questionGen.ts`. */
export const CHECKER_MODEL = MODELS[0].name

const FALLBACK_STATUSES = [429, 500, 503]
const OVERLOAD_COOLDOWN_MS = 15_000
const DEFAULT_QUOTA_COOLDOWN_MS = 60_000

const modelCooldowns = new Map<string, number>()

const getStatus = (error: unknown) => (error as { status?: number } | null)?.status ?? 0

const getCooldownMs = (error: unknown) => {
  if (getStatus(error) !== 429) return OVERLOAD_COOLDOWN_MS
  const retryDelay = String((error as Error)?.message ?? '').match(/"retryDelay": ?"([\d.]{1,10})s"/)
  const seconds = Number(retryDelay?.[1])
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_QUOTA_COOLDOWN_MS
}

export class AllModelsFailedError extends Error {
  constructor(readonly failures: { model: string; status: number; message: string }[]) {
    super(failures.map(({ model, status }) => `${model}: ${status}`).join(', ') || 'Gemini is not configured')
  }
}

let ai: GoogleGenAI | null = null
// Created lazily so the build and tests never need GEMINI_KEY
const getAI = () => (ai ??= new GoogleGenAI({ apiKey: config.gemini.key }))

export type GenerateJsonOptions = {
  contents: string
  systemInstruction: string
  schema: Schema
  /** Thinking tokens count toward this limit; too low a cap cuts the JSON off. */
  maxOutputTokens?: number
  temperature?: number
  /** Pin one model instead of walking the chain. */
  model?: string
}

export type GenerateJsonResult = { text: string; model: string }

/** Runs the prompt down the model chain and returns the first model's raw JSON text. */
export const generateJson = async (options: GenerateJsonOptions): Promise<GenerateJsonResult> => {
  if (!config.gemini.key) throw new AllModelsFailedError([])

  const generationConfig: GenerateContentConfig = {
    systemInstruction: options.systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: options.schema,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
    temperature: options.temperature ?? 0.9,
  }

  const failures: AllModelsFailedError['failures'] = []
  const now = Date.now()
  const chain = options.model ? MODELS.filter(({ name }) => name === options.model) : MODELS
  const available = chain.filter(({ name }) => (modelCooldowns.get(name) ?? 0) <= now)

  // When every model is cooling down, try them anyway rather than fail without asking.
  for (const { name, thinkingLevel } of available.length ? available : chain) {
    try {
      const response = await getAI().models.generateContent({
        model: name,
        contents: options.contents,
        config: { ...generationConfig, thinkingConfig: { thinkingLevel } },
      })
      return { text: response.text ?? '', model: name }
    } catch (error) {
      if (!FALLBACK_STATUSES.includes(getStatus(error))) throw error
      modelCooldowns.set(name, Date.now() + getCooldownMs(error))
      failures.push({ model: name, status: getStatus(error), message: (error as Error)?.message ?? String(error) })
    }
  }

  throw new AllModelsFailedError(failures)
}

/** True while every model is cooling down — the refill job skips its tick instead of burning a call. */
export const allModelsCoolingDown = (): boolean => {
  const now = Date.now()
  return MODELS.every(({ name }) => (modelCooldowns.get(name) ?? 0) > now)
}

/** Shared by the parsers: trims, collapses whitespace, caps. Non-strings become ''. */
export const clip = (text: unknown, maxLength: number): string =>
  typeof text === 'string' ? text.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
