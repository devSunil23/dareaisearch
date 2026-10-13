import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRequest } from './useRequest'

// a promise we can resolve/reject from the test, to control response order
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useRequest', () => {
  it('ignores a slow earlier response that arrives after a newer one', async () => {
    const calls = {}
    // deliberately ignores the abort signal, like a badly behaved fetcher would
    const fetcher = (key) => () => (calls[key] = deferred()).promise

    const { result, rerender } = renderHook(({ k }) => useRequest(fetcher(k), k), {
      initialProps: { k: 'lap' },
    })
    rerender({ k: 'laptop' })

    // newer request answers first...
    await act(async () => calls.laptop.resolve(['laptop results']))
    expect(result.current.data).toEqual(['laptop results'])

    // ...then the old one finally shows up. It must not win.
    await act(async () => calls.lap.resolve(['lap results']))
    expect(result.current.data).toEqual(['laptop results'])
    expect(result.current.key).toBe('laptop')
  })

  it('aborts the previous request when the key changes', () => {
    const signals = []
    const fetcher = (signal) => {
      signals.push(signal)
      return new Promise(() => {})
    }

    const { rerender } = renderHook(({ k }) => useRequest(fetcher, k), { initialProps: { k: 'a' } })
    rerender({ k: 'b' })

    expect(signals.at(-2).aborted).toBe(true)
    expect(signals.at(-1).aborted).toBe(false)
  })

  it('keeps old data flagged as stale while the next key loads', async () => {
    const calls = {}
    const fetcher = (key) => () => (calls[key] = deferred()).promise

    const { result, rerender } = renderHook(({ k }) => useRequest(fetcher(k), k), { initialProps: { k: 'p1' } })
    await act(async () => calls.p1.resolve('page 1'))
    expect(result.current.isStale).toBe(false)

    rerender({ k: 'p2' })
    expect(result.current.data).toBe('page 1')
    expect(result.current.isStale).toBe(true)
    expect(result.current.key).toBe('p1')
  })

  it('drops old data on error and recovers on retry', async () => {
    let next = deferred()
    const fetcher = vi.fn(() => next.promise)

    const { result, rerender } = renderHook(({ k }) => useRequest(fetcher, k), { initialProps: { k: 'a' } })
    await act(async () => next.resolve('A data'))

    next = deferred()
    rerender({ k: 'b' })
    await act(async () => next.reject(new Error('boom')))

    // the error must not sit next to rows from the previous query
    expect(result.current.status).toBe('error')
    expect(result.current.data).toBeUndefined()

    next = deferred()
    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')
    await act(async () => next.resolve('B data'))

    await waitFor(() => expect(result.current.data).toBe('B data'))
    expect(result.current.error).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('does not report an error for a request it aborted itself', async () => {
    const fetcher = (signal) =>
      new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))))

    const { result, rerender } = renderHook(({ k }) => useRequest(fetcher, k), { initialProps: { k: 'a' } })
    rerender({ k: 'b' })
    await act(async () => {})

    expect(result.current.status).toBe('loading')
    expect(result.current.error).toBeNull()
  })
})
