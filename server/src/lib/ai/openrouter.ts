import { type AiProvider, type AiRole, AllModelsFailedError, type GenerateJsonOptions, type GenerateJsonResult, type JsonSchema } from './types.js'
import { config } from '../../config.js'

/**
 * The OpenRouter provider, and the only reader of `OPENROUTER_KEY`. Plain `fetch` against
 * the OpenAI-compatible chat endpoint — no SDK.
 *
 * Only `:free` models: they cost nothing, but share one account-wide quota — 20 requests a
 * minute, and 50 a day (1000 a day once the account has ever bought 10 credits). Hitting that
 * quota pauses **every** model until OpenRouter's `X-RateLimit-Reset`; a single model that is
 * busy upstream, gone, or refuses the request is only skipped for a while.
 *
 * The free list changes often — a model that disappears answers 404 and is skipped for hours.
 * Check what is free today: https://openrouter.ai/models?max_price=0 and keep only models
 * whose page lists "response_format" (structured outputs).
 */
type Model = {
  name: string
  /**
   * `schema`: the provider enforces our JSON Schema (`structured_outputs`).
   * `object`: it only guarantees *some* JSON object; the schema is spelled out in the prompt.
   */
  jsonMode: 'schema' | 'object'
}

const GEMMA_31B: Model = { name: 'google/gemma-4-31b-it:free', jsonMode: 'object' }
const GEMMA_26B: Model = { name: 'google/gemma-4-26b-a4b-it:free', jsonMode: 'object' }
const NEMOTRON: Model = { name: 'nvidia/nemotron-3.5-super-vl:free', jsonMode: 'schema' }
const DOTS: Model = { name: 'dots-studio/dots-3-note-preview:free', jsonMode: 'schema' }

/**
 * Ordered by what answers, fast. Measured (8 Polish questions, reasoning off): Nemotron ~4 s,
 * Dots ~18 s. The Gemma models run on Google AI Studio's shared free pool, which answers
 * "rate-limited upstream" most of the time, so they are last resorts only.
 * - `checker`: a different family from the first writer, so the second opinion is really blind.
 */
const CHAINS: Record<AiRole, Model[]> = {
  writer: [NEMOTRON, DOTS, GEMMA_31B],
  checker: [DOTS],
  reply: [NEMOTRON, GEMMA_26B],
}

const ALL_MODELS = [...new Set(Object.values(CHAINS).flat())]

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

/** A model that has not answered by then is stuck; the next one in the chain gets the call. */
const TIMEOUT_MS: Record<AiRole, number> = { writer: 40_000, checker: 30_000, reply: 15_000 }

const OVERLOAD_COOLDOWN_MS = 15_000
const UPSTREAM_LIMIT_COOLDOWN_MS = 60_000
/** The model refused this kind of request (e.g. the schema): skip it for a while, not for good. */
const REJECTED_COOLDOWN_MS = 10 * 60 * 1000
/** The model is gone from the free list (404). */
const GONE_COOLDOWN_MS = 6 * 60 * 60 * 1000
const MAX_ACCOUNT_COOLDOWN_MS = 24 * 60 * 60 * 1000

/** 401/402/403: the key itself is wrong, out of credit or banned — no other model will do better. */
const FATAL_STATUSES = [401, 402, 403]

const modelCooldowns = new Map<string, number>()
/** Set when OpenRouter's own free-model quota (per minute or per day) is spent. */
let accountCooldownUntil = 0

class OpenRouterError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Epoch ms when OpenRouter's account-wide free quota resets; only on its own 429s. */
    readonly accountResetAt: number | null = null,
    readonly retryAfterMs: number | null = null
  ) {
    super(`OpenRouter ${status}: ${message}`)
  }
}

const cooldownMsFor = (error: OpenRouterError): number => {
  if (error.status === 404) return GONE_COOLDOWN_MS
  if (error.status === 400 || error.status === 422) return REJECTED_COOLDOWN_MS
  if (error.status === 429) return error.retryAfterMs ?? UPSTREAM_LIMIT_COOLDOWN_MS
  return OVERLOAD_COOLDOWN_MS
}

/** Strict structured outputs want every object closed. */
const toStrictSchema = (schema: JsonSchema): Record<string, unknown> => {
  switch (schema.type) {
    case 'object':
      return {
        ...schema,
        properties: Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, toStrictSchema(value)])),
        additionalProperties: false,
      }
    case 'array':
      return { ...schema, items: toStrictSchema(schema.items) }
    default:
      return { ...schema }
  }
}

/** A safety net behind `response-healing`: drops code fences and any prose around the object. */
export const extractJsonObject = (text: string): string => {
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = unfenced.indexOf('{')
  const end = unfenced.lastIndexOf('}')
  return start >= 0 && end > start ? unfenced.slice(start, end + 1) : unfenced
}

type ChatCompletion = {
  choices?: { finish_reason?: string | null; message?: { content?: string | null } }[]
  usage?: unknown
  error?: { code?: number; message?: string }
}

const requestModel = async (model: Model, options: GenerateJsonOptions, role: AiRole): Promise<GenerateJsonResult> => {
  const schema = toStrictSchema(options.schema)
  const body = {
    model: model.name,
    messages: [
      {
        role: 'system',
        content: [
          options.systemInstruction,
          'Reply with one JSON object and nothing else — no prose, no code fences. It must match this JSON Schema:',
          JSON.stringify(schema),
        ].join('\n'),
      },
      { role: 'user', content: options.contents },
    ],
    response_format:
      model.jsonMode === 'schema'
        ? { type: 'json_schema', json_schema: { name: 'reply', strict: true, schema } }
        : { type: 'json_object' },
    plugins: [{ id: 'response-healing' }],
    max_tokens: options.maxOutputTokens ?? 4096,
    temperature: options.temperature ?? 0.9,
    // Even "low" reasoning made a free writer 4× slower (17 s against 4 s), with a player waiting.
    reasoning: { enabled: false },
  }

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openrouter.key}`,
        'Content-Type': 'application/json',
        // Optional attribution on openrouter.ai.
        'HTTP-Referer': config.corsOrigin,
        'X-OpenRouter-Title': 'Millionaire',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS[role]),
    })
  } catch (error) {
    const timedOut = (error as Error)?.name === 'TimeoutError'
    throw new OpenRouterError(timedOut ? 408 : 503, timedOut ? 'timed out' : ((error as Error)?.message ?? 'network error'))
  }

  const json = (await response.json().catch(() => ({}))) as ChatCompletion
  // A provider can fail after OpenRouter has already answered 200; the error is then in the body.
  if (!response.ok || json.error) {
    const status = response.ok ? (json.error?.code ?? 502) : response.status
    const reset = Number(response.headers.get('x-ratelimit-reset'))
    const retryAfter = Number(response.headers.get('retry-after'))
    throw new OpenRouterError(
      status,
      json.error?.message ?? response.statusText,
      status === 429 && Number.isFinite(reset) && reset > 0 ? reset : null,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : null
    )
  }

  const choice = json.choices?.[0]
  const finishReason = choice?.finish_reason ?? null
  const content = choice?.message?.content ?? ''
  const truncated = finishReason === 'length'
  if (finishReason !== 'stop') console.warn(`[openrouter] ${model.name} finished with ${finishReason ?? 'no choice'}`, json.usage)
  // An empty "success" is a free provider's hiccup, not an answer: let the next model try.
  if (!content.trim() && !truncated) throw new OpenRouterError(502, 'empty reply')

  return { text: extractJsonObject(content), model: model.name, truncated }
}

const isConfigured = (): boolean => Boolean(config.openrouter.key)

const generateJson = async (options: GenerateJsonOptions): Promise<GenerateJsonResult> => {
  if (!isConfigured()) throw new AllModelsFailedError([], 'OpenRouter')

  const now = Date.now()
  if (accountCooldownUntil > now) {
    const until = new Date(accountCooldownUntil).toISOString()
    throw new AllModelsFailedError([{ model: 'openrouter', status: 429, message: `free-model quota spent until ${until}` }], 'OpenRouter')
  }

  const role = options.role ?? 'reply'
  const chain = CHAINS[role]
  const available = chain.filter(({ name }) => (modelCooldowns.get(name) ?? 0) <= now)
  const failures: AllModelsFailedError['failures'] = []

  // When every model is cooling down, try them anyway rather than fail without asking.
  for (const model of available.length ? available : chain) {
    try {
      return await requestModel(model, options, role)
    } catch (error) {
      if (!(error instanceof OpenRouterError) || FATAL_STATUSES.includes(error.status)) throw error
      failures.push({ model: model.name, status: error.status, message: error.message })
      if (error.accountResetAt) {
        // The quota is the account's, not the model's: every other model would be refused too.
        accountCooldownUntil = Math.min(Math.max(error.accountResetAt, Date.now() + 1000), Date.now() + MAX_ACCOUNT_COOLDOWN_MS)
        break
      }
      modelCooldowns.set(model.name, Date.now() + cooldownMsFor(error))
    }
  }

  throw new AllModelsFailedError(failures, 'OpenRouter')
}

const allModelsCoolingDown = (): boolean => {
  const now = Date.now()
  return accountCooldownUntil > now || ALL_MODELS.every(({ name }) => (modelCooldowns.get(name) ?? 0) > now)
}

export const openrouter: AiProvider = { name: 'openrouter', isConfigured, generateJson, allModelsCoolingDown }
