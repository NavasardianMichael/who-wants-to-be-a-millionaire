import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The web app and the API each carry a copy of the game rules and the lifeline maths —
 * separate packages, different module resolution. Below the marker line the copies must be
 * identical, or the server would referee a different game than the one the client shows.
 */
const ROOT = path.resolve(__dirname, '../../..')
const MARKER = '// --- twin: keep identical below this line ---'

const below = (file: string) => {
  const text = readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n')
  const index = text.indexOf(MARKER)
  expect(index, `${file} has the twin marker`).toBeGreaterThanOrEqual(0)
  return text.slice(index)
}

describe('twin files', () => {
  it.each([
    ['src/constants/game.ts', 'server/src/lib/game.ts'],
    ['src/helpers/game/lifelines.ts', 'server/src/lib/lifelines.ts'],
  ])('%s matches %s', (web, server) => {
    expect(below(web)).toBe(below(server))
  })
})
