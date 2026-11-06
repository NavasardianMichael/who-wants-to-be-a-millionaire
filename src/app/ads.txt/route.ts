import { ADS_TXT_LINE, ADSENSE_ENABLED } from '@constants/ads'

/**
 * `/ads.txt` (IAB): authorises Google to sell this site's ad space. AdSense reads it from the
 * root domain, so the same line must also be served there (docs/ADSENSE_SETUP.md); this copy
 * covers the site's own host. 404 while AdSense is off. The extension keeps the proxy from
 * locale-prefixing it.
 */
export const dynamic = 'force-static'

export const GET = () =>
  ADSENSE_ENABLED
    ? new Response(`${ADS_TXT_LINE}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    : new Response('Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
