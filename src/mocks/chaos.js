// Network misbehaviour settings for the mock API. Stored in localStorage so the
// footer controls survive a refresh (handy when recording the demo).

const KEY = 'explorer:chaos'
const DEFAULTS = { failRate: 0.1, latency: true }

export function getChaos() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return DEFAULTS
  }
}

export function setChaos(next) {
  localStorage.setItem(KEY, JSON.stringify({ ...getChaos(), ...next }))
}

export function randomLatency() {
  return getChaos().latency ? 200 + Math.floor(Math.random() * 2800) : 0
}

export function shouldFail() {
  return Math.random() < getChaos().failRate
}
