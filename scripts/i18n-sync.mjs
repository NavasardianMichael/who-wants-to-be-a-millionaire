#!/usr/bin/env node
/**
 * Fills keys that exist in `en.json` but are missing from other catalogues, using Gemini —
 * for the day a feature adds copy and 49 files fall behind. Existing translations are never
 * touched; keys removed from `en.json` are dropped. Run `pnpm check:messages` afterwards
 * and review the diff before committing: machine output is a draft.
 *
 *   GEMINI_KEY=... pnpm i18n:sync            # every locale
 *   GEMINI_KEY=... pnpm i18n:sync hy ja      # just these
 *
 * The key is read from the environment, or from server/.env when unset.
 */
import { createRequire } from 'node:module'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'src/messages')
const serverRequire = createRequire(path.join(ROOT, 'server/package.json'))

const readKey = () => {
  if (process.env.GEMINI_KEY) return process.env.GEMINI_KEY
  try {
    const env = readFileSync(path.join(ROOT, 'server/.env'), 'utf8')
    return /^GEMINI_KEY="?([^"\n]*)"?/m.exec(env)?.[1] ?? ''
  } catch {
    return ''
  }
}

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]]
  )

const setPath = (object, dotted, value) => {
  const parts = dotted.split('.')
  let node = object
  for (const part of parts.slice(0, -1)) node = node[part] ??= {}
  node[parts.at(-1)] = value
}

/** Rebuilds `target` in en.json's key order, dropping keys en.json no longer has. */
const reorder = (english, target) => {
  const result = {}
  for (const [key, value] of Object.entries(english)) {
    if (value && typeof value === 'object') result[key] = reorder(value, target?.[key] ?? {})
    else if (target?.[key] !== undefined) result[key] = target[key]
  }
  return result
}

const main = async () => {
  const key = readKey()
  if (!key) {
    console.error('GEMINI_KEY is not set (environment or server/.env).')
    process.exit(1)
  }
  const { GoogleGenAI } = serverRequire('@google/genai')
  const ai = new GoogleGenAI({ apiKey: key })

  const english = JSON.parse(readFileSync(path.join(DIR, 'en.json'), 'utf8'))
  const englishFlat = flatten(english)
  const requested = process.argv.slice(2)
  const locales = requested.length
    ? requested
    : readdirSync(DIR).filter((file) => file.endsWith('.json') && file !== 'en.json').map((file) => file.replace(/\.json$/, ''))

  for (const locale of locales) {
    const file = path.join(DIR, `${locale}.json`)
    const current = JSON.parse(readFileSync(file, 'utf8'))
    const have = new Map(flatten(current))
    const missing = englishFlat.filter(([dotted]) => !have.has(dotted))

    if (missing.length) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Translate the JSON values from English into the language with BCP-47 code "${locale}" for a quiz-show game UI. Keep the keys unchanged. Keep ICU placeholders like {count} exactly; adapt plural categories to the language. Keep "Millionaire Quiz" and "50:50" untranslated. Friendly, informal tone. Return only the JSON object.\n\n${JSON.stringify(Object.fromEntries(missing), null, 2)}`,
        config: { responseMimeType: 'application/json', temperature: 0.2 },
      })
      const translated = JSON.parse(response.text ?? '{}')
      for (const [dotted, value] of Object.entries(translated)) if (typeof value === 'string') setPath(current, dotted, value)
    }

    writeFileSync(file, `${JSON.stringify(reorder(english, current), null, 2)}\n`)
    console.log(`${locale}: ${missing.length ? `${missing.length} key(s) translated` : 'up to date'}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
