import { useState } from 'react'
import { getChaos, setChaos } from '../mocks/chaos'

const RATES = [0, 0.1, 0.3, 0.5, 1]

// Lets you turn the mock API's bad behaviour up or down without touching DevTools.
export default function ChaosControls() {
  const [chaos, setLocal] = useState(getChaos)

  function change(next) {
    setChaos(next)
    setLocal((c) => ({ ...c, ...next }))
  }

  return (
    <footer className="chaos">
      <span className="muted">Mock API:</span>
      <div className="field inline">
        <label htmlFor="fail-rate">Failure rate</label>
        <select id="fail-rate" value={chaos.failRate} onChange={(e) => change({ failRate: Number(e.target.value) })}>
          {RATES.map((r) => <option key={r} value={r}>{r * 100}%</option>)}
        </select>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={chaos.latency} onChange={(e) => change({ latency: e.target.checked })} />
        Random latency (200ms–3s)
      </label>
    </footer>
  )
}
