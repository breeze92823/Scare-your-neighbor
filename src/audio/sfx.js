// Every one-shot in the game, built from physical recipes (synth.js) and kept in the
// low and mid range: thuds, wood, cardboard, cloth, voices through vowel formants, a
// stick-slip door creak. Nothing beeps, and every recipe is lowpassed well under
// the shrill range. Every export returns quietly when audio isn't running or the
// voice budget is spent.
//
// World sounds take a spatial `s` = { pan, gain } from index.js `at(x, z)`, so a
// neighbour across the lane sounds over there and fades with distance.
import { A, now, ready, voice } from './core.js'
import { burst, modal, rnd, route, tone, vary } from './synth.js'

// Struck-object mode tables [ratio, amplitude, decay s] (see synth.modal).
const DOOR = [[1, 1, 0.16], [1.58, 0.55, 0.09], [2.37, 0.3, 0.05], [3.6, 0.12, 0.025]] // a hollow wooden door
const BOARD = [[1, 1, 0.07], [2.57, 0.45, 0.035], [4.2, 0.2, 0.016]] // wood block, short
const PLASTIC = [[1, 1, 0.03], [2.31, 0.45, 0.018], [3.93, 0.2, 0.01]] // a lego stud
const BOX = [[1, 1, 0.09], [1.73, 0.5, 0.05], [2.9, 0.2, 0.03]] // a cardboard box body
const COIN = [[1, 1, 0.28], [1.504, 0.55, 0.2], [2.24, 0.3, 0.12], [2.71, 0.18, 0.08]]

const S0 = { pan: 0, gain: 1 } // non-spatial (the player)
const sp = (s) => s ?? S0

// --- Bookkeeping -----------------------------------------------------------------------------
const lastAt = new Map()
function limit(name, ms) {
  const t = performance.now()
  if (t - (lastAt.get(name) ?? -1e9) < ms) return false
  lastAt.set(name, t)
  return true
}

// A lowpassed sub-bus for one sound: everything inside is capped at `lp` Hz.
function dark(lp, s, verb = 0.12) {
  const ctx = A.ctx
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = lp
  f.Q.value = 0.5
  const g = ctx.createGain()
  g.gain.value = s.gain
  f.connect(g)
  route(g, { pan: s.pan, verb })
  return f
}

// --- Voice: a buzz through three vowel formants (a person, not a synth) ------------------------
const VOWELS = {
  a: [[800, 1], [1150, 0.5], [2600, 0.12]],
  e: [[480, 1], [1750, 0.4], [2500, 0.1]],
  o: [[480, 1], [820, 0.6], [2450, 0.08]],
  u: [[330, 1], [720, 0.35], [2300, 0.05]],
  r: [[560, 1], [1250, 0.45], [1650, 0.2]],
}
// { t, f, f2, glide, vowel, a, d, hold, gain, breath, rough (Hz flutter), s, lp }
function syllable(o) {
  const ctx = A.ctx
  const t = o.t
  const dur = (o.a ?? 0.02) + (o.hold ?? 0) + (o.d ?? 0.15)
  const out = dark(o.lp ?? 2600, sp(o.s), o.verb ?? 0.15)
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(o.f, t)
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide ?? dur))
  // Jitter: a slow random wobble on the pitch, like a real throat.
  const wob = ctx.createOscillator()
  wob.frequency.value = rnd(4.5, 6.5)
  const wg = ctx.createGain()
  wg.gain.value = o.f * 0.012
  wob.connect(wg).connect(osc.frequency)
  const sum = ctx.createGain()
  for (const [f, amp] of VOWELS[o.vowel ?? 'a']) {
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = vary(f, 0.04)
    bp.Q.value = f < 1000 ? 6 : 9
    const g = ctx.createGain()
    g.gain.value = amp
    osc.connect(bp).connect(g).connect(sum)
  }
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(o.gain ?? 0.5, t + (o.a ?? 0.02))
  if (o.hold) env.gain.setValueAtTime(o.gain ?? 0.5, t + (o.a ?? 0.02) + o.hold)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  if (o.rough) {
    // Growl: amplitude flutter (a rattling throat).
    const fl = ctx.createOscillator()
    fl.frequency.value = o.rough
    const fg = ctx.createGain()
    fg.gain.value = 0.45
    const base = ctx.createGain()
    base.gain.value = 0.55
    fl.connect(fg).connect(base.gain)
    sum.connect(base).connect(env)
    fl.start(t)
    fl.stop(t + dur + 0.05)
  } else sum.connect(env)
  env.connect(out)
  osc.start(t)
  wob.start(t)
  osc.stop(t + dur + 0.05)
  wob.stop(t + dur + 0.05)
  if (o.breath) burst({ t, noise: 'pink', type: 'bandpass', f: 1300, q: 0.7, a: 0.01, d: dur, gain: o.breath, bus: out })
  return t + dur
}

// --- UI ------------------------------------------------------------------------------------------
// A soft plastic press with a felt thump under it.
export function click(pan = 0) {
  if (!limit('click', 30) || !voice(0.1, 2)) return
  const t = now()
  const out = dark(3200, { pan, gain: 1 }, 0)
  modal({ t, f: vary(620, 0.06), modes: PLASTIC, gain: 0.22, bus: out })
  tone({ t, f: vary(150, 0.05), f2: 80, d: 0.05, gain: 0.3, bus: out })
  burst({ t, noise: 'pink', f: 1400, q: 1, d: 0.012, gain: 0.12, bus: out })
}

// --- Player ----------------------------------------------------------------------------------------
// Sneaker on lego studs: a heel thud, the sole's rubbery scuff and a dull stud tap.
export function footstep(heavy = 0) {
  if (!voice(0.12, 1.5)) return
  const t = now()
  const out = dark(2600, { pan: rnd(-0.08, 0.08), gain: 0.55 + heavy * 0.3 }, 0.05)
  tone({ t, f: vary(95, 0.1), f2: 55, d: 0.06, gain: 0.5, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: vary(700, 0.2), q: 0.7, a: 0.003, d: vary(0.05, 0.2), gain: 0.55, bus: out })
  burst({ t: t + 0.012, noise: 'pink', f: vary(1200, 0.25), q: 1.4, a: 0.004, d: 0.035, gain: 0.12, bus: out })
  modal({ t: t + 0.004, f: vary(420, 0.08), modes: PLASTIC, gain: 0.08, bus: out })
}

// Push-off: a cloth swish and a little effort breath.
export function jump() {
  if (!limit('jump', 120) || !voice(0.3)) return
  const t = now()
  const out = dark(2200, S0, 0.08)
  burst({ t, noise: 'pink', f: 500, f2: 1100, q: 0.8, a: 0.03, d: 0.16, gain: 0.25, bus: out })
  footstep(0.4)
}

// Landing, k = 0..1 from fall speed.
export function land(k = 0.5) {
  if (!limit('land', 120) || !voice(0.3)) return
  const t = now()
  const out = dark(1600, { pan: 0, gain: 0.6 + k * 0.6 }, 0.1)
  tone({ t, f: 85, f2: 42, d: 0.14, gain: 0.6, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: 500, q: 0.7, a: 0.002, d: 0.12, gain: 0.7, bus: out })
  burst({ t: t + 0.02, noise: 'pink', f: 900, q: 1, a: 0.01, d: 0.08, gain: 0.12, bus: out })
}

// --- Doors -------------------------------------------------------------------------------------------
// Three knuckle raps on a hollow wooden door.
export function knock(s) {
  if (!voice(0.8)) return
  const t = now()
  const out = dark(2400, sp(s), 0.25)
  const gaps = [0, vary(0.2, 0.08), vary(0.39, 0.06)]
  gaps.forEach((g, i) => {
    const at = t + g
    const hit = i === 2 ? 1.1 : vary(1, 0.08)
    modal({ t: at, f: vary(185, 0.05), modes: DOOR, gain: 0.38 * hit, bus: out })
    tone({ t: at, f: vary(110, 0.06), f2: 70, d: 0.07, gain: 0.35 * hit, bus: out })
    burst({ t: at, noise: 'pink', f: 1500, q: 1.2, a: 0.001, d: 0.012, gain: 0.2 * hit, bus: out })
  })
}

// Hinge creak: stick-slip friction, a train of tiny slips whose rate wanders,
// ringing the door's body (resonant bandpass), then the latch.
export function doorOpen(s) {
  if (!voice(1.2)) return
  const t = now()
  const out = dark(2000, sp(s), 0.2)
  modal({ t, f: vary(520, 0.05), modes: BOARD, gain: 0.25, bus: out }) // latch
  const body = A.ctx.createBiquadFilter()
  body.type = 'bandpass'
  body.frequency.value = vary(640, 0.1)
  body.Q.value = 7
  const g = A.ctx.createGain()
  g.gain.value = 1
  body.connect(g).connect(out)
  const len = vary(0.7, 0.15)
  let at = t + 0.08
  let rate = rnd(28, 40)
  while (at < t + 0.08 + len) {
    burst({ t: at, noise: 'white', type: 'highpass', f: 200, q: 0.5, a: 0.0005, d: 0.006, gain: 0.5 * rnd(0.5, 1), bus: body })
    rate = Math.max(14, Math.min(70, rate + rnd(-7, 7)))
    at += 1 / rate
  }
}

// Door swung shut: a dull slam, its panel ringing for a moment, the latch catching.
export function doorClose(s) {
  if (!voice(0.6)) return
  const t = now()
  const out = dark(1800, sp(s), 0.3)
  tone({ t, f: 78, f2: 45, d: 0.2, gain: 0.55, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: 420, q: 0.7, a: 0.002, d: 0.16, gain: 0.7, bus: out })
  modal({ t, f: vary(140, 0.05), modes: DOOR, gain: 0.45, bus: out })
  modal({ t: t + 0.05, f: vary(560, 0.05), modes: BOARD, gain: 0.2, bus: out })
}

// --- Voices ------------------------------------------------------------------------------------------
// Your scare: a big throaty "RAAH!" with a rush of air.
export function scare() {
  if (!voice(0.9, 2)) return
  const t = now()
  syllable({ t, f: 128, f2: 92, vowel: 'a', a: 0.03, hold: 0.22, d: 0.3, gain: 0.55, rough: 32, breath: 0.12, s: S0, lp: 2200, verb: 0.25 })
  burst({ t, noise: 'pink', f: 380, f2: 900, q: 0.7, a: 0.04, d: 0.4, gain: 0.25, bus: dark(1600, S0, 0.2) })
}

// A neighbour jumps out of their skin: a sharp intake, a yelp gliding up.
export function yelp(s) {
  if (!voice(0.7)) return
  const t = now()
  burst({ t, noise: 'pink', f: 1100, q: 1, a: 0.04, d: 0.12, gain: 0.14, bus: dark(2400, sp(s), 0.1) })
  syllable({ t: t + 0.1, f: 260, f2: 420, glide: 0.18, vowel: 'a', a: 0.015, hold: 0.12, d: 0.25, gain: 0.42, breath: 0.08, s, lp: 2600 })
}

// --- Cat laugh sample: fetched + decoded once (on first use), then reused ----------------------
// Its gain is normalised from the measured RMS so it sits at the level of the synth
// voices whatever the file's mastering; clipped to 2.2 s so a long tail can't linger.
const CAT_URL = `${import.meta.env.BASE_URL}audio/cat-laugh.mp3`
const CAT_TARGET_RMS = 0.09 // roughly the loudness of the synth laugh
const CAT_MAX_SECONDS = 2.2
let cat = null // { buf, gain }
let catLoading = false
export function loadCat() {
  if (cat || catLoading || !A.ctx) return
  catLoading = true
  fetch(CAT_URL)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
    .then((data) => A.ctx.decodeAudioData(data))
    .then((buf) => {
      const d = buf.getChannelData(0)
      const n = Math.min(d.length, Math.floor(buf.sampleRate * CAT_MAX_SECONDS))
      let sum = 0
      for (let i = 0; i < n; i++) sum += d[i] * d[i]
      const rms = Math.sqrt(sum / Math.max(1, n)) || 1
      cat = { buf, gain: Math.max(0.2, Math.min(4, CAT_TARGET_RMS / rms)) }
    })
    .catch(() => {
      catLoading = false // try again next time; the synth laugh covers meanwhile
    })
}

function catLaugh(s) {
  const ctx = A.ctx
  const src = ctx.createBufferSource()
  src.buffer = cat.buf
  src.playbackRate.value = rnd(0.95, 1.08) // never exactly the same twice
  const g = ctx.createGain()
  const t = now()
  const sg = sp(s).gain
  g.gain.setValueAtTime(cat.gain * sg, t)
  g.gain.setValueAtTime(cat.gain * sg, t + CAT_MAX_SECONDS - 0.25)
  g.gain.linearRampToValueAtTime(0, t + CAT_MAX_SECONDS)
  src.connect(g)
  route(g, { pan: sp(s).pan, verb: 0.1 })
  src.start(t)
  src.stop(t + CAT_MAX_SECONDS)
}

// The cat laugh sample always plays; the synth "Ha-ha-ha-ha!" (voiced bursts falling in
// pitch) is only the fallback until the sample has loaded, or if it fails to load.
export function laugh(s) {
  if (!voice(2.2)) return
  loadCat()
  if (cat) return catLaugh(s)
  const t = now()
  const base = rnd(170, 200)
  for (let i = 0; i < 5; i++) {
    const at = t + i * vary(0.17, 0.06)
    const f = base * (1 - i * 0.035)
    syllable({ t: at, f: f * 1.08, f2: f * 0.92, vowel: 'a', a: 0.012, hold: 0.04, d: 0.09, gain: 0.38, breath: 0.16, s, lp: 2400, verb: 0.2 })
  }
}

// "HEY!" then running.
export function shout(s) {
  if (!voice(0.6)) return
  const t = now()
  syllable({ t, f: 230, f2: 185, vowel: 'e', a: 0.015, hold: 0.16, d: 0.2, gain: 0.5, breath: 0.1, s, lp: 2500, verb: 0.25 })
}

// "Grrr...": a low, rattling growl.
export function grumble(s) {
  if (!voice(1.0)) return
  const t = now()
  syllable({ t, f: 104, f2: 88, vowel: 'r', a: 0.06, hold: 0.45, d: 0.35, gain: 0.45, rough: 23, breath: 0.05, s, lp: 1400 })
}

// "...hm?" (nobody there): a short, puzzled hum rising.
export function hmm(s) {
  if (!voice(0.6)) return
  syllable({ t: now(), f: 150, f2: 190, vowel: 'u', a: 0.04, hold: 0.12, d: 0.2, gain: 0.32, s, lp: 1500 })
}

// Caught: "Got you!" is in the bubble; you hear the grab, your fall and a winded "oof".
export function caught(s) {
  if (!voice(1.0, 2)) return
  const t = now()
  const out = dark(1500, S0, 0.2)
  burst({ t, noise: 'pink', f: 700, q: 0.9, a: 0.01, d: 0.12, gain: 0.3, bus: out }) // cloth grab
  syllable({ t: t + 0.05, f: 160, f2: 110, vowel: 'u', a: 0.01, hold: 0.04, d: 0.12, gain: 0.35, breath: 0.12, s: S0, lp: 1300 })
  tone({ t: t + 0.32, f: 70, f2: 36, d: 0.28, gain: 0.8, bus: out }) // body hits the ground
  burst({ t: t + 0.32, noise: 'brown', type: 'lowpass', f: 380, q: 0.7, a: 0.002, d: 0.25, gain: 0.9, bus: out })
  burst({ t: t + 0.36, noise: 'pink', f: 1000, q: 1, a: 0.01, d: 0.18, gain: 0.12, bus: out })
  shout(s)
}

// A neighbour's footstep (heavier shoes on the studs).
export function npcStep(s, run = false) {
  if (!voice(0.12)) return
  const t = now()
  const out = dark(1800, { pan: sp(s).pan, gain: sp(s).gain * (run ? 0.7 : 0.45) }, 0.08)
  tone({ t, f: vary(80, 0.1), f2: 48, d: 0.07, gain: 0.5, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: vary(600, 0.2), q: 0.7, a: 0.003, d: 0.06, gain: 0.55, bus: out })
  modal({ t: t + 0.004, f: vary(360, 0.08), modes: PLASTIC, gain: 0.07, bus: out })
}

// --- Packages ---------------------------------------------------------------------------------------
// A package set down / dropped: cardboard body thump and a papery slap.
export function packageDrop(s) {
  if (!voice(0.4)) return
  const t = now()
  const out = dark(2200, sp(s), 0.12)
  modal({ t, f: vary(150, 0.06), modes: BOX, gain: 0.5, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: 650, q: 0.7, a: 0.002, d: 0.09, gain: 0.55, bus: out })
  burst({ t: t + 0.005, noise: 'pink', f: 1300, q: 1.1, a: 0.002, d: 0.05, gain: 0.18, bus: out })
}

// A punch on a package in your base: a knuckle slap on cardboard, a short dull body thud.
export function packageHit(s) {
  if (!voice(0.25, 4) || !limit('packageHit', 60)) return
  const t = now()
  const out = dark(2000, sp(s), 0.08)
  burst({ t, noise: 'pink', f: vary(1100, 0.15), q: 1.2, a: 0.001, d: 0.025, gain: 0.22, bus: out })
  modal({ t: t + 0.004, f: vary(190, 0.08), modes: BOX, gain: 0.32, bus: out })
  tone({ t, f: vary(95, 0.08), f2: 60, d: 0.06, gain: 0.3, bus: out })
}

// Breaking one open: the cardboard gives (a torn scrape), flaps slap open, a bright coin.
export function packageOpen(s) {
  if (!voice(0.8, 2)) return
  const t = now()
  const out = dark(3200, sp(s), 0.15)
  burst({ t, noise: 'pink', f: 1400, f2: 700, q: 1.1, a: 0.005, d: 0.18, gain: 0.32, bus: out })
  modal({ t: t + 0.05, f: vary(160, 0.05), modes: BOX, gain: 0.45, bus: out })
  modal({ t: t + 0.12, f: vary(210, 0.05), modes: BOX, gain: 0.3, bus: out })
  modal({ t: t + 0.22, f: 1180, modes: COIN, gain: 0.14, bus: out })
}

// One scare from the base booth: an airy swell and a low ghostly "oooh" (quiet: it
// repeats every second or so while you stand in it).
export function boothScare() {
  if (!voice(0.8, 2) || !limit('boothScare', 400)) return
  const t = now()
  burst({ t, noise: 'pink', type: 'bandpass', f: 320, f2: 760, q: 0.8, a: 0.12, d: 0.35, gain: 0.12, bus: dark(1500, S0, 0.3) })
  syllable({ t: t + 0.04, f: 196, f2: 165, vowel: 'u', a: 0.12, hold: 0.18, d: 0.3, gain: 0.16, breath: 0.2, s: S0, lp: 1300, verb: 0.35 })
}

// The base treadmill's motor as a loop: a low two-saw hum and the belt's rumble with a
// soft slat clack, all under a lowpass that opens with the speed. motor.set(k, s) every
// frame: k = 0..1 (belt speed / walk pace), s = at(x, z) of the treadmill. Built on the
// first set() with k > 0 once audio runs; at k = 0 it fades to silence.
export function createMotor() {
  let n = null
  function build() {
    const ctx = A.ctx
    const out = ctx.createGain()
    out.gain.value = 0
    const pan = ctx.createStereoPanner()
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 300
    lp.Q.value = 0.6
    const o1 = ctx.createOscillator()
    o1.type = 'sawtooth'
    o1.frequency.value = 40
    const o2 = ctx.createOscillator()
    o2.type = 'sawtooth'
    o2.frequency.value = 80.6
    const hum = ctx.createGain()
    hum.gain.value = 0.1
    o1.connect(hum)
    o2.connect(hum)
    hum.connect(lp)
    const noise = ctx.createBufferSource()
    noise.buffer = A.noise.brownStereo
    noise.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 220
    bp.Q.value = 0.9
    const rumble = ctx.createGain()
    rumble.gain.value = 0.55
    const lfo = ctx.createOscillator() // the slats passing the rollers
    lfo.type = 'triangle'
    lfo.frequency.value = 4
    const depth = ctx.createGain()
    depth.gain.value = 0.3
    lfo.connect(depth).connect(rumble.gain)
    noise.connect(bp).connect(rumble).connect(lp)
    lp.connect(out).connect(pan).connect(A.sfx)
    for (const src of [o1, o2, noise, lfo]) src.start()
    n = { out, pan, lp, o1, o2, lfo }
  }
  return {
    set(k, s) {
      if (!ready()) return
      if (!n) {
        if (k <= 0.01) return
        build()
      }
      const t = A.ctx.currentTime
      n.out.gain.setTargetAtTime(k * 0.45 * (s?.gain ?? 1), t, 0.15)
      n.pan.pan.setTargetAtTime(s?.pan ?? 0, t, 0.1)
      n.o1.frequency.setTargetAtTime(30 + 16 * k, t, 0.25)
      n.o2.frequency.setTargetAtTime(60.6 + 32 * k, t, 0.25)
      n.lfo.frequency.setTargetAtTime(1 + 6 * k, t, 0.25)
      n.lp.frequency.setTargetAtTime(220 + 300 * k, t, 0.25)
    },
  }
}

// A treadmill gain (+1 speed): a soft thump and a warm two-note bell.
export function treadmillGain() {
  if (!voice(0.6, 2)) return
  const t = now()
  const out = dark(2600, S0, 0.15)
  tone({ t, f: 140, f2: 90, d: 0.08, gain: 0.25, bus: out })
  modal({ t: t + 0.02, f: 659, modes: COIN, gain: 0.07, bus: out })
  modal({ t: t + 0.11, f: 988, modes: COIN, gain: 0.07, bus: out })
}

// An upgrade bought on one of the base's signs: a solid clunk, then a rising pair of bells.
export function upgrade() {
  if (!voice(1.2, 3)) return
  const t = now()
  const out = dark(3000, S0, 0.2)
  tone({ t, f: 110, f2: 70, d: 0.12, gain: 0.4, bus: out })
  burst({ t, noise: 'brown', type: 'lowpass', f: 600, q: 0.7, a: 0.002, d: 0.08, gain: 0.45, bus: out })
  for (const [i, f] of [392, 523, 659, 784].entries()) modal({ t: t + 0.1 + i * 0.08, f, modes: COIN, gain: 0.1, bus: out })
}

// The item coming out of an opened package; grows with `level` (BASE_FLOOR.fx):
// 0 = two soft bells, 1 = a rising bell arpeggio over a shimmer, 2 = + a warm held chord
// and an airy whoosh, 3 = + a sub boom and a longer, lower chord. All lowpassed.
export function reveal(level = 0, s) {
  if (!voice(1 + level * 0.8, 3)) return
  const t = now() + 0.12
  const out = dark(2600 + level * 500, sp(s), 0.2 + level * 0.08)
  const notes = level === 0 ? [523, 784] : [523, 659, 784, 1047]
  notes.forEach((f, i) => modal({ t: t + i * (level ? 0.09 : 0.12), f, modes: COIN, gain: 0.09 + level * 0.015, bus: out }))
  if (level >= 1) {
    burst({ t, noise: 'pink', type: 'bandpass', f: 1800, f2: 2600, q: 0.8, a: 0.15, d: 0.5, gain: 0.06 + level * 0.02, bus: out })
  }
  if (level >= 2) {
    for (const f of [262, 330, 392]) tone({ t: t + 0.32, f, a: 0.12, hold: 0.5 + level * 0.25, d: 0.9, gain: 0.05, type: 'triangle', bus: out })
    burst({ t: t - 0.1, noise: 'pink', type: 'bandpass', f: 400, f2: 1400, q: 0.7, a: 0.3, d: 0.5, gain: 0.16, bus: out })
  }
  if (level >= 3) {
    tone({ t: t - 0.05, f: 70, f2: 32, a: 0.01, d: 1.4, gain: 0.55, bus: out })
    burst({ t: t - 0.05, noise: 'brown', type: 'lowpass', f: 260, q: 0.7, a: 0.01, d: 0.9, gain: 0.5, bus: out })
    for (const f of [131, 196, 247]) tone({ t: t + 0.6, f, a: 0.25, hold: 1.2, d: 1.4, gain: 0.05, type: 'triangle', bus: out })
  }
}

// Snatching it up: a cardboard scrape and the box hugged to your chest.
export function steal() {
  if (!voice(0.5, 2)) return
  const t = now()
  const out = dark(2400, S0, 0.08)
  burst({ t, noise: 'pink', f: 900, f2: 600, q: 1.3, a: 0.02, d: 0.14, gain: 0.3, bus: out })
  modal({ t: t + 0.13, f: vary(170, 0.05), modes: BOX, gain: 0.45, bus: out })
  burst({ t: t + 0.13, noise: 'brown', type: 'lowpass', f: 500, q: 0.7, a: 0.003, d: 0.07, gain: 0.4, bus: out })
}

// Selling: a till drawer sliding out, a handful of coins settling, notes rustling.
export function sell(n = 1) {
  if (!voice(1.4, 2)) return
  const t = now()
  const out = dark(4200, S0, 0.15)
  burst({ t, noise: 'brown', type: 'bandpass', f: 380, f2: 700, q: 1.2, a: 0.03, d: 0.18, gain: 0.5, bus: out })
  modal({ t: t + 0.2, f: 240, modes: BOARD, gain: 0.35, bus: out })
  const coins = Math.min(9, 3 + n * 2)
  for (let i = 0; i < coins; i++) {
    const at = t + 0.25 + Math.pow(Math.random(), 1.6) * 0.45
    modal({ t: at, f: rnd(1500, 2300), modes: COIN, gain: rnd(0.05, 0.12), bus: out })
  }
  burst({ t: t + 0.3, noise: 'pink', f: 1600, q: 0.8, a: 0.04, d: 0.25, gain: 0.08, bus: out })
}

// Hands full / not allowed: a dull double knock on wood.
export function deny() {
  if (!limit('deny', 200) || !voice(0.3)) return
  const t = now()
  const out = dark(1500, S0, 0.05)
  for (const g of [0, 0.11]) modal({ t: t + g, f: 170, modes: BOARD, gain: 0.35, bus: out })
}
