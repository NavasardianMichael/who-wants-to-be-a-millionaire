import { emblemDataUri } from '@helpers/brand'
import { STUDIO } from '@styles/tokens'

/**
 * The raster app icon, for `ImageResponse` (satori renders a flexbox subset, not arbitrary
 * SVG — the emblem goes in as an image). Full-bleed square: the OS applies its own mask.
 * `safeZone` shrinks the emblem into the 80% circle a maskable icon must survive.
 */
export const AppIcon = ({ size, safeZone = false }: { size: number; safeZone?: boolean }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(circle at 50% 35%, ${STUDIO[700]}, ${STUDIO[950]} 75%)`,
    }}
  >
    <img src={emblemDataUri()} width={size * (safeZone ? 0.62 : 0.84)} height={size * (safeZone ? 0.62 : 0.84)} alt='' />
  </div>
)
