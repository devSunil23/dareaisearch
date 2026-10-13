import { useState } from 'react'
import { PAGE_SIZES } from '../lib/params'

export default function Pagination({ page, size, total, onPage, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size))
  const [draft, setDraft] = useState(null)

  function commitDraft() {
    if (draft == null) return
    const n = parseInt(draft, 10)
    setDraft(null)
    if (!Number.isNaN(n)) onPage(Math.min(pages, Math.max(1, n)))
  }

  return (
    <nav className="pager" aria-label="Pagination">
      <div className="pager-buttons">
        <button type="button" className="btn" onClick={() => onPage(1)} disabled={page <= 1} aria-label="First page">«</button>
        <button type="button" className="btn" onClick={() => onPage(page - 1)} disabled={page <= 1}>‹ Prev</button>

        <span className="pager-page">
          <label htmlFor="page-input">Page</label>
          <input
            id="page-input"
            type="number"
            min={1}
            max={pages}
            value={draft ?? page}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
          />
          <span>of {pages.toLocaleString()}</span>
        </span>

        <button type="button" className="btn" onClick={() => onPage(page + 1)} disabled={page >= pages}>Next ›</button>
        <button type="button" className="btn" onClick={() => onPage(pages)} disabled={page >= pages} aria-label="Last page">»</button>
      </div>

      <div className="field inline">
        <label htmlFor="page-size">Rows per page</label>
        <select id="page-size" value={size} onChange={(e) => onSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </nav>
  )
}
