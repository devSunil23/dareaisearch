// The "server side" of the mock API. Kept free of MSW so it can be unit tested directly.

export const SORTABLE = ['id', 'createdAt', 'customer', 'amount', 'status']

export function filterOrders(orders, { q = '', status = '', category = '', country = '' } = {}) {
  const needle = q.trim().toLowerCase()
  return orders.filter((o) => {
    if (status && o.status !== status) return false
    if (category && o.category !== category) return false
    if (country && o.country !== country) return false
    if (!needle) return true
    return (
      o.id.toLowerCase().includes(needle) ||
      o.customer.toLowerCase().includes(needle) ||
      o.email.includes(needle) ||
      o.product.toLowerCase().includes(needle)
    )
  })
}

// sort is "field" for ascending or "-field" for descending
export function sortOrders(orders, sort = '-createdAt') {
  const desc = sort.startsWith('-')
  const field = desc ? sort.slice(1) : sort
  if (!SORTABLE.includes(field)) return orders

  const dir = desc ? -1 : 1
  return [...orders].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    if (av < bv) return -dir
    if (av > bv) return dir
    // tie-break on id so paging through equal values is stable
    return a.id < b.id ? -1 : 1
  })
}

export function queryOrders(orders, params) {
  const page = Math.max(1, Number(params.page) || 1)
  const size = Math.min(1000, Math.max(1, Number(params.size) || 100))

  const filtered = filterOrders(orders, params)
  const sorted = sortOrders(filtered, params.sort)
  const start = (page - 1) * size

  return {
    items: sorted.slice(start, start + size),
    total: filtered.length,
    page,
    size,
  }
}

export function summarize(orders, params) {
  const filtered = filterOrders(orders, params)
  let revenue = 0
  for (const o of filtered) {
    if (o.status !== 'cancelled' && o.status !== 'refunded') revenue += o.amount
  }
  return {
    count: filtered.length,
    revenue: Math.round(revenue * 100) / 100,
    customers: new Set(filtered.map((o) => o.customerId)).size,
  }
}
