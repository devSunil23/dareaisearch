import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { fetchCustomerOrders, fetchOrder } from '../api/client'
import { useRequest } from '../hooks/useRequest'
import { COUNTRY_NAMES, formatDate, formatDateTime, formatMoney } from '../lib/format'
import StatusBadge from './StatusBadge'
import ErrorPanel from './ErrorPanel'

export default function OrderDrawer() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dialogRef = useRef(null)

  const order = useRequest((signal) => fetchOrder(orderId, signal), orderId)
  const customerId = order.status === 'success' ? order.data.customerId : null
  const related = useRequest((signal) => fetchCustomerOrders(customerId, signal), customerId)

  // Native <dialog> gives us the focus trap, Esc handling and an inert background for free.
  // Focus goes back to whatever opened it (normally the table row).
  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      if (opener instanceof HTMLElement && opener !== document.body && opener.isConnected) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [])

  function close() {
    // Came from the list: going back keeps history tidy (and back/forward still makes sense).
    // Deep link: there's nothing to go back to, so go to the list with the same filters.
    if (location.state?.fromList) navigate(-1)
    else navigate({ pathname: '/', search: location.search })
  }

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      aria-labelledby="drawer-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => e.target === dialogRef.current && close()}
    >
      <div className="drawer-inner">
        <header className="drawer-header">
          <div>
            <p className="muted small">Order</p>
            <h2 id="drawer-title" className="mono">{orderId}</h2>
          </div>
          <div className="drawer-actions">
            <CopyLink />
            <button type="button" className="btn" onClick={close} aria-label="Close order details" autoFocus>
              ✕
            </button>
          </div>
        </header>

        <div className="drawer-body" aria-busy={order.isLoading}>
          {order.status === 'error' ? (
            order.error.status === 404 ? (
              <div className="panel" role="alert">
                <strong>Order not found.</strong>
                <span className="muted">It may have been removed, or the link is wrong.</span>
              </div>
            ) : (
              <ErrorPanel title="Couldn't load this order." error={order.error} onRetry={order.retry} />
            )
          ) : order.status === 'success' ? (
            <OrderDetails
              order={order.data}
              related={related}
              linkState={location.state}
              search={location.search}
            />
          ) : (
            <DetailsSkeleton />
          )}
        </div>
      </div>
    </dialog>
  )
}

function OrderDetails({ order, related, linkState, search }) {
  return (
    <>
      <p className="sr-only" role="status">Order {order.id} loaded.</p>
      <dl className="details">
        <dt>Status</dt>
        <dd><StatusBadge status={order.status} /></dd>
        <dt>Placed</dt>
        <dd>{formatDateTime(order.createdAt)}</dd>
        <dt>Customer</dt>
        <dd>
          {order.customer}
          <br />
          <a href={`mailto:${order.email}`} className="muted">{order.email}</a>
        </dd>
        <dt>Country</dt>
        <dd>{COUNTRY_NAMES[order.country]}</dd>
        <dt>Product</dt>
        <dd>{order.product} <span className="muted">· {order.category}</span></dd>
        <dt>Quantity</dt>
        <dd>{order.quantity} × {formatMoney(order.unitPrice)}</dd>
        <dt>Total</dt>
        <dd className="total">{formatMoney(order.amount)}</dd>
      </dl>

      <section className="related" aria-labelledby="related-title">
        <h3 id="related-title">Other orders from {order.customer.split(' ')[0]}</h3>
        {related.status === 'error' ? (
          <ErrorPanel compact title="Couldn't load other orders." error={related.error} onRetry={related.retry} />
        ) : related.status !== 'success' ? (
          <p className="muted">Loading…</p>
        ) : (
          <RelatedList items={related.data.items.filter((o) => o.id !== order.id)} linkState={linkState} search={search} />
        )}
      </section>
    </>
  )
}

function RelatedList({ items, linkState, search }) {
  if (items.length === 0) return <p className="muted">This is their only order.</p>

  return (
    <ul className="related-list">
      {items.slice(0, 8).map((o) => (
        <li key={o.id}>
          {/* replace, so closing the drawer still goes straight back to the list */}
          <Link to={{ pathname: `/orders/${o.id}`, search }} replace state={linkState}>
            <span className="mono">{o.id}</span>
            <span className="muted">{formatDate(o.createdAt)}</span>
            <span className="truncate">{o.product}</span>
            <span className="num">{formatMoney(o.amount)}</span>
          </Link>
        </li>
      ))}
      {items.length > 8 && <li className="muted small">and {items.length - 8} more</li>}
    </ul>
  )
}

function CopyLink() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true))}
    >
      <span aria-live="polite">{copied ? 'Copied!' : 'Copy link'}</span>
    </button>
  )
}

function DetailsSkeleton() {
  return (
    <div aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="skeleton skeleton-line" />
      ))}
    </div>
  )
}
