#!/usr/bin/env node
/**
 * Copies the curated English bank (server/prisma/seed/fallback-questions.en.json) into
 * public/packs/fallback-en.json, the offline last resort the service worker precaches.
 *
 * Ids are stable (`fallback-<n>`) so the device's "seen" list survives a re-export, and they
 * are deliberately not UUIDs, so they can never collide with — or be sent to the API as —
 * pool question ids.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = path.join(ROOT, 'server/prisma/seed/fallback-questions.en.json')
const TARGET_DIR = path.join(ROOT, 'public/packs')

const bank = JSON.parse(readFileSync(SOURCE, 'utf8'))

const questions = bank.map((question, index) => ({
  id: `fallback-${index + 1}`,
  locale: 'en',
  category: question.category,
  level: question.level,
  scope: 'global',
  text: question.text,
  options: question.options,
  correctIndex: question.correctIndex,
  explanation: question.explanation,
  fallback: false,
}))

mkdirSync(TARGET_DIR, { recursive: true })
writeFileSync(path.join(TARGET_DIR, 'fallback-en.json'), JSON.stringify(questions))
console.log(`Exported ${questions.length} fallback questions to public/packs/fallback-en.json`)
