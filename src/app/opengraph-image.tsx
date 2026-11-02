import { ImageResponse } from 'next/og'
import { emblemDataUri } from '@helpers/brand'
import { GOLD, LOCK, SPOT, STUDIO, TEXT } from '@styles/tokens'
import en from '../messages/en.json'

/**
 * The link-preview card for every page (Open Graph; X falls back to it for `twitter:image`).
 * One English card, not 80: satori cannot shape Arabic, Indic or Myanmar text or lay out
 * right-to-left, so a translated headline would render broken in a quarter of the locales.
 * Each page's own `og:title` and `og:description` carry its language.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${en.Common.appName} — ${en.Common.tagline}`

const WIDTH = size.width
const GUTTER = 56

const ANSWERS = [
  { letter: 'A', text: en.Modes.classic.name },
  { letter: 'B', text: en.Modes.marathon.name, locked: true },
  { letter: 'C', text: en.Modes.timeAttack.name },
  { letter: 'D', text: en.Nav.leaderboard },
]

/**
 * The show's hexagonal panel as an SVG drawn at its exact pixel size, so the stroke stays
 * crisp (satori's clip-path cannot carry a border).
 */
const panel = (width: number, height: number, { fill, stroke }: { fill: [string, string]; stroke: string }) => {
  const tip = height * 0.38
  const inset = 1.5
  const points = [
    [inset, height / 2],
    [tip, inset],
    [width - tip, inset],
    [width - inset, height / 2],
    [width - tip, height - inset],
    [tip, height - inset],
  ]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fill[0]}"/><stop offset="1" stop-color="${fill[1]}"/></linearGradient></defs>
  <polygon points="${points.map((point) => point.join(',')).join(' ')}" fill="url(#fill)" stroke="${stroke}" stroke-width="3"/>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * The site's faces, fetched as TTF subsets at build time (this route is static). Offline,
 * satori's default face renders the same card.
 */
const loadFont = async (family: string, weight: 600 | 800, text: string) => {
  try {
    const query = `family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text()
    const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1]
    if (!url) return []
    return [{ name: family, weight, style: 'normal' as const, data: await (await fetch(url)).arrayBuffer() }]
  } catch {
    return []
  }
}

const Panel = ({ width, height, src, children }: { width: number; height: number; src: string; children: React.ReactNode }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width, height }}>
    <img src={src} width={width} height={height} alt='' style={{ position: 'absolute', top: 0, left: 0 }} />
    {children}
  </div>
)

export default async function OpengraphImage() {
  const headline = en.Home.heroTitle
  const copy = [en.Common.appName, en.Common.tagline, headline, ...ANSWERS.flatMap((a) => [a.letter, a.text])].join('')
  // Both cases: the wordmark is uppercased by `textTransform`, after the subset is chosen.
  const glyphs = `${copy}${copy.toUpperCase()}:`
  const fonts = [...(await loadFont('Montserrat', 800, glyphs)), ...(await loadFont('Manrope', 600, glyphs))]

  const questionWidth = WIDTH - GUTTER * 2
  const answerWidth = (questionWidth - 32) / 2

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `44px ${GUTTER}px 0`,
        background: `radial-gradient(circle at 50% 0%, ${STUDIO[700]}, ${STUDIO[900]} 55%, ${STUDIO[950]})`,
        fontFamily: 'Manrope',
        color: TEXT.ivory,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 44, height: 230 }}>
        <div style={{ display: 'flex', borderRadius: 999, boxShadow: `0 0 90px ${GOLD[400]}66` }}>
          <img src={emblemDataUri()} width={220} height={220} alt='' />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'Montserrat',
              fontSize: 100,
              lineHeight: 1,
              letterSpacing: 2,
              textTransform: 'uppercase',
              backgroundImage: `linear-gradient(180deg, ${GOLD[100]}, ${GOLD[300]} 50%, ${GOLD[500]})`,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {en.Common.appName}
          </div>
          <div style={{ fontSize: 32, color: TEXT.mist, marginTop: 18 }}>{en.Common.tagline}</div>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', marginTop: 34 }}>
        {/* The show's rail runs edge to edge behind the question. */}
        <div style={{ position: 'absolute', left: -GUTTER, right: -GUTTER, top: 51, height: 3, background: `${SPOT[300]}88` }} />
        <Panel width={questionWidth} height={104} src={panel(questionWidth, 104, { fill: [STUDIO[600], STUDIO[900]], stroke: GOLD[400] })}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'center', fontSize: 42 }}>{headline}</div>
        </Panel>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px 32px', marginTop: 24 }}>
        {ANSWERS.map(({ letter, text, locked }) => (
          <Panel
            key={letter}
            width={answerWidth}
            height={72}
            src={panel(answerWidth, 72, locked ? { fill: [LOCK[300], LOCK[500]], stroke: GOLD[200] } : { fill: [STUDIO[600], STUDIO[900]], stroke: SPOT[500] })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 44, fontSize: 32 }}>
              <span style={{ fontFamily: 'Montserrat', color: locked ? STUDIO[950] : GOLD[300] }}>{letter}:</span>
              <span style={{ color: locked ? STUDIO[950] : TEXT.ivory }}>{text}</span>
            </div>
          </Panel>
        ))}
      </div>
    </div>,
    { ...size, fonts }
  )
}
