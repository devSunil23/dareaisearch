import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './App'
import './index.css'

const root = createRoot(document.getElementById('root'))

// The mock API runs in a service worker, in prod too (there's no real backend).
// Render only after it's ready, otherwise the first requests would hit the network and 404.
async function startMockApi() {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
}

startMockApi()
  .then(() => {
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  })
  .catch((err) => {
    console.error(err)
    root.render(
      <p style={{ padding: 24 }}>
        Couldn’t start the mock API (service workers may be blocked, e.g. in a private window).
      </p>,
    )
  })
