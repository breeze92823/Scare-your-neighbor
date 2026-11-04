import { BoxGeometry, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three'
import { BASES, FONT_FAMILY } from './config.js'
import { bake } from './bake.js'
import { fontReady, label, neon, put, solidBox, std, studPut } from './propkit.js'
import { paintChevrons, paintText, roundRect } from './textures.js'

// Player bases: fenced plots of brown studded floor around the south half of
// the plaza. Each is open on the side facing the plaza, has a white picket
// fence on the other three sides and a little red-roofed "Minions" hut in its
// back-left corner. The local player's base also gets its machines on the grass
// out front (BASES.layout), after the reference screenshots: the +10/SCARE booth
// and the +2/STEP treadmill facing the plot, each with an Upgrade sign beside it
// (Level 1 > Level 2, $ button, a bobbing red "!"), the Upgrade Base sign
// at the front corner facing out, and the offline-money pile inside. What moves on
// your plot (packages, minions, items, the "2/7" and "1/s" labels) is baseFloor.js.

const C = BASES.colors
const W = BASES.width
const D = BASES.depth
const YELLOW = '#f2c624'
const DARK = '#2b2f42'
const RED = '#e0303a'

// Local -> world for a plot at (gx, gz) facing yaw.
function toWorld(gx, gz, yaw, lx, lz) {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [gx + lx * c + lz * s, gz - lx * s + lz * c]
}

const picketGeo = new BoxGeometry(0.34, 1.5, 0.12)
const tipGeo = new BoxGeometry(0.24, 0.24, 0.12)
const fenceMat = std(C.fence, { roughness: 0.5 })

// Picket fence from (x0, z0) to (x1, z1) in plot space, pickets 0.5 m apart.
function fence(g, x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const yaw = Math.atan2(-(z1 - z0), x1 - x0) // segment +X runs from the first point to the second
  const seg = new Group()
  seg.position.set(x0, 0, z0)
  seg.rotation.y = yaw
  for (let t = 0.25; t < len; t += 0.5) {
    put(seg, picketGeo, fenceMat, t, 0.75, 0)
    put(seg, tipGeo, fenceMat, t, 1.5, 0).rotation.z = Math.PI / 4
  }
  for (const y of [0.45, 1.1]) put(seg, new BoxGeometry(len, 0.14, 0.08), fenceMat, len / 2, y, -0.1)
  g.add(seg)
}

let minionsMat = null
function minionsPlate() {
  if (!minionsMat) {
    const t = paintText('Minions', { color: '#ffffff', outline: null, bg: C.sign, font: `700 64px ${FONT_FAMILY}, sans-serif`, pad: 14 })
    const tex = new CanvasTexture(t.canvas)
    tex.colorSpace = SRGBColorSpace
    fontReady.then(() => {
      t.draw()
      tex.dispose()
      tex.needsUpdate = true
    })
    minionsMat = new MeshBasicMaterial({ map: tex })
  }
  return minionsMat
}

// The Minions hut (front faces +Z): brown walls, dark doorway, stepped red roof.
function hut(g, x, z) {
  const h = new Group()
  studPut(h, 3.8, 3.0, 3.4, C.hutWall, 0, 1.5, 0)
  put(h, new BoxGeometry(1.6, 2.2, 0.1), std(C.hutDoor, { roughness: 1 }), 0, 1.1, 1.71)
  studPut(h, 4.8, 0.5, 4.4, C.hutRoof, 0, 3.25, 0)
  studPut(h, 3.8, 0.5, 3.4, C.hutRoof, 0, 3.75, 0)
  studPut(h, 2.6, 0.5, 2.2, C.hutRoof, 0, 4.25, 0)
  studPut(h, 1.4, 0.4, 1.0, C.hutRoof, 0, 4.7, 0)
  const plate = new Mesh(new PlaneGeometry(2.0, 0.5), minionsPlate())
  plate.position.set(0, 2.62, 1.72)
  h.add(plate)
  h.position.set(x, 0, z)
  g.add(h)
}

// --- The owned base's machines (built facing +Z) -----------------------------------------

const GREY = '#4d5266'
const NAVY = '#232a45'
// The booth's misty glass: flashes brighter on every scare (pulseBooth).
const boothGlass = new MeshStandardMaterial({ color: '#eef4f8', emissive: '#c9d6de', emissiveIntensity: 0.55, roughness: 0.3, transparent: true, opacity: 0.88 })

// The +10/SCARE booth: a studded grey arch with red corner blocks on a dark plinth with
// yellow trim, a red pad, two lamps under the beam, a misty glass panel at the back and a
// step in front.
export function scareBooth() {
  const g = new Group()
  studPut(g, 5.4, 0.14, 4.8, YELLOW, 0, 0.07, 0)
  studPut(g, 5.1, 0.46, 4.5, DARK, 0, 0.37, 0) // plinth, top at 0.6
  studPut(g, 3.6, 0.1, 3.0, RED, 0, 0.65, 0.5) // the pad
  studPut(g, 3.2, 0.3, 0.9, DARK, 0, 0.15, 2.7) // step
  studPut(g, 3.2, 0.07, 0.14, YELLOW, 0, 0.32, 3.1)
  for (const s of [-1, 1]) {
    studPut(g, 1.05, 1.0, 1.4, DARK, s * 2.05, 1.1, -0.85) // feet
    studPut(g, 0.95, 3.6, 1.1, GREY, s * 2.0, 3.4, -0.9) // pillar
    studPut(g, 0.14, 3.6, 0.9, RED, s * 1.46, 3.4, -0.9) // red inner edge
    studPut(g, 0.95, 0.95, 1.25, RED, s * 2.0, 5.65, -0.9) // red corner block
    studPut(g, 0.7, 0.3, 0.9, RED, s * 2.0, 6.27, -0.9)
    put(g, new BoxGeometry(0.62, 0.12, 0.36), neon('#ffe7a0', 1.6), s * 0.85, 5.12, -0.55, false) // lamp
  }
  studPut(g, 3.1, 0.9, 1.2, GREY, 0, 5.65, -0.9) // top beam
  studPut(g, 3.0, 4.6, 0.3, DARK, 0, 3.9, -1.65) // back wall
  const glass = new Mesh(new PlaneGeometry(2.8, 3.6), boothGlass)
  glass.position.set(0, 3.4, -1.48)
  g.add(glass)
  return g
}

// The +2/STEP treadmill: a dark studded frame with yellow edge rails, the arch
// (yellow-capped posts, the display housing) at the -Z end, yellow/black striped
// handrails and a yellow step at the +Z end. The moving parts are treadmillLive().
export function treadmill() {
  const g = new Group()
  studPut(g, 3.4, 0.5, 5.6, DARK, 0, 0.25, 0)
  const railMat = [std(YELLOW, { roughness: 0.5 }), std(DARK, { roughness: 0.5 })]
  for (const s of [-1, 1]) {
    studPut(g, 0.28, 0.22, 5.6, YELLOW, s * 1.56, 0.61, 0) // edge rail
    studPut(g, 0.62, 3.6, 0.62, DARK, s * 1.5, 2.3, -2.5) // arch post
    studPut(g, 0.12, 1.6, 0.38, YELLOW, s * 1.17, 2.5, -2.5)
    studPut(g, 0.78, 0.45, 0.78, YELLOW, s * 1.5, 4.32, -2.5) // cap
    studPut(g, 0.7, 0.6, 0.7, DARK, s * 1.35, 0.8, 2.5) // front corner block
    studPut(g, 0.72, 0.14, 0.72, YELLOW, s * 1.35, 1.17, 2.5)
    // Handrail: two posts and a yellow / black striped bar.
    for (const z of [-1.9, 0.5]) put(g, new BoxGeometry(0.14, 1.1, 0.14), railMat[1], s * 1.3, 1.15, z)
    for (let k = 0; k < 6; k++) put(g, new BoxGeometry(0.18, 0.18, 0.45), railMat[k % 2], s * 1.3, 1.74, -1.825 + k * 0.45)
  }
  studPut(g, 3.6, 0.5, 0.56, DARK, 0, 3.85, -2.5) // arch beam
  studPut(g, 1.4, 0.85, 0.3, DARK, 0, 3.05, -2.6) // display housing
  studPut(g, 3.0, 0.2, 0.7, YELLOW, 0, 0.1, 3.15) // step
  return g
}

// The treadmill's moving parts (not baked), same space as treadmill(): the slatted belt,
// rising toward the arch, whose slats run toward the +Z end at the belt speed, two
// rollers that spin with it, and the pink display with scrolling chevrons that flashes on
// every gain. update(dt, speed m/s), flash().
const SLATS = 14
const SLAT_GAP = 0.36
function treadmillLive() {
  const g = new Group()
  const belt = new Group()
  belt.position.set(0, 0.52, 0.2)
  belt.rotation.x = 0.06
  const slatMats = [std('#2c3044', { roughness: 0.8 }), std('#3a3e52', { roughness: 0.8 })]
  const slatGeo = new BoxGeometry(2.6, 0.08, 0.32)
  const slats = []
  for (let i = 0; i < SLATS; i++) slats.push(put(belt, slatGeo, slatMats[i % 2], 0, 0.04, 0))
  const rollers = [-2.5, 2.6].map((z) => put(belt, new BoxGeometry(2.7, 0.14, 0.14), std('#9aa0ae', { metalness: 0.6, roughness: 0.35 }), 0, 0.01, z))
  g.add(belt)
  const chev = new CanvasTexture(paintChevrons('#c21f9e', '#ffd0f4', 256, 128))
  chev.colorSpace = SRGBColorSpace
  chev.wrapS = RepeatWrapping
  chev.repeat.set(2, 1)
  const screen = new MeshBasicMaterial({ map: chev })
  const base = new Color('#ffffff').multiplyScalar(1.3)
  screen.color.copy(base)
  // Faces +Z: toward whoever walks on the belt (they face the arch).
  put(g, new PlaneGeometry(1.05, 0.55), screen, 0, 3.05, -2.44, false)
  let offset = 0
  let flash = 0
  const span = SLATS * SLAT_GAP
  const place = () => {
    for (let i = 0; i < SLATS; i++) slats[i].position.z = -2.35 + ((((i * SLAT_GAP + offset) % span) + span) % span)
  }
  place()
  return {
    g,
    update(dt, speed) {
      offset += speed * dt
      if (speed > 0) place()
      for (const r of rollers) r.rotation.x += speed * dt * 7
      chev.offset.x -= speed * dt * 0.25
      flash = Math.max(0, flash - dt * 3)
      screen.color.copy(base).multiplyScalar(0.55 + 0.45 * Math.min(1, speed / 3) + flash * 1.2)
    },
    flash() {
      flash = 1
    },
  }
}

// Upgrade sign face (canvas), drawn from `info` { title, level, cost (text or null = max),
// }: title, "Level 1 > Level 2" (or "Level 5 MAX"), then a green $ button with an
// up-arrow badge. Repaint with draw() after a change.
function paintUpgrade(info) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 300
  const draw = () => {
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, 512, 300)
    ctx.fillStyle = '#20253a'
    roundRect(ctx, 0, 0, 512, 300, 26)
    ctx.fill()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    const text = (t, x, y, px, fill) => {
      ctx.font = `700 ${px}px ${FONT_FAMILY}, sans-serif`
      ctx.lineWidth = px * 0.18
      ctx.strokeStyle = '#10131f'
      ctx.strokeText(t, x, y)
      ctx.fillStyle = fill
      ctx.fillText(t, x, y)
    }
    const { title, level, cost } = info
    const max = cost == null
    text(title, 256, 58, 62, '#ffffff')
    text(max ? `Level ${level} MAX` : `Level ${level} > Level ${level + 1}`, 256, 128, 48, max ? '#ffd23f' : '#7dff5a')
    const button = (x, w, fill, edge, value, badge) => {
      ctx.fillStyle = edge
      roundRect(ctx, x, 176, w, 100, 18)
      ctx.fill()
      ctx.fillStyle = fill
      roundRect(ctx, x + 6, 182, w - 12, 82, 14)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      roundRect(ctx, x + 18, 196, 56, 56, 12)
      ctx.fill()
      ctx.strokeStyle = edge
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(x + 46, 240)
      ctx.lineTo(x + 46, 208)
      ctx.moveTo(x + 32, 222)
      ctx.lineTo(x + 46, 208)
      ctx.lineTo(x + 60, 222)
      ctx.stroke()
      text(value, x + 48 + (w - 48) / 2, 224, 52, '#ffffff')
    }
    if (max) button(56, 400, '#8a90a0', '#4a4f5c', 'MAX', 'up')
    else button(56, 400, '#45dc3c', '#1d7a1a', cost, 'up')
  }
  draw()
  return { canvas: c, draw }
}

// A red "!" (bar over a dot), origin at the dot; bobbed by update().
const exclaimMat = std('#ff2a2a', { roughness: 0.4, emissive: '#5a0000' })
function exclaim() {
  const g = new Group()
  put(g, new BoxGeometry(0.3, 0.85, 0.3), exclaimMat, 0, 0.72, 0)
  put(g, new BoxGeometry(0.3, 0.3, 0.3), exclaimMat, 0, 0, 0)
  g.rotation.z = -0.22
  return g
}

// Sign on a post, the board tilted back, its face toward +Z. Returns { g, repaint }.
function upgradeSign(info, w = 2.3, h = 1.35) {
  const g = new Group()
  studPut(g, 0.5, 1.05, 0.5, NAVY, 0, 0.52, 0)
  const board = new Group()
  board.position.y = 1.45
  board.rotation.x = -0.42
  studPut(board, w, h, 0.42, NAVY, 0, 0, 0)
  const painted = paintUpgrade(info)
  const tex = new CanvasTexture(painted.canvas)
  tex.colorSpace = SRGBColorSpace
  const repaint = () => {
    painted.draw()
    tex.needsUpdate = true
  }
  fontReady.then(repaint)
  const face = new Mesh(new PlaneGeometry(w - 0.14, h - 0.14), new MeshBasicMaterial({ map: tex, transparent: true }))
  face.position.z = 0.215
  board.add(face)
  g.add(board)
  return { g, repaint }
}

function moneyPile() {
  const g = new Group()
  const stacks = [
    [0, 0, 3],
    [1.7, 0.2, 2],
    [0.8, -1.0, 2],
    [-1.4, 0.3, 1],
  ]
  for (const [x, z, n] of stacks) {
    for (let i = 0; i < n; i++) {
      studPut(g, 1.6, 0.5, 0.9, '#3fa34d', x, 0.25 + i * 0.5, z)
      studPut(g, 0.3, 0.52, 0.92, YELLOW, x, 0.25 + i * 0.5, z)
    }
  }
  return g
}

export function buildBases(scene) {
  const root = new Group()
  const live = new Group()
  const marks = {} // key -> { mk, y, phase, on }: the bobbing "!"s
  const signs = {} // key -> { info, repaint }
  const labels = {} // key -> sprite (rebuilt when its text changes)
  const plotTags = [] // plot index -> { sprite, text, mine }: the name tag over each plot (setOwner)
  const TAG_STYLE = { color: '#ffffff', outline: '#1a1c26' }
  const PILE_STYLE = { colors: ['#5cff5c', '#5cff5c'], outline: '#0b3a10' }
  const M = BASES.machines
  const L = BASES.layout
  let mill = null // the treadmill's moving parts
  let millSpeed = 0 // m/s the belt runs at (eased toward the target from setMill)
  let millTarget = 0
  const signInfo = (key, title) => (signs[key] = { info: { title, level: 1, cost: null } }).info

  BASES.plots.forEach((p, i) => {
    const g = new Group()
    studPut(g, W, 0.16, D, C.floor, 0, 0.08, 0)
    fence(g, -W / 2, -D / 2, W / 2, -D / 2)
    fence(g, -W / 2, D / 2, -W / 2, -D / 2)
    fence(g, W / 2, -D / 2, W / 2, D / 2)
    hut(g, -W / 2 + 2.4, -D / 2 + 1.2)
    const mine = i === BASES.mine
    const at = (lx, lz) => toWorld(p.x, p.z, p.yaw, lx, lz)
    // A collider box given in a machine's own space (machine at plot-local (mx, mz), turned rot).
    const solidIn = (mx, mz, rot, x, y, z, hx, hy, hz) => {
      const c = Math.cos(rot)
      const s = Math.sin(rot)
      const [wx, wz] = at(mx + x * c + z * s, mz - x * s + z * c)
      solidBox(hx, hy, hz, wx, y, wz, p.yaw + rot)
    }
    const add = (obj, [x, z], rot, y = 0) => {
      obj.position.set(x, y, z)
      obj.rotation.y = rot
      g.add(obj)
    }
    const liveAt = (obj, [x, z], y) => {
      const [wx, wz] = at(x, z)
      obj.position.set(wx, y, wz)
      live.add(obj)
      return obj
    }
    if (mine) {
      // The booth and the treadmill face the plot (-Z local), so they are turned half round.
      add(scareBooth(), L.booth, Math.PI)
      add(treadmill(), L.mill, Math.PI)
      mill = treadmillLive()
      const [mx, mz] = at(L.mill[0], L.mill[1])
      mill.g.position.set(mx, 0, mz)
      mill.g.rotation.y = p.yaw + Math.PI
      live.add(mill.g)
      for (const [key, title, spot, rot, w, h] of [
        ['booth', 'Upgrade', L.boothSign, Math.PI],
        ['mill', 'Upgrade', L.millSign, Math.PI],
        ['base', 'Upgrade Base', L.upgrade, 0, 3.3, 1.7],
      ]) {
        const sign = upgradeSign(signInfo(key, title), w, h)
        signs[key].repaint = sign.repaint
        add(sign.g, spot, rot)
      }
      add(moneyPile(), L.pile, 0, 0.16)
      for (const [key, spot, y] of [['booth', L.boothSign, 3.0], ['mill', L.millSign, 3.0], ['base', L.upgrade, 4.6]]) {
        const mk = liveAt(exclaim(), spot, y)
        marks[key] = { mk, y, phase: Object.keys(marks).length * 1.3, on: true }
      }
    }
    g.position.set(p.x, 0, p.z)
    g.rotation.y = p.yaw
    root.add(g)

    // Name tag: out front between the booth and the treadmill (an empty plot: its middle).
    const tag = label(mine ? 'Your Base' : 'Empty Base', 1.1, TAG_STYLE)
    liveAt(tag, mine ? L.owner : [0, 0], mine ? 3.0 : 2.6)
    plotTags[i] = { sprite: tag, text: mine ? 'Your Base' : 'Empty Base', mine }

    // Colliders: the three fence sides and the hut.
    let [x, z] = at(0, -D / 2)
    solidBox(W / 2, 0.9, 0.15, x, 0.9, z, p.yaw)
    for (const s of [-1, 1]) {
      ;[x, z] = at((s * W) / 2, 0)
      solidBox(0.15, 0.9, D / 2, x, 0.9, z, p.yaw)
    }
    ;[x, z] = at(-W / 2 + 2.4, -D / 2 + 1.2)
    solidBox(2.4, 2.4, 2.2, x, 2.4, z, p.yaw)

    if (mine) {
      // Floating labels over the machines and the offline money.
      labels.booth = liveAt(label(M.scare.replace('{n}', '10'), 1.7, { color: '#ff4040', outline: '#3a0000' }), L.booth, 7.3)
      labels.mill = liveAt(label(M.step.replace('{n}', '2'), 1.7, { color: '#3fd8ff', outline: '#06304a' }), L.mill, 5.4)
      labels.pile = liveAt(label(`${M.offline}\n$0`, 1.8, PILE_STYLE), L.pile, 3.4)
      // Booth: plinth + step stay walkable (0.3 m rises), the arch and back wall are solid.
      const [bx, bz] = L.booth
      solidIn(bx, bz, Math.PI, 0, 0.3, 0, 2.55, 0.3, 2.25)
      solidIn(bx, bz, Math.PI, 0, 0.15, 2.7, 1.6, 0.15, 0.45)
      solidIn(bx, bz, Math.PI, 0, 3.4, -1.15, 2.55, 2.8, 0.65)
      // Treadmill: frame (a step up at the front end) and the two arch posts.
      const [tx, tz] = L.mill
      solidIn(tx, tz, Math.PI, 0, 0.25, 0, 1.7, 0.25, 2.8)
      solidIn(tx, tz, Math.PI, 0, 0.1, 3.15, 1.5, 0.1, 0.35)
      for (const s of [-1, 1]) solidIn(tx, tz, Math.PI, s * 1.5, 2.1, -2.5, 0.31, 2.1, 0.31)
      // Sign posts.
      for (const spot of [L.boothSign, L.millSign, L.upgrade]) solidIn(spot[0], spot[1], 0, 0, 0.9, 0, 0.3, 0.9, 0.3)
    }
  })

  const baked = bake(root, true)
  baked.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true
  })
  scene.add(baked, live)

  const labelStyle = { booth: { color: '#ff4040', outline: '#3a0000' }, mill: { color: '#3fd8ff', outline: '#06304a' } }
  let glow = 0
  return {
    // The "!"s bob and sway; the booth glass fades back after a pulse.
    update(elapsed, dt = 0) {
      for (const m of Object.values(marks)) {
        m.mk.visible = m.on
        if (!m.on) continue
        m.mk.position.y = m.y + Math.sin(elapsed * 3 + m.phase) * 0.15
        m.mk.rotation.z = -0.22 + Math.sin(elapsed * 2.2 + m.phase) * 0.08
      }
      millSpeed += (millTarget - millSpeed) * Math.min(1, dt * 4)
      if (millSpeed < 0.02 && millTarget === 0) millSpeed = 0
      mill?.update(dt, millSpeed)
      if (glow > 0) {
        glow = Math.max(0, glow - dt * 2.5)
        boothGlass.emissiveIntensity = 0.55 + glow * 1.6
        boothGlass.emissive.setRGB(0.79 + glow * 0.2, 0.84 - glow * 0.5, 0.87 - glow * 0.5)
      }
    },
    // key 'booth' | 'mill' | 'base': { level, cost: text | null (max) }, `can` = show the "!".
    setSign(key, info, can) {
      const s = signs[key]
      if (!s) return
      const changed = info.level !== s.info.level || info.cost !== s.info.cost
      Object.assign(s.info, info)
      if (changed) s.repaint?.()
      if (marks[key]) marks[key].on = can
    },
    // The "+10/SCARE" / "+2/STEP" label over 'booth' / 'mill'.
    setLabel(key, text) {
      const old = labels[key]
      if (!old || old.userData.text === text) return
      const next = label(text, 1.7, labelStyle[key])
      next.position.copy(old.position)
      next.userData.text = text
      live.remove(old)
      old.material.map?.dispose()
      old.material.dispose()
      live.add(next)
      labels[key] = next
    },
    // The name tag over plot `i` (net.js: who the server gave it to): "<name>'s Base", or "Empty Base" for null.
    // Your own plot keeps "Your Base".
    setOwner(i, name) {
      const t = plotTags[i]
      if (!t || t.mine) return
      const text = name ? `${name}'s Base` : 'Empty Base'
      if (t.text === text) return
      const next = label(text, 1.1, TAG_STYLE)
      next.position.copy(t.sprite.position)
      live.remove(t.sprite)
      t.sprite.material.map?.dispose()
      t.sprite.material.dispose()
      live.add(next)
      t.sprite = next
      t.text = text
    },
    // The Offline Money label over the pile: "OFFLINE MONEY!" and the amount waiting.
    setPile(text) {
      const old = labels.pile
      if (!old || old.userData.text === text) return
      const next = label(`${M.offline}\n${text}`, 1.8, PILE_STYLE)
      next.position.copy(old.position)
      next.userData.text = text
      live.remove(old)
      old.material.map?.dispose()
      old.material.dispose()
      live.add(next)
      labels.pile = next
    },
    // The treadmill belt's target speed (m/s; 0 = it winds down) and its display flash.
    setMill(speed) {
      millTarget = speed
    },
    millSpeed: () => millSpeed,
    flashMill() {
      mill?.flash()
    },
    // One scare from the booth: the glass flashes red-white.
    pulseBooth() {
      glow = 1
    },
  }
}
