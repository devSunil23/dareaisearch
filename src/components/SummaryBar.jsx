import { formatMoney, formatNumber } from '../lib/format'
import ErrorPanel from './ErrorPanel'

// Fetched separately from the list on purpose: if this request fails the table can
// still be perfectly fine, and we show that as a partial failure instead of a full error.
export default function SummaryBar({ summary }) {
  if (summary.status === 'error') {
    return (
      <div className="summary">
        <ErrorPanel compact title="Totals unavailable." error={summary.error} onRetry={summary.retry} />
      </div>
    )
  }

  const d = summary.data
  const pending = !d
  return (
    <dl className={`summary${summary.isStale ? ' is-stale' : ''}`} aria-busy={summary.isLoading}>
      <Stat label="Matching orders" value={pending ? null : formatNumber(d.count)} />
      <Stat label="Revenue" hint="excl. cancelled & refunded" value={pending ? null : formatMoney(d.revenue)} />
      <Stat label="Customers" value={pending ? null : formatNumber(d.customers)} />
    </dl>
  )
}

function Stat({ label, hint, value }) {
  return (
    <div className="stat">
      <dt>
        {label}
        {hint && <span className="muted small"> ({hint})</span>}
      </dt>
      <dd>{value ?? <span className="skeleton skeleton-text"><span className="sr-only">Loading</span></span>}</dd>
    </div>
  )
}
