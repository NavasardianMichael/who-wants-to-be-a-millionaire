import { describe, expect, it } from 'vitest'
import { extractJsonObject } from '../../../server/src/lib/ai/openrouter'

describe('extractJsonObject', () => {
  it('leaves a bare object alone', () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}')
  })

  it('drops a code fence', () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })

  it('drops prose around the object', () => {
    expect(JSON.parse(extractJsonObject('Here you go:\n{"a":{"b":[1,2]}}\nEnjoy!'))).toEqual({ a: { b: [1, 2] } })
  })

  it('returns text without an object as it is, for the parser to reject', () => {
    expect(extractJsonObject('  no json here ')).toBe('no json here')
  })
})
