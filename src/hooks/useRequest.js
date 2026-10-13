import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs `fetcher(signal)` whenever `key` changes and keeps only the latest answer.
 *
 * Two guards against out-of-order responses:
 *  1. the previous request is aborted when the key changes
 *  2. every run gets an id, and a response is dropped unless it belongs to the latest run
 *     (covers fetchers that ignore the abort signal, or resolve in the same tick)
 *
 * While a new key is loading, the previous data is kept but `isStale` is true so the UI
 * can grey it out. On error the data is dropped, so old rows never pass for current ones.
 *
 * Pass `key = null` to skip fetching.
 */
export function useRequest(fetcher, key) {
  const [state, setState] = useState({ status: key == null ? 'idle' : 'loading', data: undefined, error: null, key: null })
  const [attempt, setAttempt] = useState(0)
  const runId = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (key == null) return

    const id = ++runId.current
    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading', error: null }))

    fetcherRef.current(controller.signal).then(
      (data) => {
        if (id !== runId.current) return
        setState({ status: 'success', data, error: null, key })
      },
      (error) => {
        if (id !== runId.current || controller.signal.aborted) return
        setState({ status: 'error', data: undefined, error, key })
      },
    )

    return () => controller.abort()
  }, [key, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return {
    ...state,
    isLoading: state.status === 'loading',
    isStale: state.status === 'loading' && state.data !== undefined,
    retry,
  }
}
