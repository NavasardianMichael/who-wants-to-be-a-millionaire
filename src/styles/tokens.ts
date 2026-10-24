/**
 * The single source of truth for design constants (bookie's chain):
 *
 *   tokens.ts ─→ theme.ts (antd, cssVar) ─→ :root { --ant-* } ─→ globals.css §2 aliases ─→ utilities
 *            └→ globals.css §1 @theme ramps (mirrored literals — CSS cannot import JS;
 *               tests/unit/styles/tokens.spec.ts keeps the mirror equal)
 *
 * A raw hex may appear in this file and in globals.css §1 only (`pnpm gates`).
 *
 * The palette is the modern show's: a royal-purple studio, violet and magenta stage
 * light, silver-lilac rims on the answer panels, gold money, and the classic amber /
 * green / red of locking in, winning and losing.
 */

/** The set: royal purple, from the lit stage floor (500) to the dark of the rafters (950). */
export const STUDIO = {
  50: '#f6f1ff',
  100: '#ece2ff',
  200: '#d8c5ff',
  300: '#b997ff',
  400: '#9867f5',
  500: '#7a42e0',
  600: '#5f2bbd',
  700: '#471d94',
  800: '#30126a',
  900: '#1d0943',
  950: '#0e0424',
} as const

/** Stage light: violet-lilac beams, focus rings, the wire behind the question. */
export const SPOT = {
  100: '#f1ecff',
  300: '#c9b8ff',
  500: '#9f7bff',
  600: '#7f5af0',
} as const

/** The magenta wash of the modern show's lighting rig. */
export const MAGENTA = {
  300: '#f3a8ff',
  400: '#e276ff',
  500: '#c645f5',
  600: '#9a22cc',
} as const

/** Money: the ladder, safe havens, primary actions. */
export const GOLD = {
  100: '#fff6d9',
  200: '#ffe7a3',
  300: '#f6d477',
  400: '#e9b949',
  500: '#c99a2e',
  600: '#9e7420',
  700: '#6e4f12',
} as const

/** Answer states, as on the show. */
export const LOCK = { 300: '#ffc46b', 500: '#ff9a1f', 700: '#c76a00' } as const
export const CORRECT = { 300: '#7cf0ad', 500: '#1fd16b', 700: '#0e8f45' } as const
export const WRONG = { 300: '#ff8a96', 500: '#ff3b4e', 700: '#b3172a' } as const

/** Copy on the dark set: a faintly lilac white, and two muted steps. */
export const TEXT = {
  ivory: '#f8f4ff',
  mist: '#c7bce6',
  mistDim: '#9284c2',
} as const

/** Hairlines and rims on purple surfaces. */
export const LINE = {
  subtle: '#3a2470',
  strong: '#5c3fa6',
} as const

/** Corner radius in px — deliberately tight, like the show's hard-edged graphics: tags, controls, panels. */
export const RADII = { sm: 4, base: 6, lg: 10 } as const

/**
 * The class antd scopes its `--ant-*` block to: `ConfigProvider theme.cssVar.key`, stamped
 * on `<html>` by the root layout. Both ends must agree or every alias in globals.css §2
 * resolves to nothing.
 */
export const CSS_VAR_SCOPE = 'css-var-millionaire'

export const CONFETTI_COLORS = [GOLD[100], GOLD[300], GOLD[400], SPOT[300], MAGENTA[400], TEXT.ivory]
