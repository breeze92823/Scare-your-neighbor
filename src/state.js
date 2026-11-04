import { PLAYER_START } from './config.js'

// The player's counters shown on the HUD: speed (shoe), scare level (ghost) and
// money. Plain values with change listeners; game code calls set() / add().
const values = { ...PLAYER_START }
const listeners = new Set()

export const state = {
  get: (key) => values[key],
  set(key, value) {
    if (values[key] === value) return
    values[key] = value
    for (const fn of listeners) fn(key, value)
  },
  add(key, delta) {
    state.set(key, values[key] + delta)
  },
  // fn(key, value) on every change; called once per key right away.
  subscribe(fn) {
    listeners.add(fn)
    for (const key of Object.keys(values)) fn(key, values[key])
    return () => listeners.delete(fn)
  },
}

// $5,170 under ten thousand, then $10.7K / $1.31M / $250B.
const UNITS = ['K', 'M', 'B', 'T']
export function formatMoney(n) {
  n = Math.floor(n)
  if (n < 10000) return `$${n.toLocaleString('en-US')}`
  let i = -1
  while (n >= 1000 && i < UNITS.length - 1) {
    n /= 1000
    i++
  }
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2
  return `$${Number(n.toFixed(digits))}${UNITS[i]}`
}
