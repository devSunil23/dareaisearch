import { createBrowserRouter, Link } from 'react-router'
import Explorer from './components/Explorer'
import OrderDrawer from './components/OrderDrawer'

function NotFound() {
  return (
    <div className="app">
      <h1>Page not found</h1>
      <Link to="/">Back to orders</Link>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Explorer />,
    children: [{ path: 'orders/:orderId', element: <OrderDrawer /> }],
  },
  { path: '*', element: <NotFound /> },
])
