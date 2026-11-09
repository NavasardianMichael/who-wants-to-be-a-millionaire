import { gemini } from './gemini.js'
import { openrouter } from './openrouter.js'
import { type AiProvider, type GenerateJsonOptions, type GenerateJsonResult } from './types.js'

const PROVIDERS = { gemini, openrouter } satisfies Record<string, AiProvider>

/**
 * **The switch.** Every AI call in the API goes through this module; change this one line
 * (`'openrouter'` ↔ `'gemini'`) to move all of them. Each provider reads only its own key
 * (`OPENROUTER_KEY` / `GEMINI_KEY`), and an empty key turns generation off.
 */
const PROVIDER: AiProvider = PROVIDERS['gemini']

export { type AiRole, AllModelsFailedError, type JsonSchema } from './types.js'

export const aiProviderName = PROVIDER.name

export const isAiConfigured = (): boolean => PROVIDER.isConfigured()

export const generateJson = (options: GenerateJsonOptions): Promise<GenerateJsonResult> => PROVIDER.generateJson(options)

/** True while no model can be asked — the refill job skips its tick instead of burning a call. */
export const allModelsCoolingDown = (): boolean => PROVIDER.allModelsCoolingDown()

/** Shared by the parsers: trims, collapses whitespace, caps. Non-strings become ''. */
export const clip = (text: unknown, maxLength: number): string =>
  typeof text === 'string' ? text.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
