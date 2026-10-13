import { CATEGORIES, COUNTRIES, STATUSES } from '../mocks/data'
import { SORTABLE } from '../mocks/query'

export const PAGE_SIZES = [50, 100, 500, 1000]

export const DEFAULTS = {
  q: '',
  status: '',
  category: '',
  country: '',
  sort: '-createdAt',
  page: 1,
  size: 100,
}

const oneOf = (list, value, fallback) => (list.includes(value) ? value : fallback)

// URL -> explorer state. Anything junk (hand-edited links, old bookmarks) falls back to defaults
// instead of breaking the page.
export function parseParams(searchParams) {
  const get = (k) => searchParams.get(k) ?? ''

  const sort = get('sort')
  const sortField = sort.replace(/^-/, '')
  const page = parseInt(get('page'), 10)
  const size = parseInt(get('size'), 10)

  return {
    q: get('q').slice(0, 100),
    status: oneOf(STATUSES, get('status'), ''),
    category: oneOf(CATEGORIES, get('category'), ''),
    country: oneOf(COUNTRIES, get('country'), ''),
    sort: SORTABLE.includes(sortField) ? sort : DEFAULTS.sort,
    page: page > 0 ? page : 1,
    size: oneOf(PAGE_SIZES, size, DEFAULTS.size),
  }
}

// state -> URL. Defaults are left out so the plain URL stays clean.
export function toSearchParams(params) {
  const sp = new URLSearchParams()
  for (const key of Object.keys(DEFAULTS)) {
    const value = key === 'q' ? params.q?.trim() : params[key]
    if (value != null && value !== '' && value !== DEFAULTS[key]) sp.set(key, String(value))
  }
  return sp
}

export const hasFilters = (p) => Boolean(p.q || p.status || p.category || p.country)
