#!/usr/bin/env node
/**
 * Fills keys that exist in `en.json` but are missing from other catalogues, using Gemini —
 * for the day a feature adds copy and 79 files fall behind. Keys removed from `en.json` are
 * dropped. Run `pnpm check:messages` afterwards and review the diff before committing:
 * machine output is a draft.
 *
 *   pnpm i18n:sync                                   # every locale, missing keys only
 *   pnpm i18n:sync hy ja                             # just these
 *   pnpm i18n:sync --retranslate=Home.eyebrow,Common.appName
 *   pnpm i18n:sync --matching="Millionaire Quiz"     # re-translate keys whose English matches
 *   pnpm i18n:sync --formal hy ru                    # move existing copy to the polite "you"
 *
 * `--retranslate` / `--matching` redo existing translations — for when the English changed or
 * a translation rule did. Every key of one locale goes in one request, so a term (the game's
 * name) comes out the same everywhere.
 *
 * `--formal` translates nothing: the model reads a locale's whole catalogue and returns only the
 * values that address the player familiarly, rewritten to the polite form (ADDRESS). Everything
 * else stays as reviewed.
 *
 * Files are patched in place — only changed values and new keys touch the text — so the diff
 * shows the translation, not a reformatted file. Anything the patcher cannot place falls back
 * to a full rewrite.
 *
 * The key is read from the environment, or from server/.env.development.local when unset.
 */
import { createRequire } from 'node:module'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'src/messages')
const serverRequire = createRequire(path.join(ROOT, 'server/package.json'))

const BRAND = 'Millionaire Quiz'

/** How the copy speaks to the player — shared by translation and the `--formal` pass. */
const ADDRESS =
  'Address the player respectfully. Wherever the language distinguishes a familiar and a polite "you" — pronouns, verb forms, imperatives, honorifics — use the polite one consistently (e.g. Armenian դուք and գրեք, not դու and գրիր; Russian вы, not ты; German Sie; French vous; Spanish usted; Japanese です/ます; Korean 합니다/해요, never 반말; Hindi आप). Languages whose ordinary polite address is the familiar form (Swedish, Danish, Norwegian, Icelandic, Finnish) keep it. Warm, never stiff.'

const readKey = () => {
  if (process.env.GEMINI_KEY) return process.env.GEMINI_KEY
  try {
    const env = readFileSync(path.join(ROOT, 'server/.env.development.local'), 'utf8')
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

const parseArgs = (argv) => {
  const option = (name) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
  return {
    locales: argv.filter((arg) => !arg.startsWith('--')),
    retranslate: new Set(option('retranslate')?.split(',').filter(Boolean) ?? []),
    // The developer's own pattern from the command line, matched against our own en.json.
    // eslint-disable-next-line security/detect-non-literal-regexp
    matching: option('matching') ? new RegExp(option('matching')) : null,
    formal: argv.includes('--formal'),
  }
}

const prompt = (locale, entries, knownName, showTitle) =>
  [
    `Translate the JSON values from English into the language with BCP-47 code "${locale}" for a quiz-show game UI.`,
    'Rules:',
    '- Keep the keys unchanged. Return only the JSON object.',
    '- Keep ICU placeholders like {count} exactly; adapt plural categories to the language.',
    `- The game's name "${BRAND}" is translated naturally into the language (never left in English), as a proper name, and written identically everywhere it appears.` +
      (knownName ? ` In this language it is "${knownName}".` : ''),
    '- "Who Wants to Be a Millionaire?" is the TV quiz show\'s title: write it as the show is known and searched for in this language (its local edition\'s title where one aired, e.g. German "Wer wird Millionär?", Hindi "कौन बनेगा करोड़पति?"), identically everywhere it appears; inside a sentence it is set off the way the language quotes titles (“…”, «…», „…“, 「…」).' +
      (showTitle ? ` In this language it is "${showTitle}".` : ''),
    '- Where the copy says the game or its questions are "in English" or for "English speakers", English stands for the language you are translating into: name that language instead, inflected naturally (Armenian "in English" → "հայերենով", Russian → "на русском"). "79 other languages" stays 79.',
    '- Common.wordmarkTop and Common.wordmarkBottom are the two lines of the logo and together read as the translated game name: the main word on top, the rest below.',
    '- Artificial intelligence ("AI") is always written out in full in the language — never an abbreviation or acronym such as AI, KI, IA or ИИ.',
    '- Keep "50:50" as is.',
    `- ${ADDRESS}`,
    '',
    JSON.stringify(Object.fromEntries(entries), null, 2),
  ].join('\n')

const formalPrompt = (locale, entries) =>
  [
    `Below is the UI copy of a quiz-show game in the language with BCP-47 code "${locale}", as JSON.`,
    ADDRESS,
    'Return a JSON object with ONLY the entries that break this rule, each rewritten to follow it — same key, same meaning, every other word kept. Keep ICU placeholders like {count} and plural syntax exactly. Return {} if none do.',
    '',
    JSON.stringify(Object.fromEntries(entries), null, 2),
  ].join('\n')

/** Where `"leaf": value` sits for a dotted key: parents are matched in order, so a repeated leaf name is disambiguated. */
const locate = (text, dotted, value) => {
  const parts = dotted.split('.')
  let from = 0
  for (const part of parts.slice(0, -1)) {
    const at = text.indexOf(`${JSON.stringify(part)}:`, from)
    if (at < 0) return null
    from = at + 1
  }
  const needle = `${JSON.stringify(parts.at(-1))}: ${JSON.stringify(value)}`
  const start = text.indexOf(needle, from)
  return start < 0 ? null : { start, end: start + needle.length }
}

/** Applies changed values and new keys to the file's own text, or returns null when it can't. */
const patchText = (text, english, before, after) => {
  const beforeFlat = new Map(flatten(before))
  const englishKeys = flatten(english).map(([dotted]) => dotted)
  if ([...beforeFlat.keys()].some((dotted) => !englishKeys.includes(dotted))) return null // removals: rewrite

  let patched = text
  for (const [dotted, value] of flatten(after)) {
    const old = beforeFlat.get(dotted)
    const entry = `${JSON.stringify(dotted.split('.').at(-1))}: ${JSON.stringify(value)}`
    if (old === value) continue

    if (old !== undefined) {
      const spot = locate(patched, dotted, old)
      if (!spot) return null
      patched = patched.slice(0, spot.start) + entry + patched.slice(spot.end)
      continue
    }

    // A new key goes right after its previous sibling in en.json's order, on its own line.
    const parent = dotted.split('.').slice(0, -1).join('.')
    const siblings = englishKeys.filter(
      (each) => each.startsWith(`${parent}.`) && !each.slice(parent.length + 1).includes('.')
    )
    const previous = siblings
      .slice(0, siblings.indexOf(dotted))
      .reverse()
      .find((each) => new Map(flatten(JSON.parse(patched))).has(each))
    if (!previous) return null
    const spot = locate(patched, previous, new Map(flatten(JSON.parse(patched))).get(previous))
    if (!spot) return null
    const lineStart = patched.lastIndexOf('\n', spot.start) + 1
    const indent = patched.slice(lineStart, spot.start)
    if (indent.trim()) return null // inside a one-line object
    patched = `${patched.slice(0, spot.end)},\n${indent}${entry}${patched.slice(spot.end)}`
  }
  return patched
}

const main = async () => {
  const key = readKey()
  if (!key) {
    console.error('GEMINI_KEY is not set (environment or server/.env.development.local).')
    process.exit(1)
  }
  const { GoogleGenAI } = serverRequire('@google/genai')
  const ai = new GoogleGenAI({ apiKey: key })

  const english = JSON.parse(readFileSync(path.join(DIR, 'en.json'), 'utf8'))
  const englishFlat = flatten(english)
  const { locales: requested, retranslate, matching, formal } = parseArgs(process.argv.slice(2))
  const locales = requested.length
    ? requested
    : readdirSync(DIR)
        .filter((file) => file.endsWith('.json') && file !== 'en.json')
        .map((file) => file.replace(/\.json$/, ''))
  const redo = ([dotted, value]) =>
    retranslate.has(dotted) || (matching !== null && typeof value === 'string' && matching.test(value))

  const failed = []
  for (const locale of locales) {
    const file = path.join(DIR, `${locale}.json`)
    const text = readFileSync(file, 'utf8')
    const current = JSON.parse(text)
    const have = new Map(flatten(current))
    const todo = formal ? [] : englishFlat.filter((entry) => !have.has(entry[0]) || redo(entry))

    const next = structuredClone(current)
    let rewritten = 0
    if (formal) {
      const changes = await translate(ai, formalPrompt(locale, [...have]))
      if (!changes) {
        failed.push(locale)
        console.log(`${locale}: failed — the model kept returning malformed JSON`)
        continue
      }
      // Only existing string keys whose text actually changed; anything else the model invents is dropped.
      for (const [dotted, value] of Object.entries(changes)) {
        if (typeof value !== 'string' || typeof have.get(dotted) !== 'string' || have.get(dotted) === value) continue
        setPath(next, dotted, value)
        rewritten++
      }
    }
    if (todo.length) {
      const knownName = todo.some(([dotted]) => dotted === 'Common.appName') ? null : have.get('Common.appName')
      const name = knownName && knownName !== BRAND ? knownName : null
      const showTitle = todo.some(([dotted]) => dotted === 'Home.heroTitle') ? null : have.get('Home.heroTitle')
      let translated = await translate(ai, prompt(locale, todo, name, showTitle))
      // A batch the model cannot return as valid JSON usually goes through in smaller pieces.
      if (!translated && todo.length > CHUNK) {
        const parts = []
        for (let start = 0; start < todo.length; start += CHUNK) {
          parts.push(await translate(ai, prompt(locale, todo.slice(start, start + CHUNK), name, showTitle)))
        }
        translated = parts.every(Boolean) ? Object.assign({}, ...parts) : null
      }
      if (!translated) {
        // Left untouched; `pnpm check:messages` lists what is still missing, and a re-run fills it.
        failed.push(locale)
        console.log(`${locale}: failed — the model kept returning malformed JSON`)
        continue
      }
      for (const [dotted, value] of Object.entries(translated))
        if (typeof value === 'string') setPath(next, dotted, value)
    }

    const ordered = reorder(english, next)
    const patched = patchText(text, english, current, ordered)
    const exact = patched !== null && JSON.stringify(JSON.parse(patched)) === JSON.stringify(ordered)
    writeFileSync(file, exact ? patched : `${JSON.stringify(ordered, null, 2)}\n`)
    const done = formal
      ? `${rewritten} key(s) made formal`
      : todo.length
        ? `${todo.length} key(s) translated`
        : 'up to date'
    console.log(`${locale}: ${done}${exact ? '' : ' (file rewritten)'}`)
  }
  if (failed.length) {
    console.error(`Not translated: ${failed.join(' ')} — run again with just these locales.`)
    process.exitCode = 1
  }
}

/** A model occasionally answers with broken JSON (an unescaped quote); asking again usually fixes it. */
async function translate(ai, contents, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const response = await generate(ai, contents)
    try {
      return JSON.parse(response.text ?? '{}')
    } catch {
      console.log(`  malformed JSON, asking again (${attempt}/${attempts})`)
    }
  }
  return null
}

/**
 * The free tier allows a handful of requests a minute and is sometimes overloaded: on 429 / 503
 * wait for the delay Google advises (or 20 s) and try again, a few times, before giving up./** The API's own chain (server/src/lib/gemini.ts), strongest translator first. */
const MODELS = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite']
/** A model whose daily free quota is spent (Google advises a wait of hours) is skipped for the rest of the run. */
const exhausted = new Set()
const LONG_WAIT_SECONDS = 90
const REQUEST_TIMEOUT_MS = 180_000
/** Keys per request when a whole locale's batch keeps coming back malformed. */
const CHUNK = 15

/**
 * One translation request on the free tier. A per-minute limit or a busy model (429 / 503
 * with a short advised delay) is waited out and retried; a spent daily quota moves on to the
 * next model in the chain instead of sleeping for hours.
 */
async function generate(ai, contents) {
  for (let attempt = 1; attempt <= 12; attempt++) {
    const model = MODELS.find((name) => !exhausted.has(name))
    if (!model) throw new Error('Every Gemini model is out of free quota for today — try again tomorrow.')
    try {
      return await ai.models.generateContent({
        model,
        contents,
        // Low thinking, as the API uses: translation needs none, and the default makes each call take minutes.
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          thinkingConfig: { thinkingLevel: 'LOW' },
          httpOptions: { timeout: REQUEST_TIMEOUT_MS },
        },
      })
    } catch (error) {
      // A request that timed out is retried like a busy model.
      const timedOut = error?.name === 'AbortError' || /timed? ?out|aborted/i.test(String(error?.message))
      if (!timedOut && ![429, 503, 504].includes(error?.status)) throw error
      const advised = Number(/retryDelay":"(\d+)s"/.exec(String(error?.message))?.[1] ?? 20)
      if (advised > LONG_WAIT_SECONDS) {
        exhausted.add(model)
        console.log(`  ${model}: daily quota spent, switching model`)
        continue
      }
      console.log(`  ${model}: ${error.status}, retrying in ${advised + 2}s…`)
      await new Promise((resolve) => setTimeout(resolve, (advised + 2) * 1000))
    }
  }
  throw new Error('Gemini kept refusing; try again later.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
