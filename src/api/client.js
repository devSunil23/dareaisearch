export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function get(path, signal) {
  let res
  try {
    res = await fetch(path, { signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Network error. Check your connection.', 0)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.message || `Request failed with ${res.status}`, res.status)
  }
  return res.json()
}

function qs(obj) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) {
    if (v !== '' && v != null) sp.set(k, v)
  }
  return sp.toString()
}

export const fetchOrders = (params, signal) => get(`/api/orders?${qs(params)}`, signal)

export const fetchSummary = ({ q, status, category, country }, signal) =>
  get(`/api/orders/summary?${qs({ q, status, category, country })}`, signal)

export const fetchOrder = (id, signal) => get(`/api/orders/${encodeURIComponent(id)}`, signal)

export const fetchCustomerOrders = (customerId, signal) =>
  get(`/api/customers/${encodeURIComponent(customerId)}/orders`, signal)
