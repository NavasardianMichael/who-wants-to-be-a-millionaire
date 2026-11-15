import { describe, expect, it } from 'vitest'
import { NETWORK_SITES } from '@constants/network'
import { networkLink } from '@helpers/network'

const [crossword, eapps] = NETWORK_SITES

describe('eapps network links', () => {
  it('links over https with no trailing slash', () => {
    for (const site of NETWORK_SITES) {
      expect(new URL(site.url).protocol).toBe('https:')
      expect(site.url.endsWith('/')).toBe(false)
    }
  })

  it("opens crossword in the visitor's language, in crossword's code for it", () => {
    expect(networkLink(crossword!, 'hy')).toEqual({ name: 'Crossword AI', href: 'https://crossword.eapps.site/hy', hrefLang: 'hy' })
    expect(networkLink(crossword!, 'zh-CN').href).toBe('https://crossword.eapps.site/zh')
    expect(networkLink(crossword!, 'pt-BR').href).toBe('https://crossword.eapps.site/pt')
  })

  it('lets crossword negotiate a language it shares no code for', () => {
    expect(networkLink(crossword!, 'ka')).toEqual({ name: 'Crossword AI', href: 'https://crossword.eapps.site' })
  })

  it('pins eapps.site to English outside its three languages', () => {
    expect(networkLink(eapps!, 'ru').href).toBe('https://eapps.site/ru')
    expect(networkLink(eapps!, 'ja')).toEqual({ name: 'eapps.site', href: 'https://eapps.site/en' })
  })
})
