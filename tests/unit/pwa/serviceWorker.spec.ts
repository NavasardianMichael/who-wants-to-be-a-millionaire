import { describe, expect, it } from 'vitest'
import { buildServiceWorkerScript } from '@helpers/pwa'

const script = (build: string) => buildServiceWorkerScript({ version: 'v9', build, offlineDocument: '<p>offline</p>' })

describe('buildServiceWorkerScript', () => {
  it('is valid JavaScript', () => {
    // Parsed only, never called.
    expect(() => new Function(script('abc123'))).not.toThrow()
  })

  it("names the pages-and-chunks cache after the build, so a deploy drops the old build's files", () => {
    expect(script('abc123')).toContain('const CACHE = "millionaire-v9-abc123";')
    expect(script('def456')).toContain('const CACHE = "millionaire-v9-def456";')
  })

  it('keeps sounds, packs and fonts in a cache that outlives builds', () => {
    expect(script('abc123')).toContain('const MEDIA_CACHE = "millionaire-v9-media";')
    expect(script('def456')).toContain('const MEDIA_CACHE = "millionaire-v9-media";')
  })
})
