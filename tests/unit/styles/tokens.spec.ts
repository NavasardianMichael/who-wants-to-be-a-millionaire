import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { antdTheme } from '@styles/theme'
import { CORRECT, CSS_VAR_SCOPE, GOLD, LOCK, MAGENTA, SPOT, STUDIO, TEXT, WRONG } from '@styles/tokens'

/** globals.css §1 mirrors the ramps in `tokens.ts` (CSS cannot import JS); they must stay equal. */
const css = readFileSync(path.resolve(__dirname, '../../../src/styles/globals.css'), 'utf8').toLowerCase()

describe('design tokens', () => {
  const mirrors: [string, Record<string | number, string>][] = [
    ['studio', STUDIO],
    ['gold', GOLD],
    ['spot', SPOT],
    ['magenta', MAGENTA],
    ['lock', LOCK],
    ['correct', CORRECT],
    ['wrong', WRONG],
  ]

  it.each(mirrors)('%s ramp matches the stylesheet', (name, ramp) => {
    for (const [step, hex] of Object.entries(ramp)) expect(css).toContain(`--color-${name}-${step}: ${hex.toLowerCase()};`)
  })

  it('text colours match the stylesheet', () => {
    expect(css).toContain(`--color-ivory: ${TEXT.ivory};`)
    expect(css).toContain(`--color-mist: ${TEXT.mist};`)
    expect(css).toContain(`--color-mist-dim: ${TEXT.mistDim};`)
  })

  it('antd scopes its variables to the class the layout stamps on <html>', () => {
    expect(antdTheme.cssVar).toMatchObject({ prefix: 'ant', key: CSS_VAR_SCOPE })
  })

  it('declares the antd cascade layer between preflight and utilities', () => {
    expect(css).toContain('@layer theme, base, antd, components, utilities;')
  })

  it('names `--ant-*` variables only in the §2 alias block', () => {
    const start = css.indexOf('§2 antd aliases ─')
    const end = css.indexOf('§3 base ─')
    const outside = css.slice(0, start) + css.slice(end)
    expect(outside).not.toMatch(/var\(--ant-/)
  })
})
