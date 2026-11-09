/**
 * The contract every AI provider in this folder implements. Services import from
 * `lib/ai/index.ts` only, never from a provider, so switching provider is one line there.
 */

/**
 * The plain JSON Schema subset the services describe their replies with. Each provider turns
 * it into what its API takes (Gemini's `Schema`, OpenRouter's `json_schema`).
 */
export type JsonSchema =
  | { type: 'object'; properties: Record<string, JsonSchema>; required: string[] }
  | { type: 'array'; items: JsonSchema; minItems?: number; maxItems?: number }
  | { type: 'string'; enum?: string[] }
  | { type: 'integer' }

/**
 * What the call is for; each provider maps it to its own models.
 * - `writer`: question batches — the best writer first, then the rest of the chain.
 * - `checker`: the blind answer check — one fixed model, no fallback.
 * - `reply` (default): short replies (Phone a Friend) — the whole chain, fastest first.
 */
export type AiRole = 'writer' | 'checker' | 'reply'

export type GenerateJsonOptions = {
  contents: string
  systemInstruction: string
  schema: JsonSchema
  /** Reasoning tokens count toward this limit on most models; too low a cap cuts the JSON off. */
  maxOutputTokens?: number
  temperature?: number
  role?: AiRole
}

export type GenerateJsonResult = {
  text: string
  model: string
  /** Cut off at `maxOutputTokens`: the JSON is broken, and asking again the same way fails the same way. */
  truncated: boolean
}

export class AllModelsFailedError extends Error {
  constructor(
    readonly failures: { model: string; status: number; message: string }[],
    provider = 'AI'
  ) {
    super(failures.map(({ model, status }) => `${model}: ${status}`).join(', ') || `${provider} is not configured`)
  }
}

export type AiProvider = {
  name: string
  isConfigured: () => boolean
  /** Runs the prompt down the provider's model chain and returns the first model's raw JSON text. */
  generateJson: (options: GenerateJsonOptions) => Promise<GenerateJsonResult>
  /** True while no model can be asked — the refill job skips its tick instead of burning a call. */
  allModelsCoolingDown: () => boolean
}
