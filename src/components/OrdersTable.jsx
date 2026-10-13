import { memo, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { COUNTRY_NAMES, formatDate, formatMoney } from '../lib/format'
import StatusBadge from './StatusBadge'

const ROW_HEIGHT = 44
const HEADER_HEIGHT = 40

const COLUMNS = [
  { key: 'id', label: 'Order', sortable: true, className: 'col-id' },
  { key: 'createdAt', label: 'Date', sortable: true, className: 'col-date' },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category', className: 'col-category' },
  { key: 'status', label: 'Status', sortable: true, className: 'col-status' },
  { key: 'country', label: 'Country', className: 'col-country' },
  { key: 'amount', label: 'Amount', sortable: true, className: 'col-amount num' },
]

export default function OrdersTable({ rows, rowOffset, total, sort, onSort, onOpen, stale, scrollKey, search }) {
  const scrollRef = useRef(null)
  const pendingFocus = useRef(null)
  const saveFrame = useRef(0)

  // reset the roving tab stop when a new page of rows arrives
  const [active, setActive] = useState(0)
  const [prevRows, setPrevRows] = useState(rows)
  if (rows !== prevRows) {
    setPrevRows(rows)
    setActive(0)
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    paddingStart: HEADER_HEIGHT,
    scrollPaddingStart: HEADER_HEIGHT,
  })

  const items = virtualizer.getVirtualItems()
  // On the very first render the virtualizer hasn't measured the container yet and returns
  // no items. Still give the table its full height, or restoring scrollTop gets clamped to 0.
  const padTop = items.length ? items[0].start - HEADER_HEIGHT : 0
  const padBottom = items.length
    ? virtualizer.getTotalSize() - items[items.length - 1].end
    : virtualizer.getTotalSize() - HEADER_HEIGHT

  // Scroll position per result set lives in sessionStorage, so a refresh lands you
  // where you were. A new query with no saved position starts at the top.
  useLayoutEffect(() => {
    const saved = Number(sessionStorage.getItem(`scroll:${scrollKey}`)) || 0
    scrollRef.current.scrollTop = saved
  }, [scrollKey])

  function handleScroll() {
    if (saveFrame.current) return
    saveFrame.current = requestAnimationFrame(() => {
      saveFrame.current = 0
      if (scrollRef.current) sessionStorage.setItem(`scroll:${scrollKey}`, String(Math.round(scrollRef.current.scrollTop)))
    })
  }

  // The row we want to focus may not be in the DOM until the virtualizer has scrolled
  // and re-rendered, so keep trying after each render until it shows up.
  useLayoutEffect(() => {
    if (pendingFocus.current == null) return
    const el = scrollRef.current?.querySelector(`tr[data-index="${pendingFocus.current}"]`)
    if (el) {
      el.focus({ preventScroll: true })
      pendingFocus.current = null
    }
  })

  function moveTo(index) {
    setActive(index)
    pendingFocus.current = index
    virtualizer.scrollToIndex(index, { align: 'auto' })
  }

  function handleKeyDown(e) {
    if (e.target.tagName !== 'TR') return
    const last = rows.length - 1
    const step = Math.max(1, Math.floor((scrollRef.current.clientHeight - HEADER_HEIGHT) / ROW_HEIGHT) - 1)
    let next
    switch (e.key) {
      case 'ArrowDown': next = Math.min(active + 1, last); break
      case 'ArrowUp': next = Math.max(active - 1, 0); break
      case 'PageDown': next = Math.min(active + step, last); break
      case 'PageUp': next = Math.max(active - step, 0); break
      case 'Home': next = 0; break
      case 'End': next = last; break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onOpen(rows[active].id)
        return
      default:
        return
    }
    e.preventDefault()
    moveTo(next)
  }

  return (
    <div className="table-scroll" ref={scrollRef} onScroll={handleScroll}>
      <table className="orders" aria-rowcount={total + 1} aria-describedby="table-help" aria-busy={stale}>
        <caption className="sr-only">
          Orders
          <span id="table-help">. Use the up and down arrow keys to move between rows and Enter to open an order.</span>
        </caption>
        <thead>
          <tr aria-rowindex={1}>
            {COLUMNS.map((col) => (
              <HeaderCell key={col.key} col={col} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody onKeyDown={handleKeyDown} className={stale ? 'is-stale' : undefined}>
          {padTop > 0 && <tr className="spacer" aria-hidden="true" style={{ height: padTop }} />}
          {items.map((item) => (
            <Row
              key={rows[item.index].id}
              order={rows[item.index]}
              index={item.index}
              rowIndex={rowOffset + item.index + 2}
              active={item.index === active}
              search={search}
              onOpen={onOpen}
              onFocusRow={setActive}
            />
          ))}
          {padBottom > 0 && <tr className="spacer" aria-hidden="true" style={{ height: padBottom }} />}
        </tbody>
      </table>
    </div>
  )
}

function HeaderCell({ col, sort, onSort }) {
  const desc = sort.startsWith('-')
  const field = desc ? sort.slice(1) : sort
  const sorted = field === col.key
  const ariaSort = sorted ? (desc ? 'descending' : 'ascending') : undefined

  return (
    <th scope="col" className={col.className} aria-sort={ariaSort}>
      {col.sortable ? (
        <button type="button" className="sort-btn" onClick={() => onSort(col.key)}>
          {col.label}
          <span className="sort-icon" aria-hidden="true">
            {sorted ? (desc ? '▼' : '▲') : '↕'}
          </span>
        </button>
      ) : (
        col.label
      )}
    </th>
  )
}

const Row = memo(function Row({ order, index, rowIndex, active, search, onOpen, onFocusRow }) {
  return (
    <tr
      data-index={index}
      aria-rowindex={rowIndex}
      tabIndex={active ? 0 : -1}
      onClick={(e) => {
        // let the order-id link handle cmd/ctrl-click (open in new tab) itself
        if (e.target.closest('a')) return
        onOpen(order.id)
      }}
      onFocus={() => onFocusRow(index)}
    >
      <td className="col-id">
        <Link
          to={{ pathname: `/orders/${order.id}`, search }}
          state={{ fromList: true }}
          tabIndex={-1}
          className="mono"
        >
          {order.id}
        </Link>
      </td>
      <td className="col-date">{formatDate(order.createdAt)}</td>
      <td className="truncate">{order.customer}</td>
      <td className="truncate">{order.product}</td>
      <td className="col-category">{order.category}</td>
      <td className="col-status"><StatusBadge status={order.status} /></td>
      <td className="col-country" title={COUNTRY_NAMES[order.country]}>{order.country}</td>
      <td className="col-amount num">{formatMoney(order.amount)}</td>
    </tr>
  )
})
