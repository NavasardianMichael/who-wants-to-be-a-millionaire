import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { GOLD, SPOT, STUDIO, TEXT } from '@styles/tokens'

/** `tokens.ts` mirrors a few colours for JavaScript; each must still exist in globals.css §1. */
const css = readFileSync(path.resolve(__dirname, '../../../src/styles/globals.css'), 'utf8').toLowerCase()

describe('design tokens', () => {
  const mirrors: [string, Record<string | number, string>][] = [
    ['studio', STUDIO],
    ['gold', GOLD],
    ['spot', SPOT],
  ]

  it.each(mirrors)('%s ramp matches the stylesheet', (name, ramp) => {
    for (const [step, hex] of Object.entries(ramp)) expect(css).toContain(`--color-${name}-${step}: ${hex.toLowerCase()};`)
  })

  it('text colours match the stylesheet', () => {
    expect(css).toContain(`--color-ivory: ${TEXT.ivory};`)
    expect(css).toContain(`--color-mist: ${TEXT.mist};`)
  })
})
