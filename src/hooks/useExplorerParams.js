import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULTS, parseParams, toSearchParams } from '../lib/params'

// The URL is the single source of truth for search/filter/sort/page.
// No copy in React state means no chance of the two drifting apart.
export function useExplorerParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseParams(searchParams), [searchParams])

  const update = useCallback(
    (changes, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = { ...parseParams(prev), ...changes }
          // any change other than paging sends you back to page 1
          if (!('page' in changes)) next.page = 1
          return toSearchParams(next)
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  const reset = useCallback(() => {
    setSearchParams((prev) => {
      const { sort, size } = parseParams(prev)
      return toSearchParams({ ...DEFAULTS, sort, size })
    })
  }, [setSearchParams])

  return { params, update, reset }
}
