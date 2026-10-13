import { describe, expect, it } from 'vitest'
import { DEFAULTS, parseParams, toSearchParams } from './params'

const parse = (qs) => parseParams(new URLSearchParams(qs))

describe('url params', () => {
  it('round-trips a full view through the URL', () => {
    const view = { q: 'priya', status: 'shipped', category: 'Books', country: 'IN', sort: 'amount', page: 3, size: 500 }
    expect(parse(toSearchParams(view).toString())).toEqual(view)
  })

  it('leaves defaults out of the URL', () => {
    expect(toSearchParams(DEFAULTS).toString()).toBe('')
    expect(toSearchParams({ ...DEFAULTS, status: 'paid' }).toString()).toBe('status=paid')
  })

  it('falls back to defaults for junk values instead of breaking', () => {
    expect(parse('status=lost&sort=-password&page=-4&size=7&country=XX')).toEqual(DEFAULTS)
    expect(parse('page=abc').page).toBe(1)
  })

  it('trims search text before writing it', () => {
    expect(toSearchParams({ ...DEFAULTS, q: '  mug ' }).get('q')).toBe('mug')
    expect(toSearchParams({ ...DEFAULTS, q: '   ' }).has('q')).toBe(false)
  })
})
