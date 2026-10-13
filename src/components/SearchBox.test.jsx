import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchBox from './SearchBox'

describe('SearchBox', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const type = (value) => fireEvent.change(screen.getByLabelText('Search'), { target: { value } })

  it('commits once after the user stops typing', () => {
    const onCommit = vi.fn()
    render(<SearchBox value="" onCommit={onCommit} />)

    for (const v of ['l', 'la', 'lap', 'lapt', 'lapto', 'laptop']) {
      type(v)
      act(() => vi.advanceTimersByTime(100))
    }
    expect(onCommit).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(350))
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('laptop')
  })

  it('follows the URL when it changes from outside (back button, clear filters)', () => {
    const onCommit = vi.fn()
    const { rerender } = render(<SearchBox value="mug" onCommit={onCommit} />)

    rerender(<SearchBox value="" onCommit={onCommit} />)
    expect(screen.getByLabelText('Search')).toHaveValue('')

    act(() => vi.advanceTimersByTime(1000))
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("doesn't wipe what the user is typing when its own commit comes back", () => {
    const onCommit = vi.fn()
    const { rerender } = render(<SearchBox value="" onCommit={onCommit} />)

    type('desk')
    act(() => vi.advanceTimersByTime(350))
    expect(onCommit).toHaveBeenLastCalledWith('desk')

    // user keeps typing before the URL update lands
    type('desk la')
    rerender(<SearchBox value="desk" onCommit={onCommit} />)
    expect(screen.getByLabelText('Search')).toHaveValue('desk la')
  })

  it('commits immediately on Enter', () => {
    const onCommit = vi.fn()
    render(<SearchBox value="" onCommit={onCommit} />)
    type('lamp')
    fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledWith('lamp')

    act(() => vi.advanceTimersByTime(1000))
    expect(onCommit).toHaveBeenCalledTimes(1)
  })
})
