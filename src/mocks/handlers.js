import { http, HttpResponse, delay } from 'msw'
import { generateOrders } from './data'
import { queryOrders, summarize } from './query'
import { randomLatency, shouldFail } from './chaos'

let orders
const db = () => (orders ??= generateOrders())

const paramsFrom = (request) => Object.fromEntries(new URL(request.url).searchParams)

async function flaky() {
  await delay(randomLatency())
  if (shouldFail()) {
    const status = Math.random() < 0.5 ? 500 : 503
    return HttpResponse.json(
      { message: status === 503 ? 'Service temporarily unavailable' : 'Internal server error' },
      { status },
    )
  }
}

export const handlers = [
  http.get('/api/orders', async ({ request }) => {
    const failed = await flaky()
    if (failed) return failed
    return HttpResponse.json(queryOrders(db(), paramsFrom(request)))
  }),

  // registered before /:id so "summary" isn't treated as an order id
  http.get('/api/orders/summary', async ({ request }) => {
    const failed = await flaky()
    if (failed) return failed
    return HttpResponse.json(summarize(db(), paramsFrom(request)))
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    const failed = await flaky()
    if (failed) return failed
    const order = db().find((o) => o.id === params.id)
    if (!order) return HttpResponse.json({ message: `Order ${params.id} not found` }, { status: 404 })
    return HttpResponse.json(order)
  }),

  http.get('/api/customers/:id/orders', async ({ params }) => {
    const failed = await flaky()
    if (failed) return failed
    const items = db()
      .filter((o) => o.customerId === params.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return HttpResponse.json({ items })
  }),
]
