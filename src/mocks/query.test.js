import { describe, expect, it } from 'vitest'
import { generateOrders } from './data'
import { queryOrders } from './query'

const orders = generateOrders()

describe('mock api query', () => {
  it('generates the same data every time', () => {
    expect(orders).toHaveLength(12000)
    expect(generateOrders()[4210]).toEqual(orders[4210])
  })

  it('filters, searches and counts on the server side', () => {
    const res = queryOrders(orders, { status: 'shipped', category: 'Books', q: 'SHARMA', size: 1000 })
    expect(res.total).toBeGreaterThan(0)
    for (const o of res.items) {
      expect(o.status).toBe('shipped')
      expect(o.category).toBe('Books')
      expect(o.customer.toLowerCase()).toContain('sharma')
    }
  })

  it('sorts descending with "-field"', () => {
    const { items } = queryOrders(orders, { sort: '-amount', size: 50 })
    for (let i = 1; i < items.length; i++) expect(items[i - 1].amount).toBeGreaterThanOrEqual(items[i].amount)
  })

  it('pages without overlaps or gaps, even when sort values tie', () => {
    // status has lots of ties, so this only works with a stable tie-breaker
    const p1 = queryOrders(orders, { sort: 'status', page: 1, size: 100 }).items
    const p2 = queryOrders(orders, { sort: 'status', page: 2, size: 100 }).items
    const both = queryOrders(orders, { sort: 'status', page: 1, size: 200 }).items
    expect([...p1, ...p2].map((o) => o.id)).toEqual(both.map((o) => o.id))
  })

  it('returns an empty page (not an error) past the end', () => {
    const res = queryOrders(orders, { status: 'refunded', page: 9999 })
    expect(res.items).toEqual([])
    expect(res.total).toBeGreaterThan(0)
  })
})
