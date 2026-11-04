// The scare loop at every North Lane house (after the reference screenshots):
//
//   Knock (prompt at the door) -> the door opens and the neighbour answers holding
//   their package: "Yes? Who's there?" while the big SCARE! button shows.
//     no scare in time -> "...nobody? Weird.", door shuts
//     scare, roll fails -> 🤣👉 and "They weren't scared! You had a X% chance ..."
//     scare, roll wins  -> 😰, they drop the package on the step: Steal (prompt)
//   Steal -> "HEY! Come back!" and they chase you (rules.chaseSpeed):
//     past the plaza line (LOBBY.plazaNorth) -> "Grr... next time!", it's yours
//     caught -> "GOT YOU!", you fall over, "Noob caught you! The Package is gone."
//   Either way they walk home and the door shuts.
//
// Your scare chance comes from your scare level vs the house's (rules.scareChance).
// Neighbour models are built the first time their door opens, then reused.
import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3 } from 'three'
import { AUDIO, LOBBY, SCARE } from './config.js'
import { toWorld } from './houses.js'
import { player } from './player.js'
import { chaseSpeed, scareChance } from './rules.js'
import { effectiveScare } from './loadout.js'
import { packageModel } from './carry.js'
import { std } from './propkit.js'
import { at as hear, sfx } from './audio/index.js'

const L = SCARE.lines
const SCALE = 0.86 // model units -> m (the model is ~2.15 units tall)
const WALK = 5.5 // m/s walking home
const cap = (s) => s[0].toUpperCase() + s.slice(1)

// --- Faces ---------------------------------------------------------------------------

const faceCache = new Map()
function faceMat(skin, mood) {
  const key = `${skin}|${mood}`
  if (faceCache.has(key)) return faceCache.get(key)
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = skin
  x.fillRect(0, 0, 128, 128)
  x.fillStyle = x.strokeStyle = '#1b1b1b'
  x.lineWidth = 6
  x.lineCap = 'round'
  const eyes = (h = 18) => {
    x.fillRect(40, 44, 9, h)
    x.fillRect(79, 44, 9, h)
  }
  if (mood === 'happy') {
    eyes()
    x.beginPath()
    x.arc(64, 70, 26, 0.15 * Math.PI, 0.85 * Math.PI)
    x.stroke()
  } else if (mood === 'scared') {
    x.fillStyle = '#fff'
    for (const ex of [44, 84]) {
      x.beginPath()
      x.arc(ex, 52, 13, 0, Math.PI * 2)
      x.fill()
      x.stroke()
    }
    x.fillStyle = '#1b1b1b'
    for (const ex of [44, 84]) x.fillRect(ex - 3, 50, 6, 6)
    x.beginPath()
    x.ellipse(64, 94, 12, 15, 0, 0, Math.PI * 2)
    x.fill()
  } else if (mood === 'angry') {
    eyes(14)
    x.beginPath()
    x.moveTo(32, 32)
    x.lineTo(54, 42)
    x.moveTo(96, 32)
    x.lineTo(74, 42)
    x.stroke()
    x.beginPath()
    x.arc(64, 104, 20, 1.2 * Math.PI, 1.8 * Math.PI)
    x.stroke()
  } else {
    // laugh: ^ ^ eyes and a wide open mouth
    x.beginPath()
    x.moveTo(34, 54)
    x.lineTo(44, 42)
    x.lineTo(54, 54)
    x.moveTo(74, 54)
    x.lineTo(84, 42)
    x.lineTo(94, 54)
    x.stroke()
    x.beginPath()
    x.moveTo(36, 72)
    x.lineTo(92, 72)
    x.arc(64, 72, 28, 0, Math.PI)
    x.fill()
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  const m = new MeshStandardMaterial({ map: tex, roughness: 0.6 })
  faceCache.set(key, m)
  return m
}

// Pyjama stripes (vertical) for the Old Man.
const stripeCache = new Map()
function stripeMat(base, stripe) {
  const key = base + stripe
  if (stripeCache.has(key)) return stripeCache.get(key)
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')
  x.fillStyle = base
  x.fillRect(0, 0, 64, 64)
  x.fillStyle = stripe
  for (let i = 4; i < 64; i += 16) x.fillRect(i, 0, 4, 64)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  const m = new MeshStandardMaterial({ map: tex, roughness: 0.7 })
  stripeCache.set(key, m)
  return m
}

// --- Neighbour model (front = +Z, feet at y = 0) ----------------------------------------

function box(parent, w, h, d, material, x, y, z) {
  const m = new Mesh(new BoxGeometry(w, h, d), material)
  m.position.set(x, y, z)
  m.castShadow = true
  parent.add(m)
  return m
}

function buildNpc(npc, pkgKind) {
  const root = new Group()
  const body = new Group() // leans / shakes
  root.add(body)
  root.scale.setScalar(SCALE)
  const dress = (c) => (npc.stripes ? stripeMat(c, npc.stripes) : std(c))
  const pivot = (x, y) => {
    const p = new Group()
    p.position.set(x, y, 0)
    body.add(p)
    return p
  }
  const legs = [pivot(-0.2, 0.8), pivot(0.2, 0.8)]
  for (const l of legs) box(l, 0.39, 0.8, 0.4, dress(npc.legs), 0, -0.4, 0)
  box(body, 0.8, 0.8, 0.4, dress(npc.shirt), 0, 1.2, 0)
  const arms = [pivot(-0.6, 1.55), pivot(0.6, 1.55)]
  for (const a of arms) box(a, 0.38, 0.8, 0.4, dress(npc.arms), 0, -0.35, 0)
  const neck = pivot(0, 1.6)
  const skin = std(npc.head)
  const faces = { happy: faceMat(npc.head, 'happy') }
  // BoxGeometry material order: +x, -x, +y, -y, +z (face), -z.
  const head = box(neck, 0.56, 0.56, 0.56, [skin, skin, skin, skin, faces.happy, skin], 0, 0.3, 0)
  if (npc.hat === 'fringe') {
    const hair = std(npc.hair)
    for (const s of [-1, 1]) box(neck, 0.08, 0.2, 0.42, hair, s * 0.3, 0.26, -0.04)
    box(neck, 0.6, 0.2, 0.08, hair, 0, 0.26, -0.3)
  } else if (npc.hat === 'cap') {
    box(neck, 0.6, 0.16, 0.6, std(npc.hair), 0, 0.62, -0.02)
  } else if (npc.hat === 'chef') {
    const m = new Mesh(new CylinderGeometry(0.34, 0.28, 0.5, 12), std(npc.hair))
    m.position.set(0, 0.84, 0)
    neck.add(m)
  } else if (npc.hat === 'crown') {
    const gold = std(npc.hair, { metalness: 0.6, roughness: 0.35 })
    box(neck, 0.6, 0.14, 0.6, gold, 0, 0.65, 0)
    for (const [x, z] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) box(neck, 0.12, 0.2, 0.12, gold, x, 0.82, z)
  }
  const held = packageModel(pkgKind)
  held.position.set(0, 0.3, 0.52) // carried low in front, under the face
  held.scale.setScalar(0.85 / SCALE)
  body.add(held)
  return { root, body, legs, arms, neck, head, held, skin, npc, faces, phase: 0 }
}

function setFace(m, mood) {
  const mats = m.head.material
  const f = (m.faces[mood] ||= faceMat(m.npc.head, mood))
  if (mats[4] !== f) mats[4] = f
}

// Pose for one frame. `speed` m/s along the ground.
function animate(m, pose, speed, dt, t) {
  m.phase += dt * Math.min(speed, 12) * 1.9
  const amp = Math.min(1, speed / 4) * (pose === 'chase' ? 1.1 : 0.8)
  const sw = Math.sin(m.phase) * amp
  m.legs[0].rotation.x = sw
  m.legs[1].rotation.x = -sw
  let aL = -sw
  let aR = sw
  let zL = 0
  let zR = 0
  m.body.position.x = 0
  m.body.rotation.x = 0
  m.neck.rotation.set(0, 0, 0)
  if (pose === 'scared') {
    aL = aR = -2.7
    zL = -0.35
    zR = 0.35
    m.body.position.x = Math.sin(t * 60) * 0.04
  } else if (pose === 'laugh') {
    aL = -1.5 // pointing
    aR = -0.4 + Math.sin(t * 18) * 0.15
    m.body.rotation.x = -0.12 + Math.sin(t * 18) * 0.06
    m.neck.rotation.x = -0.25
  } else if (pose === 'gotcha') {
    aL = aR = -2.9
  } else if (pose === 'grr') {
    aL = aR = -0.5
    zL = 0.5
    zR = -0.5
    m.neck.rotation.y = Math.sin(t * 7) * 0.25
  } else if (pose === 'chase') {
    aL = -0.6 - sw * 0.9
    aR = -0.6 + sw * 0.9
  }
  if (m.held.visible && pose !== 'scared') aL = aR = -0.55
  m.arms[0].rotation.set(aL, 0, zL)
  m.arms[1].rotation.set(aR, 0, zR)
}

// --- Door (open state drawn over the baked closed door) ----------------------------------

const doorMats = { dark: std('#1c1e28', { roughness: 0.95 }), wood: null }
function buildOpenDoor(woodColor) {
  doorMats.wood ||= std(woodColor)
  const g = new Group()
  box(g, 1.92, 3.42, 0.06, doorMats.dark, 0, 1.7, 0.37)
  box(g, 0.2, 3.42, 0.5, doorMats.wood, 0.86, 1.7, 0.6)
  return g
}

// --- Houses --------------------------------------------------------------------------------

export function buildNeighbours(scene, homes, { ui, carry, hud, doorWood }) {
  const v = (lx, lz, h) => {
    const [x, z] = toWorld(h.x, h.z, h.yaw, lx, lz)
    return { x, z }
  }
  const list = homes.map((home) => ({
    ...home,
    state: 'home',
    t: 0,
    cooldown: 0,
    door: v(0, 1.2, home), // where you stand to knock
    inside: v(0, 0.55, home), // where the neighbour answers
    step: v(0, 1.8, home), // where a dropped package lies
    m: null, // model, built on first answer
    openDoor: null,
    pkg: null, // package on the step
    pos: new Vector3(),
    facing: home.yaw,
    speed: 0,
    pose: 'idle',
    bubble: null,
    bubbleT: 0,
    bubbleAtDoor: false,
    tag: null,
    emoji: null,
    pkgTag: null,
  }))
  const active = new Set() // houses with something going on
  let elapsed = 0

  function ensure(h) {
    if (h.m) return
    h.m = buildNpc(h.tier.npc, h.tier.pkg.kind)
    h.m.root.visible = false
    scene.add(h.m.root)
    h.openDoor = buildOpenDoor(doorWood)
    h.openDoor.position.set(h.x, 0, h.z)
    h.openDoor.rotation.y = h.yaw
    h.openDoor.visible = false
    scene.add(h.openDoor)
    h.pkg = packageModel(h.tier.pkg.kind)
    h.pkg.position.set(h.step.x, 0.02, h.step.z)
    h.pkg.rotation.y = h.yaw + 0.4
    h.pkg.visible = false
    scene.add(h.pkg)
    h.bubble = ui.anchor('bubble')
    h.tag = ui.anchor('tag', 0.42).set(h.tier.npc.name)
    h.tag.el.style.setProperty('--tc', h.tier.npc.tag)
    h.emoji = ui.anchor('emoji', 0.75)
    h.pkgTag = ui.anchor('pkg', 0.3).set('Package')
  }

  function say(h, text, red = false, seconds = 2.6, atDoor = false) {
    h.bubble.set(text).show()
    h.bubble.el.classList.toggle('red', red)
    h.bubble.el.style.animation = 'none'
    void h.bubble.el.offsetWidth
    h.bubble.el.style.animation = ''
    h.bubbleT = seconds
    h.bubbleAtDoor = atDoor
  }

  function hush(h) {
    h.bubbleT = 0
    h.bubble.show(false)
  }

  function emoji(h, text) {
    if (text) h.emoji.set(text).show()
    else h.emoji.show(false)
  }

  function setState(h, s, t = 0) {
    h.state = s
    h.t = t
  }

  function appear(h) {
    ensure(h)
    h.pos.set(h.inside.x, 0, h.inside.z)
    h.facing = h.yaw
    h.m.root.visible = true
    h.m.held.visible = true
    h.openDoor.visible = true
    h.tag.show()
    setFace(h.m, 'happy')
    sfx.doorOpen(hear(h.door.x, h.door.z))
  }

  function goInside(h) {
    sfx.doorClose(hear(h.door.x, h.door.z))
    h.m.root.visible = false
    h.openDoor.visible = false
    h.pkg.visible = false
    h.tag.show(false)
    h.pkgTag.show(false)
    emoji(h, null)
    setState(h, 'home')
    h.cooldown = SCARE.cooldown
  }

  // --- Actions ---
  function knock(h) {
    ensure(h)
    active.add(h)
    setState(h, 'knocking', SCARE.knockDelay)
    sfx.knock(hear(h.door.x, h.door.z))
  }

  function scare(h) {
    const chance = scareChance(h.tier, effectiveScare()) // scare level x the worn costume
    const s = hear(h.pos.x, h.pos.z)
    sfx.scare()
    if (Math.random() * 100 < chance) {
      sfx.yelp(s)
      setTimeout(() => sfx.packageDrop(hear(h.step.x, h.step.z)), 380)
      setState(h, 'scared', SCARE.scaredTime)
      setFace(h.m, 'scared')
      emoji(h, '😰')
      hush(h)
      h.m.held.visible = false
      h.pkg.visible = true
    } else {
      setState(h, 'laugh', SCARE.laughTime)
      setFace(h.m, 'laugh')
      emoji(h, '🤣👉')
      setTimeout(() => sfx.laugh(s), 300)
      hush(h)
      ui.toast(`They weren't scared! You had a ${chance}% chance - train your scare to improve it.`)
    }
  }

  function steal(h) {
    if (!carry.add(h.tier, h)) {
      ui.toast('Your hands are full! Sell your Packages first.')
      sfx.deny()
      return
    }
    h.pkg.visible = false
    sfx.steal()
    hud.discover(h.tier.name)
    setState(h, 'react', SCARE.reactTime)
    setFace(h.m, 'angry')
    emoji(h, null)
  }

  // --- What you can do right now (nearest wins) ---
  let current = null // { kind, h }
  function pick(p) {
    let best = null
    let bestD = Infinity
    const consider = (kind, h, d, range) => {
      if (d < range && d < bestD) {
        best = { kind, h }
        bestD = d
      }
    }
    for (const h of list) {
      const dDoor = Math.hypot(p.x - h.door.x, p.z - h.door.z)
      if (dDoor > SCARE.scareRange) continue
      if (h.state === 'answer') consider('scare', h, dDoor - 100, SCARE.scareRange) // the scare outranks the rest
      else if (h.state === 'scared') consider('steal', h, Math.hypot(p.x - h.step.x, p.z - h.step.z), SCARE.promptRange)
      else if (h.state === 'home' && h.cooldown <= 0) consider('knock', h, dDoor, SCARE.promptRange)
    }
    return best
  }

  function act(c) {
    if (!c || player.stunned > 0) return
    if (c.kind === 'knock') knock(c.h)
    else if (c.kind === 'scare' && c.h.state === 'answer') scare(c.h)
    else if (c.kind === 'steal' && c.h.state === 'scared') steal(c.h)
  }

  // --- Per-frame ---
  const at = new Vector3()
  function walkTo(h, tx, tz, speed, dt) {
    const dx = tx - h.pos.x
    const dz = tz - h.pos.z
    const d = Math.hypot(dx, dz)
    const stepLen = Math.min(d, speed * dt)
    if (d > 1e-4) {
      h.pos.x += (dx / d) * stepLen
      h.pos.z += (dz / d) * stepLen
      h.facing = Math.atan2(dx, dz)
    }
    h.speed = dt > 0 ? stepLen / dt : 0
    h.walked = (h.walked ?? 0) + stepLen
    if (h.walked >= AUDIO.npcStride) {
      h.walked = 0
      sfx.npcStep(hear(h.pos.x, h.pos.z), h.state === 'chase')
    }
    return d - stepLen
  }

  function tick(h, dt, p) {
    h.t -= dt
    h.speed = 0
    switch (h.state) {
      case 'home':
        if (h.cooldown > 0) h.cooldown -= dt
        break
      case 'knocking':
        if (h.t <= 0) {
          appear(h)
          say(h, L.answer, false, SCARE.answerTime)
          setState(h, 'answer', SCARE.answerTime)
        }
        break
      case 'answer':
        h.pose = 'idle'
        if (h.t <= 0) {
          sfx.hmm(hear(h.door.x, h.door.z))
          goInside(h)
          say(h, L.nobody, false, 2.4, true)
        }
        break
      case 'laugh':
        h.pose = 'laugh'
        walkTo(h, h.door.x, h.door.z, 2, dt)
        h.facing = Math.atan2(p.x - h.pos.x, p.z - h.pos.z)
        if (h.t <= 0) {
          emoji(h, null)
          setFace(h.m, 'happy')
          setState(h, 'return')
        }
        break
      case 'scared':
        h.pose = 'scared'
        if (h.t <= 0) {
          // Nobody took it: they pick it up again.
          h.pkg.visible = false
          h.m.held.visible = true
          emoji(h, null)
          setFace(h.m, 'angry')
          say(h, L.recover)
          sfx.grumble(hear(h.pos.x, h.pos.z))
          setState(h, 'return')
        }
        break
      case 'react':
        h.pose = 'idle'
        h.facing = Math.atan2(p.x - h.pos.x, p.z - h.pos.z)
        if (h.t <= 0) {
          say(h, L.chase, true, 3)
          sfx.shout(hear(h.pos.x, h.pos.z))
          setState(h, 'chase')
        }
        break
      case 'chase': {
        h.pose = 'chase'
        if (p.z > LOBBY.plazaNorth) {
          // Past the line into the plaza: they give up and you keep it.
          carry.keepFrom(h)
          say(h, L.giveUp, false, 2.6)
          sfx.grumble(hear(h.pos.x, h.pos.z))
          setState(h, 'grr', 1.8)
          break
        }
        const left = walkTo(h, p.x, p.z, chaseSpeed(h.tier), dt)
        if (left < SCARE.catchRadius && player.stunned <= 0) {
          player.stunned = SCARE.stunTime
          carry.loseFrom(h)
          h.m.held.visible = true
          say(h, L.caught, true, 2.2)
          sfx.caught(hear(h.pos.x, h.pos.z))
          ui.toast(`${h.tier.npc.name} caught you! The Package is gone.`)
          setState(h, 'gotcha', 1.6)
        }
        break
      }
      case 'grr':
      case 'gotcha':
        h.pose = h.state
        if (h.t <= 0) {
          setFace(h.m, 'happy')
          setState(h, 'return')
        }
        break
      case 'return':
        h.pose = 'walk'
        if (walkTo(h, h.inside.x, h.inside.z, WALK, dt) < 0.05) goInside(h)
        break
    }

    if (h.m?.root.visible) {
      h.m.root.position.copy(h.pos)
      h.m.root.rotation.y = h.facing
      animate(h.m, h.pose, h.speed, dt, elapsed)
      const top = 2.25 * SCALE
      h.tag.pos.set(h.pos.x, top + 0.05, h.pos.z)
      h.emoji.pos.set(h.pos.x, top + 0.75, h.pos.z)
      if (h.m.held.visible) {
        h.m.held.getWorldPosition(at)
        h.pkgTag.pos.set(at.x, at.y + 0.72, at.z)
        h.pkgTag.show()
      } else if (h.pkg.visible) {
        h.pkgTag.pos.set(h.step.x, 1.05, h.step.z)
        h.pkgTag.show()
      } else h.pkgTag.show(false)
    }
    if (h.bubble) {
      if (h.bubbleT > 0) {
        h.bubbleT -= dt
        if (h.bubbleAtDoor) {
          const [x, z] = toWorld(h.x, h.z, h.yaw, 0, 0.6)
          h.bubble.pos.set(x, 3.9, z)
        } else h.bubble.pos.set(h.pos.x, 2.25 * SCALE + (h.emoji.shown ? 1.5 : 0.75), h.pos.z)
        if (h.bubbleT <= 0) h.bubble.show(false)
      }
    }
    if (h.state === 'home' && h.cooldown <= 0 && h.bubbleT <= 0) active.delete(h)
  }

  const promptAt = new Vector3()
  return {
    homes: list, // every house's live state (debugging)
    // E (or the prompt / SCARE! button): do the current action.
    interact() {
      act(current)
    },
    update(dt, p) {
      elapsed += dt
      for (const h of active) tick(h, dt, p)

      current = player.stunned > 0 ? null : pick(p)
      ui.setScare(current?.kind === 'scare' ? () => act(current) : null)
      if (!current) {
        ui.setPrompt(null)
        return
      }
      const { kind, h } = current
      if (kind === 'knock') {
        const [x, z] = toWorld(h.x, h.z, h.yaw, 0, 0.7)
        promptAt.set(x, 2.3, z)
        ui.setPrompt({ object: `${cap(h.tier.name)} House`, action: 'Knock', at: promptAt, fn: () => act(current) })
      } else if (kind === 'scare') {
        promptAt.set(h.pos.x, 1.2, h.pos.z)
        ui.setPrompt({ object: h.tier.npc.name, action: 'SCARE!', at: promptAt, fn: () => act(current) })
      } else {
        promptAt.set(h.step.x, 0.45, h.step.z)
        ui.setPrompt({ object: 'Package', action: 'Steal', at: promptAt, fn: () => act(current) })
      }
    },
  }
}
