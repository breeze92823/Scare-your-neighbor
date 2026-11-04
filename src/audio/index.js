// Game audio, the one import the rest of the game uses:
//   import { sfx, at, installAudio, updateAudio } from './audio/index.js'
// installAudio() once at boot (the context starts on the first gesture), then
// updateAudio(dt, st) every frame: the player's footsteps / jumps / landings, the
// listener for at(), and the outdoor wind bed. sfx.<name>(at(x, z)) for one-shots
// in the world, sfx.<name>() for the player's own. Every HUD / window button press
// gets its click here (one capture-phase listener).
import { AUDIO } from '../config.js'
import { A, installAudio as installCore, onStart, setDucked, setMuted, setVolume, isMuted, toggleMuted } from './core.js'
import * as sfx from './sfx.js'

export { sfx, setVolume, setMuted, isMuted, toggleMuted, setDucked }

// --- Listener (the camera) ----------------------------------------------------------------
const ear = { x: 0, z: 0, rx: 1, rz: 0 }
// Pan and level for a sound at world (x, z): panned by the camera's right vector,
// fading to nothing at AUDIO.hearing metres.
export function at(x, z) {
  const dx = x - ear.x
  const dz = z - ear.z
  const d = Math.hypot(dx, dz)
  const pan = d > 0.5 ? Math.max(-0.85, Math.min(0.85, (dx * ear.rx + dz * ear.rz) / d)) : 0
  const k = Math.max(0, 1 - d / AUDIO.hearing)
  return { pan, gain: k * k * 0.9 + (d < 4 ? 0.1 : 0) }
}

// --- Button presses ---------------------------------------------------------------------------
function onPress(e) {
  if (e.button > 0) return
  const b = e.target.closest?.('.hud-btn, .gui-slot, .uiw-close, .uiw-btn, .touch-btn')
  if (!b) return
  sfx.click(Math.max(-0.6, Math.min(0.6, (e.clientX / window.innerWidth - 0.5) * 1.2)))
}

// --- Wind: brown noise, lowpassed and slowly swelling (no hiss) ----------------------------------
function startWind(ctx) {
  const src = ctx.createBufferSource()
  src.buffer = A.noise.brownStereo
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 320
  lp.Q.value = 0.4
  const g = ctx.createGain()
  g.gain.value = AUDIO.wind
  // Two slow, unrelated LFOs: gusts that never quite repeat.
  for (const [rate, depth] of [[0.07, 0.45], [0.19, 0.25]]) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = rate
    const lg = ctx.createGain()
    lg.gain.value = AUDIO.wind * depth
    lfo.connect(lg).connect(g.gain)
    lfo.start()
  }
  const sweep = ctx.createOscillator()
  sweep.frequency.value = 0.05
  const sg = ctx.createGain()
  sg.gain.value = 120
  sweep.connect(sg).connect(lp.frequency)
  sweep.start()
  src.connect(lp).connect(g).connect(A.amb)
  src.start()
}

export function installAudio() {
  installCore()
  onStart(startWind)
  onStart(() => sfx.loadCat()) // decode the cat laugh up front so the first failed scare uses it
  window.addEventListener('pointerdown', onPress, { capture: true, passive: true })
}

// --- Per frame ---------------------------------------------------------------------------------
// st: { camera, player: { x, y, z, vy, grounded, speed, sprint, stunned } }
const prev = { x: 0, z: 0, grounded: true, vy: 0, init: false }
let walked = 0
let started = false
onStart(() => (started = true))
export function updateAudio(dt, st) {
  const e = st.camera.matrixWorld.elements // camera right vector = first column
  const rl = Math.hypot(e[0], e[2]) || 1
  ear.x = st.camera.position.x
  ear.z = st.camera.position.z
  ear.rx = e[0] / rl
  ear.rz = e[2] / rl
  if (!started || A.ctx?.state !== 'running') return

  const p = st.player
  if (prev.init) {
    const moved = Math.hypot(p.x - prev.x, p.z - prev.z)
    if (moved > 8) walked = 0 // teleported / respawned
    else if (p.grounded && p.speed > 0.8 && !p.stunned) {
      walked += moved
      const stride = p.sprint ? AUDIO.stride.sprint : AUDIO.stride.walk
      if (walked >= stride) {
        walked -= stride
        sfx.footstep(p.sprint ? 0.5 : 0)
      }
    } else walked = Math.min(walked, 0.6) // the next step comes soon after starting
    if (prev.grounded && !p.grounded && p.vy > 2) sfx.jump()
    if (!prev.grounded && p.grounded && prev.vy < -4) sfx.land(Math.min(1, -prev.vy / 18))
  }
  prev.x = p.x
  prev.z = p.z
  prev.grounded = p.grounded
  prev.vy = p.vy
  prev.init = true
}
