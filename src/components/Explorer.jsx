import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { fetchOrders, fetchSummary } from '../api/client'
import { useExplorerParams } from '../hooks/useExplorerParams'
import { useRequest } from '../hooks/useRequest'
import { DEFAULTS, hasFilters, toSearchParams } from '../lib/params'
import { formatNumber } from '../lib/format'
import SearchBox from './SearchBox'
import Filters from './Filters'
import SummaryBar from './SummaryBar'
import OrdersTable from './OrdersTable'
import Pagination from './Pagination'
import ErrorPanel from './ErrorPanel'
import ChaosControls from './ChaosControls'

// sorting by these makes more sense biggest/newest first
const DESC_FIRST = ['createdAt', 'amount']

export default function Explorer() {
  const { params, update, reset } = useExplorerParams()
  const navigate = useNavigate()
  const location = useLocation()

  const listKey = toSearchParams(params).toString()
  const summaryKey = toSearchParams({ ...DEFAULTS, q: params.q, status: params.status, category: params.category, country: params.country }).toString()

  const list = useRequest((signal) => fetchOrders(params, signal), listKey)
  const summary = useRequest((signal) => fetchSummary(params, signal), summaryKey)

  const search = location.search
  const openOrder = useCallback(
    (id) => navigate({ pathname: `/orders/${id}`, search }, { state: { fromList: true } }),
    [navigate, search],
  )

  const handleSort = useCallback(
    (field) => {
      const current = params.sort.replace(/^-/, '')
      let next
      if (current === field) next = params.sort.startsWith('-') ? field : `-${field}`
      else next = DESC_FIRST.includes(field) ? `-${field}` : field
      update({ sort: next })
    },
    [params.sort, update],
  )

  const data = list.data

  return (
    <div className="app">
      <header className="app-header">
        <h1>Orders</h1>
        <p className="muted">12,000 mock orders served by a deliberately slow and flaky API.</p>
      </header>

      <section className="toolbar" aria-label="Search and filters">
        <SearchBox value={params.q} onCommit={(q) => update({ q })} />
        <Filters params={params} onChange={update} />
        <button type="button" className="btn btn-ghost" onClick={reset} disabled={!hasFilters(params)}>
          Clear filters
        </button>
      </section>

      <SummaryBar summary={summary} />

      <main className="results">
        <ResultLine list={list} />

        {list.status === 'error' ? (
          <ErrorPanel error={list.error} onRetry={list.retry} />
        ) : !data ? (
          <TableSkeleton />
        ) : data.total === 0 ? (
          <div className={`panel${list.isStale ? ' is-stale' : ''}`}>
            <strong>No orders match {params.q ? `“${params.q}”` : 'these filters'}.</strong>
            {hasFilters(params) && (
              <button type="button" className="btn" onClick={reset}>Clear filters</button>
            )}
          </div>
        ) : data.items.length === 0 ? (
          <div className={`panel${list.isStale ? ' is-stale' : ''}`}>
            <strong>Page {data.page} doesn’t exist for this search.</strong>
            <button type="button" className="btn" onClick={() => update({ page: Math.ceil(data.total / data.size) })}>
              Go to last page
            </button>
          </div>
        ) : (
          <OrdersTable
            rows={data.items}
            rowOffset={(data.page - 1) * data.size}
            total={data.total}
            sort={params.sort}
            onSort={handleSort}
            onOpen={openOrder}
            stale={list.isStale}
            scrollKey={list.key}
            search={search}
          />
        )}

        {data && data.total > 0 && (
          <Pagination
            page={params.page}
            size={params.size}
            total={data.total}
            onPage={(page) => update({ page })}
            onSize={(size) => update({ size })}
          />
        )}
      </main>

      <ChaosControls />

      {/* order detail drawer renders here, on top of the list, so the list never unmounts */}
      <Outlet />
    </div>
  )
}

function ResultLine({ list }) {
  const d = list.data
  let text = ''
  if (list.status === 'error') text = ''
  else if (!d) text = 'Loading orders…'
  else if (d.total === 0) text = 'No matching orders.'
  else if (d.items.length > 0) {
    const from = (d.page - 1) * d.size + 1
    const to = from + d.items.length - 1
    text = `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(d.total)} orders`
  }

  return (
    <div className="result-line">
      <p role="status" aria-live="polite" aria-atomic="true">
        {text}
      </p>
      {list.isStale && (
        <span className="updating" aria-hidden="true">
          <span className="spinner" /> Updating…
        </span>
      )}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="table-scroll" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  )
}
