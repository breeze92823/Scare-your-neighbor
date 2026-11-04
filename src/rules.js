import { PHYSICS, SCARE } from './config.js'

// Game formulas shared by the houses' signs, the neighbours and the player.

// Your scare chance (whole %) at a house: the tier's `chance` at its recommended
// scare level, falling off as (level/rec)^2 below it (10 vs 800 -> 0%) and rising
// toward SCARE.maxChance above it.
export function scareChance(tier, level) {
  const r = level / tier.scareLevel
  const p = r >= 1 ? tier.chance + (SCARE.maxChance - tier.chance) * (1 - 1 / r) : tier.chance * r * r
  return Math.floor(p)
}

// Run speed (m/s) for a speed stat: the base walk/sprint grows by a fixed share
// per power of ten, so 1 -> 8 m/s, 900 -> 16 m/s walking.
export function runSpeed(stat, sprint = false) {
  const base = sprint ? PHYSICS.sprintSpeed : PHYSICS.walkSpeed
  return base * (1 + Math.log10(Math.max(1, stat)) * SCARE.speed.perDecade)
}

// A neighbour chases a little slower than a player walking at the recommended speed.
export const chaseSpeed = (tier) => runSpeed(tier.speed) * SCARE.speed.chaseFactor

// 800 / 5K / 1.2M (stat numbers on signs and cards).
const UNITS = ['K', 'M', 'B', 'T']
export function formatNum(n) {
  n = Math.floor(n)
  if (n < 1000) return String(n)
  let i = -1
  while (n >= 1000 && i < UNITS.length - 1) {
    n /= 1000
    i++
  }
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2
  return `${Number(n.toFixed(digits))}${UNITS[i]}`
}
