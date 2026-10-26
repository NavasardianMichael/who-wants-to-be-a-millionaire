import { GOLD, SPOT, STUDIO } from '@styles/tokens'

/**
 * The emblem as an SVG string — one source for the in-page logo, the generated app icons,
 * the OG images and the offline page. An original mark (a gold-ringed studio disc with an
 * "M" under a diamond), deliberately not the TV show's logo.
 */
export const emblemSvg = ({ withRays = true }: { withRays?: boolean } = {}): string => {
  const rays = withRays
    ? Array.from({ length: 16 }, (_, index) => {
        const angle = (index * 360) / 16
        return `<line x1="50" y1="9" x2="50" y2="17" transform="rotate(${angle} 50 50)" stroke="${SPOT[300]}" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>`
      }).join('')
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="disc" cx="50%" cy="38%" r="65%">
      <stop offset="0" stop-color="${STUDIO[600]}"/>
      <stop offset="0.55" stop-color="${STUDIO[800]}"/>
      <stop offset="1" stop-color="${STUDIO[950]}"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD[100]}"/>
      <stop offset="0.5" stop-color="${GOLD[300]}"/>
      <stop offset="1" stop-color="${GOLD[500]}"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#disc)" stroke="url(#gold)" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="38" fill="none" stroke="${GOLD[400]}" stroke-opacity="0.45" stroke-width="1"/>
  ${rays}
  <path d="M50 23 L56 30 L50 37 L44 30 Z" fill="url(#gold)"/>
  <path d="M29 70 L29 43 L50 61 L71 43 L71 70" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
}

export const emblemDataUri = (options?: { withRays?: boolean }): string =>
  `data:image/svg+xml;base64,${Buffer.from(emblemSvg(options)).toString('base64')}`
