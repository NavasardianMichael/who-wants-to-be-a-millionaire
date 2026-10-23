/**
 * The few design tokens JavaScript needs — the manifest's colours, the viewport theme
 * colour, generated icons and OG images, the service worker's offline page.
 *
 * Mirrors §1 of `globals.css`, which owns every colour. `tests/unit/styles/tokens.spec.ts`
 * fails if a value here drifts from the stylesheet.
 */
export const STUDIO = {
  950: '#02040f',
  900: '#050a26',
  800: '#0a1442',
  700: '#11206a',
  600: '#1a3196',
} as const

export const GOLD = {
  100: '#fff6d9',
  200: '#ffe7a3',
  300: '#f6d477',
  400: '#e9b949',
  500: '#c99a2e',
} as const

export const SPOT = {
  500: '#3d7bff',
  300: '#8db4ff',
} as const

export const TEXT = {
  ivory: '#f5f2e8',
  mist: '#b9c3e6',
} as const

/** Lets the gate's hex rule recognise this file as the palette. */
export const CONFETTI_COLORS = [GOLD[100], GOLD[300], GOLD[400], SPOT[300], TEXT.ivory]
