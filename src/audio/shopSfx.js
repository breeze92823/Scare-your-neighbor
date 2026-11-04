// Sounds for the shop, sell and Index windows (shops.js, indexWindow.js), built from the
// same physical recipes as sfx.js (synth.js): coins are struck thin metal discs, the
// till drawer is a rolling brown-noise rumble, cloth is slow-attack pink-noise swishes,
// the aura shimmer is a breathy filtered whoosh over a soft low chord. Every recipe
// runs through a lowpass well under the shrill range, so nothing sounds like a beep.
import { A, now, voice } from './core.js'
import { burst, modal, rnd, route, tone, vary } from './synth.js'

const COIN = [[1, 1, 0.26], [1.504, 0.55, 0.19], [2.24, 0.3, 0.11], [2.71, 0.16, 0.07]]
const BELL = [[1, 1, 0.9], [2.0, 0.42, 0.6], [2.42, 0.25, 0.45], [3.0, 0.12, 0.3]] // a small counter bell
const WOOD = [[1, 1, 0.06], [2.57, 0.4, 0.03], [4.2, 0.16, 0.015]]
const BOX = [[1, 1, 0.09], [1.73, 0.5, 0.05], [2.9, 0.2, 0.03]]

const lastAt = new Map()
function limit(name, ms) {
  const t = performance.now()
  if (t - (lastAt.get(name) ?? -1e9) < ms) return false
  lastAt.set(name, t)
  return true
}

// A lowpassed sub-bus: everything played into it is capped at `lp` Hz.
function dark(lp, gain = 1, verb = 0.12, bus) {
  const ctx = A.ctx
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = lp
  f.Q.value = 0.5
  const g = ctx.createGain()
  g.gain.value = gain
  f.connect(g)
  route(g, { bus: bus ?? A.ui ?? A.sfx, verb })
  return f
}

// n coins landing over `dur` s (denser at the start), into a palm / pouch / tray.
function coins(t, n, dur, out, gain = 0.1) {
  for (let i = 0; i < n; i++) {
    const at = t + Math.pow(Math.random(), 1.5) * dur
    modal({ t: at, f: rnd(1300, 2000), modes: COIN, gain: gain * rnd(0.5, 1), bus: out, beat: 6 })
    if (Math.random() < 0.4) modal({ t: at + rnd(0.03, 0.08), f: rnd(1300, 2000), modes: COIN, gain: gain * 0.35, bus: out })
  }
}

// --- Window + browsing ------------------------------------------------------------------------
// A panel sliding open: a short breathy swish and a soft wooden settle.
export function open() {
  if (!limit('open', 150) || !voice(0.4, 2)) return
  const t = now()
  const out = dark(2200, 0.9)
  burst({ t, noise: 'pink', type: 'bandpass', f: 500, f2: 1300, q: 0.7, a: 0.06, d: 0.14, gain: 0.16, bus: out })
  modal({ t: t + 0.1, f: vary(210, 0.05), modes: WOOD, gain: 0.16, bus: out })
}
// Picking a card or tab: a dull fingertip tap on a wooden tile.
export function tap() {
  if (!limit('tap', 40) || !voice(0.12, 2)) return
  const t = now()
  const out = dark(2600, 0.8, 0.05)
  modal({ t, f: vary(330, 0.06), modes: WOOD, gain: 0.2, bus: out })
  burst({ t, noise: 'pink', f: 900, q: 1, d: 0.01, gain: 0.05, bus: out })
}

// --- Buying + wearing -------------------------------------------------------------------------
// Ka-ching: the till drawer rolls out with a thunk, a small counter bell, change jingling down.
export function buy() {
  if (!voice(1.4, 3)) return
  const t = now()
  const out = dark(3600, 1, 0.16)
  burst({ t, noise: 'brown', type: 'bandpass', f: 260, f2: 520, q: 1.1, a: 0.02, d: 0.16, gain: 0.5, bus: out })
  tone({ t: t + 0.15, f: 130, f2: 70, d: 0.09, gain: 0.32, bus: out })
  modal({ t: t + 0.16, f: 200, modes: WOOD, gain: 0.3, bus: out })
  modal({ t: t + 0.05, f: 1180, modes: BELL, gain: 0.07, bus: out, beat: 4 })
  coins(t + 0.22, 6, 0.4, out, 0.09)
}
// Pulling a costume on: two cloth swishes and a soft settling flap.
export function wearCostume() {
  if (!voice(0.9, 2)) return
  const t = now()
  const out = dark(2400, 1, 0.1)
  burst({ t, noise: 'pink', type: 'bandpass', f: 700, f2: 1500, q: 0.8, a: 0.09, d: 0.18, gain: 0.22, bus: out })
  burst({ t: t + 0.22, noise: 'pink', type: 'bandpass', f: 1200, f2: 600, q: 0.8, a: 0.07, d: 0.22, gain: 0.2, bus: out })
  burst({ t: t + 0.45, noise: 'brown', type: 'lowpass', f: 420, q: 0.7, a: 0.01, d: 0.12, gain: 0.35, bus: out })
  tone({ t: t + 0.45, f: 110, f2: 70, d: 0.1, gain: 0.18, bus: out })
}
// An aura wrapping around you: a breathy rising whoosh over a low, warm open chord.
export function wearAura() {
  if (!voice(1.6, 2)) return
  const t = now()
  const out = dark(1900, 1, 0.3)
  burst({ t, noise: 'pink', type: 'bandpass', f: 280, f2: 1400, q: 1.4, a: 0.35, d: 0.6, gain: 0.2, bus: out, sweep: 0.8 })
  burst({ t: t + 0.05, noise: 'brown', type: 'lowpass', f: 300, f2: 700, q: 0.6, a: 0.3, d: 0.5, gain: 0.25, bus: out })
  for (const [f, g] of [[196, 0.09], [294, 0.07], [392, 0.05], [587, 0.025]]) {
    tone({ t: t + 0.15, f: vary(f, 0.004), a: 0.25, hold: 0.25, d: 0.8, gain: g, bus: out })
    tone({ t: t + 0.15, f: f * 1.004, a: 0.3, hold: 0.2, d: 0.7, gain: g * 0.6, bus: out })
  }
}
// Taking something off: the swish in reverse, falling.
export function takeOff() {
  if (!voice(0.5, 2)) return
  const t = now()
  const out = dark(2000, 1, 0.08)
  burst({ t, noise: 'pink', type: 'bandpass', f: 1400, f2: 450, q: 0.8, a: 0.04, d: 0.25, gain: 0.2, bus: out })
  tone({ t: t + 0.2, f: 120, f2: 80, d: 0.08, gain: 0.12, bus: out })
}

// --- Selling + rewards ------------------------------------------------------------------------
// One item sold: a hand slapping it on the counter, a few coins counted into your palm.
export function sell() {
  if (!voice(0.9, 2)) return
  const t = now()
  const out = dark(3400, 1, 0.12)
  modal({ t, f: 180, modes: BOX, gain: 0.35, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: 500, d: 0.06, gain: 0.3, bus: out })
  coins(t + 0.12, 4, 0.3, out, 0.08)
}
// Sell All: everything swept off the counter and a pouch of coins poured out.
export function sellAll(n = 3) {
  if (!voice(1.6, 3)) return
  const t = now()
  const out = dark(3600, 1, 0.16)
  burst({ t, noise: 'pink', type: 'bandpass', f: 600, f2: 300, q: 0.8, a: 0.05, d: 0.25, gain: 0.25, bus: out })
  modal({ t: t + 0.1, f: 160, modes: BOX, gain: 0.3, bus: out })
  coins(t + 0.18, Math.min(18, 6 + n * 2), 0.85, out, 0.07)
  burst({ t: t + 0.25, noise: 'pink', type: 'bandpass', f: 1500, q: 0.6, a: 0.1, d: 0.6, gain: 0.05, bus: out })
}
// An Index reward: a little sack of coins set down, a coin flipped, a warm bell.
export function claim(big = false) {
  if (!voice(1.4, 3)) return
  const t = now()
  const out = dark(3400, 1, 0.22)
  burst({ t, noise: 'brown', type: 'lowpass', f: 380, d: 0.1, gain: 0.4, bus: out })
  tone({ t, f: 95, f2: 60, d: 0.12, gain: 0.25, bus: out })
  coins(t + 0.08, big ? 14 : 7, big ? 0.8 : 0.45, out, 0.08)
  modal({ t: t + 0.12, f: 880, modes: BELL, gain: 0.06, bus: out, beat: 3 })
  if (big) modal({ t: t + 0.42, f: 1175, modes: BELL, gain: 0.05, bus: out, beat: 3 })
}
// Opening the rarity gift: cardboard flaps, tissue paper, then the coin pile.
export function gift() {
  if (!voice(1.8, 3)) return
  const t = now()
  const out = dark(3200, 1, 0.2)
  modal({ t, f: 150, modes: BOX, gain: 0.32, bus: out })
  burst({ t: t + 0.06, noise: 'pink', type: 'bandpass', f: 900, f2: 500, q: 1, a: 0.03, d: 0.18, gain: 0.18, bus: out })
  for (let i = 0; i < 10; i++) burst({ t: t + 0.15 + Math.random() * 0.35, noise: 'pink', f: rnd(1200, 2600), q: rnd(1.5, 3), a: 0.001, d: rnd(0.006, 0.02), gain: rnd(0.03, 0.07), bus: out })
  claim(true)
}
// Can't do that (not enough money, gift still locked): a dull double knock.
export function deny() {
  if (!limit('deny', 200) || !voice(0.3, 2)) return
  const t = now()
  const out = dark(1500, 1, 0.05)
  for (const g of [0, 0.11]) modal({ t: t + g, f: 170, modes: WOOD, gain: 0.35, bus: out })
}
