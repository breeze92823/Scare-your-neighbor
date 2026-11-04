// Speed auras: the swirl worn around the player (and on the aura's shop card).
// Three helical light ribbons wind up around the body at different radii and speeds,
// with a soft glowing disc at the feet and sparkles spiralling upward. Dark auras
// (Void) and Magma add a normal-blended smoke ribbon so they read as dark, not just
// dim. Everything is a handful of unlit additive meshes plus one Points cloud.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  Points,
  PointsMaterial,
  SRGBColorSpace,
} from 'three'
import { AURAS } from './config.js'
import { neon } from './propkit.js'
import { loadBaseCharacter } from './avatar/character.js'
import { PlayerRig, PoseBuffer } from './avatar/rig.js'
import { M } from './models/kit.js'
import { thumb } from './thumbs.js'

const canvasTex = (w, h, paint) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d'), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// Ribbon texture: bright core along its length, soft edges, fading in and out at both ends,
// with a few brighter streaks so the scroll reads as motion. Greyscale; tinted by the material.
let ribbonTex = null
function ribbonTexture() {
  if (ribbonTex) return ribbonTex
  ribbonTex = canvasTex(256, 32, (x, w, h) => {
    const across = x.createLinearGradient(0, 0, 0, h)
    across.addColorStop(0, 'rgba(255,255,255,0)')
    across.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    across.addColorStop(0.5, 'rgba(255,255,255,1)')
    across.addColorStop(0.65, 'rgba(255,255,255,0.55)')
    across.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = across
    x.fillRect(0, 0, w, h)
    x.globalCompositeOperation = 'destination-in'
    const along = x.createLinearGradient(0, 0, w, 0)
    along.addColorStop(0, 'rgba(0,0,0,0)')
    along.addColorStop(0.18, 'rgba(0,0,0,1)')
    along.addColorStop(0.7, 'rgba(0,0,0,0.9)')
    along.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = along
    x.fillRect(0, 0, w, h)
    x.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 7; i++) {
      x.fillStyle = `rgba(255,255,255,${0.12 + Math.random() * 0.2})`
      x.fillRect(30 + Math.random() * 190, h * 0.42, 10 + Math.random() * 30, h * 0.16)
    }
  })
  return ribbonTex
}
let discTex = null
const discTexture = () =>
  (discTex ||= canvasTex(128, 128, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.28)')
    g.addColorStop(0.82, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, w, w)
  }))
let sparkTex = null
const sparkTexture = () =>
  (sparkTex ||= canvasTex(64, 64, (x, w) => {
    const c = w / 2
    const g = x.createRadialGradient(c, c, 0, c, c, c)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.6)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, w, w)
    x.fillStyle = '#fff'
    x.beginPath() // four-point star
    x.moveTo(c, 2)
    x.quadraticCurveTo(c + 3, c - 3, w - 2, c)
    x.quadraticCurveTo(c + 3, c + 3, c, w - 2)
    x.quadraticCurveTo(c - 3, c + 3, 2, c)
    x.quadraticCurveTo(c - 3, c - 3, c, 2)
    x.fill()
  }))

// A helical band: `turns` around the Y axis from y0 to y1, radius r0 -> r1, band height w.
function helix({ turns = 1.4, y0 = 0.05, y1 = 2.1, r0 = 0.95, r1 = 0.7, w = 0.32, seg = 72 }) {
  const pos = new Float32Array((seg + 1) * 2 * 3)
  const uv = new Float32Array((seg + 1) * 2 * 2)
  const idx = []
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const a = t * turns * Math.PI * 2
    const r = r0 + (r1 - r0) * t
    const y = y0 + (y1 - y0) * t
    const tilt = w * (0.5 + 0.5 * Math.sin(t * Math.PI)) // widest mid-way
    for (let s = 0; s < 2; s++) {
      const k = (i * 2 + s) * 3
      pos[k] = Math.cos(a) * r
      pos[k + 1] = y + (s ? tilt / 2 : -tilt / 2)
      pos[k + 2] = Math.sin(a) * r
      uv[(i * 2 + s) * 2] = t
      uv[(i * 2 + s) * 2 + 1] = s
    }
    if (i < seg) {
      const a0 = i * 2
      idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

function ribbonMat(color, k, dark = false) {
  const map = ribbonTexture().clone()
  map.needsUpdate = true
  if (dark) return new MeshBasicMaterial({ color, map, transparent: true, opacity: 0.8, depthWrite: false, side: DoubleSide, blending: NormalBlending, fog: false })
  return neon(color, k, { map, transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, fog: false })
}

// The aura effect around a ~1.8 m character standing at the group's origin.
// quality 0..1 scales the sparkle count (graphics preset particles).
export function buildAura(aura, quality = 1) {
  const [main, hi, deep] = aura.colors
  const g = new Group()
  g.name = `aura:${aura.id}`
  const ribbons = [
    { color: main, k: 2.2, turns: 1.5, r0: 1.0, r1: 0.72, w: 0.42, spin: 2.2, scroll: 0.9, phase: 0 },
    { color: hi, k: 2.6, turns: 1.2, r0: 0.86, r1: 0.95, w: 0.22, spin: -2.8, scroll: 1.3, phase: 2.1, y1: 2.3 },
    { color: aura.multi ? '#3fd0ff' : main, k: 1.8, turns: 1.8, r0: 1.12, r1: 0.6, w: 0.3, spin: 1.6, scroll: 0.7, phase: 4.2, y1: 1.9 },
  ]
  if (aura.dark || aura.lava) ribbons.push({ color: deep, turns: 1.3, r0: 1.05, r1: 0.8, w: 0.55, spin: 1.3, scroll: 0.5, phase: 1.1, dark: true })
  const parts = ribbons.map((r) => {
    const m = new Mesh(helix(r), ribbonMat(r.color, r.k, r.dark))
    m.rotation.y = r.phase
    m.renderOrder = r.dark ? 1 : 2
    m.userData = r
    g.add(m)
    return m
  })

  const disc = new Mesh(new CircleGeometry(1.25, 40), neon(main, 1.6, { map: discTexture(), transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false }))
  disc.rotation.x = -Math.PI / 2
  disc.position.y = 0.04
  disc.renderOrder = 2
  g.add(disc)

  const n = Math.max(8, Math.round(34 * quality))
  const pos = new Float32Array(n * 3)
  const seeds = Array.from({ length: n }, () => ({ a: Math.random() * Math.PI * 2, t: Math.random(), r: 0.55 + Math.random() * 0.6, v: 0.25 + Math.random() * 0.35 }))
  const pg = new BufferGeometry()
  pg.setAttribute('position', new BufferAttribute(pos, 3))
  const pm = new PointsMaterial({ map: sparkTexture(), size: 0.16, transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false })
  pm.color = new Color(hi).multiplyScalar(1.4)
  const sparks = new Points(pg, pm)
  sparks.frustumCulled = false
  sparks.renderOrder = 3
  g.add(sparks)

  let time = 0
  const update = (dt) => {
    time += dt
    for (const m of parts) {
      const r = m.userData
      m.rotation.y = r.phase + time * r.spin
      m.material.map.offset.x = -((time * r.scroll) % 1)
    }
    disc.material.opacity = 0.75 + Math.sin(time * 3) * 0.2
    for (let i = 0; i < n; i++) {
      const s = seeds[i]
      const t = (s.t + time * s.v * 0.35) % 1
      const a = s.a + t * 5 + time * 0.8
      const r = s.r * (1 - t * 0.35)
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.1 + t * 2.3
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    pg.attributes.position.needsUpdate = true
  }
  update(0.6)
  g.userData.update = update
  g.userData.dispose = () => {
    g.traverse((o) => {
      o.geometry?.dispose()
      if (o.material) {
        if (o.material.map && o.material.map !== discTex && o.material.map !== sparkTex) o.material.map.dispose()
        o.material.dispose()
      }
    })
  }
  return g
}

// Worn aura on the player group: follows it, animates, swaps when the loadout changes.
export function createPlayerAura(playerGroup, quality = () => 1) {
  let current = null
  return {
    set(id) {
      if (current) {
        playerGroup.remove(current)
        current.userData.dispose()
        current = null
      }
      const aura = AURAS.find((a) => a.id === id)
      if (!aura) return
      current = buildAura(aura, quality())
      playerGroup.add(current)
    },
    update(dt, visible = true) {
      if (!current) return
      current.visible = visible
      if (visible) current.userData.update(dt)
    },
  }
}

// --- Shop card art -------------------------------------------------------------------------
const deg = (d) => (d * Math.PI) / 180
// A dashing run, like the reference cards.
const RUN_POSE = {
  Spine1: { x: deg(8), y: deg(-10) },
  Neck1: { x: deg(-6) },
  ArmL1: { x: deg(-55), z: deg(8) },
  ArmL2: { x: deg(-50) },
  ArmR1: { x: deg(45), z: deg(-8) },
  ArmR2: { x: deg(-35) },
  LegL1: { x: deg(42) },
  LegL2: { x: deg(55) },
  LegR1: { x: deg(-48) },
  LegR2: { x: deg(28) },
}

// The figure in the aura's colour, mid-run, wrapped in its swirl.
export function auraThumb(aura) {
  return thumb(
    `aura:${aura.id}`,
    async () => {
      const root = await loadBaseCharacter()
      const tint = new Color(aura.colors[0]).lerp(new Color(aura.colors[2]), aura.id === 'silver' ? 0.35 : 0.22)
      const body = M(`#${tint.getHexString()}`, { rough: 0.34, metal: aura.dark ? 0.45 : 0.2 })
      root.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) o.material = body
      })
      const rig = new PlayerRig(root)
      const pose = new PoseBuffer()
      pose.applyDefinition(RUN_POSE)
      rig.applyPose(pose)
      root.rotation.y = 0.35
      const g = new Group()
      g.add(root)
      const fx = buildAura(aura, 1)
      fx.scale.setScalar(1.05)
      fx.traverse((o) => {
        if (o.material && o.material.blending === AdditiveBlending) o.material.opacity = 0.75
      })
      g.add(fx)
      return g
    },
    { w: 256, h: 300, yaw: -0.3, pitch: 0.12, fit: { target: [0, 1.0, 0], dist: 4.3 } },
  )
}

// The card background: the aura's colour with swirling light arcs and sparkles (CSS url).
const bgCache = new Map()
export function auraCardBg(aura) {
  if (bgCache.has(aura.id)) return bgCache.get(aura.id)
  const c = document.createElement('canvas')
  c.width = 252
  c.height = 356
  const x = c.getContext('2d')
  const [inner, outer] = aura.bg
  const g = x.createRadialGradient(126, 170, 10, 126, 170, 230)
  g.addColorStop(0, inner)
  g.addColorStop(1, outer)
  x.fillStyle = g
  x.fillRect(0, 0, 252, 356)
  if (aura.multi || aura.dark) {
    // Nebula clouds.
    for (let i = 0; i < 9; i++) {
      const cx = Math.random() * 252
      const cy = Math.random() * 356
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, 70 + Math.random() * 60)
      rg.addColorStop(0, i % 2 ? 'rgba(255,90,230,0.35)' : 'rgba(90,140,255,0.35)')
      rg.addColorStop(1, 'rgba(0,0,0,0)')
      x.fillStyle = rg
      x.fillRect(0, 0, 252, 356)
    }
  }
  if (aura.lava) {
    x.strokeStyle = 'rgba(255,210,80,0.55)'
    x.lineWidth = 2
    for (let i = 0; i < 14; i++) {
      x.beginPath()
      let px = Math.random() * 252
      let py = Math.random() * 356
      x.moveTo(px, py)
      for (let s = 0; s < 4; s++) x.lineTo((px += (Math.random() - 0.5) * 50), (py += (Math.random() - 0.5) * 50))
      x.stroke()
    }
  }
  // Swirl arcs around the figure.
  x.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 7; i++) {
    x.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.16})`
    x.lineWidth = 2 + Math.random() * 6
    x.beginPath()
    x.ellipse(126, 175 + (Math.random() - 0.5) * 80, 70 + Math.random() * 60, 22 + Math.random() * 30, -0.25 + Math.random() * 0.5, Math.random() * 3, Math.random() * 3 + 2.5)
    x.stroke()
  }
  // Sparkles and dust.
  for (let i = 0; i < 70; i++) {
    const s = Math.random() < 0.15 ? 2.4 + Math.random() * 3 : 0.6 + Math.random() * 1.4
    const px = Math.random() * 252
    const py = Math.random() * 356
    x.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.6})`
    x.beginPath()
    if (s > 2) {
      x.moveTo(px, py - s * 2.2)
      x.lineTo(px + s * 0.5, py - s * 0.5)
      x.lineTo(px + s * 2.2, py)
      x.lineTo(px + s * 0.5, py + s * 0.5)
      x.lineTo(px, py + s * 2.2)
      x.lineTo(px - s * 0.5, py + s * 0.5)
      x.lineTo(px - s * 2.2, py)
      x.lineTo(px - s * 0.5, py - s * 0.5)
    } else x.arc(px, py, s, 0, Math.PI * 2)
    x.fill()
  }
  const url = c.toDataURL('image/jpeg', 0.86)
  bgCache.set(aura.id, url)
  return url
}
