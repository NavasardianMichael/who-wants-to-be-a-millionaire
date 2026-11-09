import { FinishReason, type GenerateContentConfig, GoogleGenAI, type Schema, ThinkingLevel, Type } from '@google/genai'
import { type AiProvider, type AiRole, AllModelsFailedError, type GenerateJsonOptions, type GenerateJsonResult, type JsonSchema } from './types.js'
import { config } from '../../config.js'

/**
 * The Gemini provider, and the only reader of `GEMINI_KEY`. Ported from hangman's `getWord/route.ts`.
 *
 * The key is billed per token, so the chain runs **cheapest first** and a pricier model is
 * only reached when the one before it is rate-limited or overloaded (failed calls are not
 * billed). A model that answers 429/500/503 is cooled down — for the `retryDelay` Google
 * names on a quota error, or 15 s on overload — and skipped until then.
 */
const MODELS = [
  { name: 'gemini-3.5-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  { name: 'gemini-3.6-flash', thinkingLevel: ThinkingLevel.LOW },
  // 3.8-flash rejects MINIMAL
  { name: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
] as const

/**
 * - `writer` starts at flash: flash-lite with minimal thinking writes stilted, translated-
 *   sounding text in smaller languages, and a batch is pooled and served many times, so the
 *   better writer is worth its price.
 * - `checker` is pinned to the cheapest model: it only answers with option indexes.
 */
const CHAINS: Record<AiRole, readonly (typeof MODELS)[number][]> = {
  writer: MODELS.slice(1),
  checker: MODELS.slice(0, 1),
  reply: MODELS,
}

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

const GEMINI_TYPES = { object: Type.OBJECT, array: Type.ARRAY, string: Type.STRING, integer: Type.INTEGER } as const

/** JSON Schema → Gemini's `Schema`: upper-case types, string item counts, explicit property order. */
const toGeminiSchema = (schema: JsonSchema): Schema => {
  switch (schema.type) {
    case 'object': {
      const keys = Object.keys(schema.properties)
      return {
        type: Type.OBJECT,
        properties: Object.fromEntries(keys.map((key) => [key, toGeminiSchema(schema.properties[key]!)])),
        required: schema.required,
        ...(keys.length > 1 && { propertyOrdering: keys }),
      }
    }
    case 'array':
      return {
        type: Type.ARRAY,
        items: toGeminiSchema(schema.items),
        ...(schema.minItems !== undefined && { minItems: String(schema.minItems) }),
        ...(schema.maxItems !== undefined && { maxItems: String(schema.maxItems) }),
      }
    case 'string':
      return { type: Type.STRING, ...(schema.enum && { enum: schema.enum }) }
    default:
      return { type: GEMINI_TYPES[schema.type] }
  }
}

let ai: GoogleGenAI | null = null
// Created lazily so the build and tests never need GEMINI_KEY
const getAI = () => (ai ??= new GoogleGenAI({ apiKey: config.gemini.key }))

const isConfigured = (): boolean => Boolean(config.gemini.key)

const generateJson = async (options: GenerateJsonOptions): Promise<GenerateJsonResult> => {
  if (!isConfigured()) throw new AllModelsFailedError([], 'Gemini')

  const generationConfig: GenerateContentConfig = {
    systemInstruction: options.systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: toGeminiSchema(options.schema),
    maxOutputTokens: options.maxOutputTokens ?? 4096,
    temperature: options.temperature ?? 0.9,
  }

  const failures: AllModelsFailedError['failures'] = []
  const now = Date.now()
  const chain = CHAINS[options.role ?? 'reply']
  const available = chain.filter(({ name }) => (modelCooldowns.get(name) ?? 0) <= now)

  // When every model is cooling down, try them anyway rather than fail without asking.
  for (const { name, thinkingLevel } of available.length ? available : chain) {
    try {
      const response = await getAI().models.generateContent({
        model: name,
        contents: options.contents,
        config: { ...generationConfig, thinkingConfig: { thinkingLevel } },
      })
      const finishReason = response.candidates?.[0]?.finishReason
      // Billed but unusable — worth seeing in the logs, with what it cost.
      if (finishReason !== FinishReason.STOP) {
        console.warn(`[gemini] ${name} finished with ${finishReason ?? 'no candidate'}`, response.usageMetadata)
      }
      return { text: response.text ?? '', model: name, truncated: finishReason === FinishReason.MAX_TOKENS }
    } catch (error) {
      if (!FALLBACK_STATUSES.includes(getStatus(error))) throw error
      modelCooldowns.set(name, Date.now() + getCooldownMs(error))
      failures.push({ model: name, status: getStatus(error), message: (error as Error)?.message ?? String(error) })
    }
  }

  throw new AllModelsFailedError(failures, 'Gemini')
}

const allModelsCoolingDown = (): boolean => {
  const now = Date.now()
  return MODELS.every(({ name }) => (modelCooldowns.get(name) ?? 0) > now)
}

export const gemini: AiProvider = { name: 'gemini', isConfigured, generateJson, allModelsCoolingDown }
