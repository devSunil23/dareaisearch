import { useEffect, useRef, useState } from 'react'

// Keeps its own input state so typing doesn't re-render the whole explorer.
// Only the debounced value is pushed up (and into the URL).
export default function SearchBox({ value, onCommit, delay = 350 }) {
  const [text, setText] = useState(value)
  const committed = useRef(value)
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  // URL changed from outside (back/forward, "clear filters") -> reflect it in the input.
  // Skip when it's just our own commit coming back round, otherwise we'd clobber
  // whatever the user typed in the meantime.
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const next = text.trim()
    if (next === committed.current) return
    const timer = setTimeout(() => {
      // Enter may have already flushed this value
      if (next === committed.current) return
      committed.current = next
      onCommitRef.current(next)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay])

  function flush() {
    const next = text.trim()
    if (next !== committed.current) {
      committed.current = next
      onCommit(next)
    }
  }

  return (
    <div className="field search">
      <label htmlFor="search">Search</label>
      <input
        id="search"
        type="search"
        value={text}
        placeholder="Order ID, customer, email, product…"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && flush()}
      />
    </div>
  )
}
