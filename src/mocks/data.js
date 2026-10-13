// Deterministic fake data. Same seed -> same 12k orders on every load,
// so a shared link like /orders/ORD-04211 always points at the same record.

export const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']
export const CATEGORIES = ['Electronics', 'Home', 'Books', 'Apparel', 'Sports', 'Toys', 'Beauty', 'Grocery']
export const COUNTRIES = ['IN', 'US', 'GB', 'DE', 'FR', 'CA', 'AU', 'SG', 'AE', 'JP']

const FIRST = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Liam', 'Emma',
  'Noah', 'Olivia', 'Mateo', 'Sofia', 'Lukas', 'Mia', 'Hiro', 'Yuki', 'Omar', 'Layla', 'Chen', 'Mei',
  'Jack', 'Grace', 'Ethan', 'Chloe', 'Ravi', 'Isha', 'Daniel', 'Sara']
const LAST = ['Sharma', 'Patel', 'Iyer', 'Reddy', 'Gupta', 'Nair', 'Singh', 'Khan', 'Smith', 'Jones',
  'Brown', 'Garcia', 'Muller', 'Schmidt', 'Martin', 'Dubois', 'Tanaka', 'Sato', 'Haddad', 'Wang',
  'Li', 'Wilson', 'Taylor', 'Kumar', 'Das', 'Fischer', 'Rossi', 'Lopez']

const PRODUCTS = {
  Electronics: ['Wireless Earbuds', 'USB-C Hub', 'Mechanical Keyboard', '27" Monitor', 'Smart Watch', 'Power Bank', 'Webcam 1080p', 'Bluetooth Speaker'],
  Home: ['Ceramic Mug Set', 'Desk Lamp', 'Throw Blanket', 'Air Purifier', 'Cast Iron Pan', 'Wall Clock', 'Plant Pot'],
  Books: ['Clean Code', 'Atomic Habits', 'The Pragmatic Programmer', 'Sapiens', 'Deep Work', 'Dune', 'Refactoring'],
  Apparel: ['Running Tee', 'Denim Jacket', 'Wool Socks', 'Rain Shell', 'Hoodie', 'Chinos', 'Sneakers'],
  Sports: ['Yoga Mat', 'Dumbbell Pair', 'Cricket Bat', 'Football', 'Resistance Bands', 'Cycling Gloves'],
  Toys: ['Lego Set', 'Puzzle 1000pc', 'RC Car', 'Board Game', 'Plush Bear', 'Kite'],
  Beauty: ['Face Serum', 'Sunscreen SPF50', 'Lip Balm', 'Hair Oil', 'Body Lotion'],
  Grocery: ['Green Tea', 'Coffee Beans 1kg', 'Basmati Rice 5kg', 'Dark Chocolate', 'Olive Oil', 'Almonds'],
}

const PRICE_RANGE = {
  Electronics: [15, 450], Home: [8, 220], Books: [6, 45], Apparel: [10, 160],
  Sports: [9, 180], Toys: [7, 120], Beauty: [5, 70], Grocery: [3, 40],
}

// weighted so the status filter returns realistically uneven counts
const STATUS_WEIGHTS = [['pending', 8], ['paid', 14], ['shipped', 18], ['delivered', 48], ['cancelled', 7], ['refunded', 5]]

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateOrders(count = 12000, seed = 42) {
  const rand = mulberry32(seed)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const weighted = () => {
    let r = rand() * 100
    for (const [value, w] of STATUS_WEIGHTS) {
      if ((r -= w) < 0) return value
    }
    return 'delivered'
  }

  const customers = []
  for (let i = 0; i < 1800; i++) {
    const first = pick(FIRST)
    const last = pick(LAST)
    customers.push({
      id: `CUS-${String(i + 1).padStart(4, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      country: pick(COUNTRIES),
    })
  }

  // fixed "now" so the data doesn't shift between days
  const end = Date.UTC(2026, 8, 30)
  const span = 1000 * 60 * 60 * 24 * 730

  const orders = new Array(count)
  for (let i = 0; i < count; i++) {
    const customer = pick(customers)
    const category = pick(CATEGORIES)
    const [min, max] = PRICE_RANGE[category]
    const quantity = 1 + Math.floor(rand() * 4)
    const unitPrice = Math.round((min + rand() * (max - min)) * 100) / 100

    orders[i] = {
      id: `ORD-${String(i + 1).padStart(5, '0')}`,
      createdAt: new Date(end - Math.floor(rand() * span)).toISOString(),
      customerId: customer.id,
      customer: customer.name,
      email: customer.email,
      country: customer.country,
      product: pick(PRODUCTS[category]),
      category,
      quantity,
      unitPrice,
      amount: Math.round(unitPrice * quantity * 100) / 100,
      status: weighted(),
    }
  }
  return orders
}
