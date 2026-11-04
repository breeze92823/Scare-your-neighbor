// Vampire (Epic): pale grey-white skin, slick black hair with a widow's peak, red eyes,
// dark brows and fangs; a black tailcoat with satin lapels over a red waistcoat, a white
// shirt with a frilly jabot and a red gem brooch; a tall stand-up collar and a long cape
// (black outside, red inside) hanging from the shoulders; black trousers with a satin
// stripe and shiny pointed shoes.
import { Group, LatheGeometry, Mesh, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const SKIN = M('#d8d5e0', { rough: 0.55 })
const SKIN_D = M('#cdc8d6', { rough: 0.6 })
const HAIR = M('#15121b', { rough: 0.22, metal: 0.15 })
const HAIR_HI = M('#3a3448', { rough: 0.2, metal: 0.2 })
const COAT = M('#18161e', { rough: 0.55 })
const SATIN = M('#2a2633', { rough: 0.22, metal: 0.1 })
const VEST = M('#9a1228', { rough: 0.45 })
const VEST_D = M('#6e0a1c', { rough: 0.5 })
const SHIRT = M('#f4f2ee', { rough: 0.6 })
const GOLD = M('#e0b44a', { rough: 0.25, metal: 0.9 })
const GEM = M('#ff2a3e', { rough: 0.08, metal: 0.2, emissive: '#c0001a', glow: 0.45 })
const EYE = M('#ff3040', { rough: 0.2, emissive: '#ff1028', glow: 0.7 })
const FANG = M('#ffffff', { rough: 0.2 })
const SHOE = M('#0e0d12', { rough: 0.12, metal: 0.35 })
const SOLE = M('#2a1a14', { rough: 0.7 })
const NAIL = M('#2a2433', { rough: 0.3 })
// The cape and collar: black outside, red silk inside (two layers, one per side).
const CAPE_OUT = M('#141219', { rough: 0.5, side: 0 })
const CAPE_IN = M('#b5122c', { rough: 0.3, side: 1 })
const RED = M('#b5122c', { rough: 0.3 })

const faceTex = () =>
  tex('vampire:face', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    // hollow cheeks and grey eye shadows
    const shade = (cx, cy, rx, ry, a) => {
      const g = x.createRadialGradient(cx, cy, 2, cx, cy, rx)
      g.addColorStop(0, `rgba(90,80,110,${a})`)
      g.addColorStop(1, 'rgba(90,80,110,0)')
      x.fillStyle = g
      x.beginPath()
      x.ellipse(cx, cy, rx, ry, 0, 0, PI * 2)
      x.fill()
    }
    shade(76, 112, 44, 30, 0.45)
    shade(180, 112, 44, 30, 0.45)
    shade(52, 178, 30, 40, 0.3)
    shade(204, 178, 30, 40, 0.3)
    // eyes: almond shaped, red iris, slit pupil, heavy upper lid
    for (const [cx, sgn] of [[78, 1], [178, -1]]) {
      x.save()
      x.translate(cx, 112)
      x.rotate(0.12 * sgn)
      x.fillStyle = '#fff6f0'
      x.beginPath()
      x.moveTo(-32, 2)
      x.quadraticCurveTo(0, -24, 32, 2)
      x.quadraticCurveTo(0, 20, -32, 2)
      x.fill()
      x.fillStyle = '#d0142a'
      x.beginPath()
      x.arc(0, 1, 13, 0, PI * 2)
      x.fill()
      x.fillStyle = '#3a0008'
      x.fillRect(-2.5, -10, 5, 22)
      x.strokeStyle = '#141018'
      x.lineWidth = 5
      x.beginPath()
      x.moveTo(-34, 3)
      x.quadraticCurveTo(0, -26, 34, 1)
      x.stroke()
      x.restore()
    }
    // brows: sharp, angled down toward the nose
    x.fillStyle = '#141018'
    for (const [cx, sgn] of [[78, 1], [178, -1]]) {
      x.beginPath()
      x.moveTo(cx - 40 * sgn, 70)
      x.lineTo(cx + 30 * sgn, 86)
      x.lineTo(cx + 26 * sgn, 96)
      x.lineTo(cx - 38 * sgn, 80)
      x.fill()
    }
    // nose: a long thin shadow line
    x.strokeStyle = 'rgba(120,110,140,0.7)'
    x.lineWidth = 4
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(132, 104)
    x.lineTo(138, 150)
    x.lineTo(126, 156)
    x.stroke()
    // mouth: a thin dark-red smirk
    x.fillStyle = '#5a0a18'
    x.beginPath()
    x.moveTo(84, 188)
    x.quadraticCurveTo(128, 200, 178, 180)
    x.quadraticCurveTo(130, 210, 84, 188)
    x.fill()
    x.strokeStyle = '#3a0610'
    x.lineWidth = 4
    x.beginPath()
    x.moveTo(84, 188)
    x.quadraticCurveTo(128, 200, 178, 180)
    x.stroke()
    // a drop of blood at the corner
    x.fillStyle = '#c0102a'
    x.beginPath()
    x.ellipse(170, 196, 4, 7, 0, 0, PI * 2)
    x.fill()
  })

// Canvas (128) -> head-front coordinates (decal is 1.56 wide, centred at y 5.6).
const fx = (px) => (px / 256 - 0.5) * 1.56
const fy = (py) => 5.6 + (0.5 - py / 256) * 1.56

// --- Head (Neck1) ------------------------------------------------------------------------------
function head() {
  return grp(
    mesh(G.rbox(1.6, 1.6, 1.6, 0.14, 3), SKIN, { p: [0, 5.6, 0] }),
    decal(faceTex(), 1.56, 1.56, { p: [0, 5.6, 0.805] }),
    // glowing pupils
    both((s) => mesh(G.sphere(0.045, 10, 8), EYE, { p: [fx(s > 0 ? 178 : 78), fy(113), 0.81], s: [0.6, 1.4, 0.4], shadow: false })),
    // a sharp nose
    mesh(G.extrude([[-0.08, 0], [0.08, 0], [0.02, 0.36]], 0.16, 0.03), SKIN_D, { p: [0.02, 5.36, 0.84] }),
    // fangs over the lower lip
    both((s) => mesh(G.cone(0.045, 0.16, 8), FANG, { p: [fx(s > 0 ? 150 : 108), fy(197), 0.83], r: [PI, 0, 0] })),
    // pointed ears
    both((s) => grp(
      mesh(G.cone(0.14, 0.5, 10), SKIN, { p: [0, 0.2, 0], s: [1, 1, 0.45] }),
      { p: [0.84 * s, 5.62, -0.05], r: [0, 0, -1.05 * s] },
    )),
    // slick hair: cap, back, sides and the sideburns
    mesh(G.rbox(1.74, 0.44, 1.76, 0.18, 3), HAIR, { p: [0, 6.36, -0.02] }),
    mesh(G.rbox(1.74, 1.3, 0.42, 0.14), HAIR, { p: [0, 5.82, -0.7] }),
    both((s) => mesh(G.rbox(0.14, 0.72, 1.2, 0.06), HAIR, { p: [0.84 * s, 6.0, -0.22] })),
    both((s) => mesh(G.extrude([[0, 0], [0.26, 0], [0.04, -0.42]], 0.1, 0.02), HAIR, { p: [0.84 * s, 5.98, 0.42], r: [0, (PI / 2) * s, 0] })),
    // the widow's peak: a sharp point down the middle of the forehead
    mesh(G.extrude([[-0.8, 0], [0.8, 0], [0.8, -0.1], [0.12, -0.18], [0, -0.48], [-0.12, -0.18], [-0.8, -0.1]], 0.08, 0.02), HAIR, { p: [0, 6.32, 0.8] }),
    // combed-back shine streaks
    rep(4, (i) => mesh(G.rbox(0.07, 0.04, 1.4, 0.02), HAIR_HI, { p: [-0.45 + i * 0.3, 6.59, -0.05] })),
    mesh(G.rbox(0.9, 0.05, 0.05, 0.02), HAIR_HI, { p: [0, 6.29, 0.86] }),
  )
}

// --- Stand-up collar and cape (Spine2) -----------------------------------------------------
function collar() {
  // pointed panel outline, w wide and h tall, bottom edge at y 0
  const panel = (w, h) => [[-w / 2, 0], [w / 2, 0], [w / 2 + 0.06, h * 0.82], [w * 0.2, h * 0.88], [0, h], [-w * 0.2, h * 0.88], [-w / 2 - 0.06, h * 0.82]]
  const R = 1.12
  return rep(5, (i) => {
    const k = i - 2
    const phi = PI + k * 0.5
    const h = 1.75 - Math.abs(k) * 0.28
    const shape = panel(0.98, h)
    return wrapTilt(
      grp(
        // red silk inner face toward the head, black outer face
        mesh(G.extrude(shape, 0.04, 0.012), RED, { p: [0, 0, 0.03] }),
        mesh(G.extrude(shape, 0.05, 0.012), COAT, { p: [0, 0, -0.02] }),
        mesh(G.box(0.03, h * 0.75, 0.02), VEST_D, { p: [0, h * 0.42, 0.06] }),
      ),
      phi,
      R,
    )
  })
}
// Places a collar panel on the ring around the neck, facing in, its top tilted outward.
function wrapTilt(panel, phi, R) {
  panel.rotation.x = -0.32
  return grp(panel, { p: [Math.sin(phi) * R, 4.72, Math.cos(phi) * R], r: [0, phi + PI, 0] })
}

const capeGeo = (inset) => {
  const prof = [
    [2.4, 0.72],
    [2.26, 1.4],
    [2.04, 2.4],
    [1.8, 3.4],
    [1.56, 4.2],
    [1.36, 4.66],
    [1.12, 4.86],
  ].map(([r, y]) => new Vector2(r - inset, y))
  const half = PI * 0.42
  return new LatheGeometry(prof, 24, PI - half, half * 2)
}
let capeOut = null
let capeIn = null
function cape() {
  capeOut ??= capeGeo(0)
  capeIn ??= capeGeo(0.05)
  return grp(
    mesh(capeOut, CAPE_OUT, { s: [1, 1, 0.66] }),
    mesh(capeIn, CAPE_IN, { s: [1, 1, 0.66] }),
    // a red silk hem band along the bottom
    mesh(new LatheGeometry([new Vector2(2.42, 0.72), new Vector2(2.4, 0.86)], 24, PI - PI * 0.42, PI * 0.84), M('#8a0e22', { rough: 0.35, side: 2 }), { s: [1, 1, 0.665] }),
    // gold clasps at the front of the shoulders, joined by a chain over the chest
    both((s) => grp(
      mesh(G.cyl(0.16, 0.16, 0.06, 16), GOLD, { r: [PI / 2, 0, 0] }),
      mesh(G.ico(0.08, 0), GEM, { p: [0, 0, 0.05] }),
      { p: [1.12 * s, 4.66, 0.88] },
    )),
    mesh(G.tube([[-1.1, 4.62, 0.92], [-0.5, 4.38, 1.0], [0, 4.32, 1.02], [0.5, 4.38, 1.0], [1.1, 4.62, 0.92]], 0.025, 20), GOLD),
  )
}

// --- Coat, waistcoat and shirt -------------------------------------------------------------
function chest() {
  return grp(
    mesh(G.rbox(2.9, 1.5, 1.7, 0.1), COAT, { p: [0, 4.08, 0] }),
    // shoulders a little squared
    both((s) => mesh(G.rbox(0.7, 0.18, 1.72, 0.08), COAT, { p: [1.08 * s, 4.78, 0] })),
    // red waistcoat with gold buttons
    mesh(G.rbox(1.24, 1.46, 0.1, 0.04), VEST, { p: [0, 4.06, 0.86] }),
    rep(2, (i) => mesh(G.sphere(0.06, 10, 8), GOLD, { p: [0, 3.82 - i * 0.32, 0.93] })),
    // white shirt V and the frilly jabot
    mesh(G.extrude([[-0.44, 0], [0.44, 0], [0, -0.82]], 0.05, 0.01), SHIRT, { p: [0, 4.82, 0.915] }),
    rep(4, (i) => mesh(G.cone(0.17 + i * 0.035, 0.2, 14), SHIRT, { p: [0, 4.62 - i * 0.15, 0.98], s: [1, 1, 0.45] })),
    rep(4, (i) => mesh(G.torus(0.17 + i * 0.035, 0.018, PI * 2, 4, 16), M('#d8d4cc', { rough: 0.6 }), { p: [0, 4.52 - i * 0.15, 0.98], r: [PI / 2, 0, 0], s: [1, 0.45, 1] })),
    // the brooch: a big red gem in a gold setting
    mesh(G.cyl(0.15, 0.15, 0.06, 16), GOLD, { p: [0, 4.74, 1.04], r: [PI / 2, 0, 0] }),
    mesh(G.torus(0.15, 0.03, PI * 2, 6, 18), GOLD, { p: [0, 4.74, 1.07] }),
    mesh(G.ico(0.11, 1), GEM, { p: [0, 4.74, 1.1], s: [1, 1.15, 0.6] }),
    // satin lapels, angled out from the collar, with the notch
    both((s) => grp(
      mesh(G.extrude([[0, 0], [0.34, 0.02], [0.52, -0.3], [0.38, -0.42], [0.4, -0.5], [0.08, -1.1], [-0.02, -1.1]], 0.06, 0.015), SATIN, { s: [s, 1, 1] }),
      { p: [0.44 * s, 4.84, 0.93] },
    )),
    // coat fronts beside the waistcoat, a pocket square and a boutonniere stud
    both((s) => mesh(G.rbox(0.82, 1.46, 0.08, 0.03), COAT, { p: [1.04 * s, 4.06, 0.87] })),
    mesh(G.extrude([[-0.16, 0], [0.16, 0], [0.1, 0.12], [0.02, 0.06], [-0.06, 0.14]], 0.04, 0.01), RED, { p: [1.02, 4.42, 0.93] }),
    mesh(G.box(0.4, 0.04, 0.04), SATIN, { p: [1.02, 4.4, 0.92] }),
  )
}

function hips() {
  return grp(
    mesh(G.rbox(2.88, 1.05, 1.68, 0.08), COAT, { p: [0, 2.95, 0] }),
    // waistcoat point and buttons
    mesh(G.extrude([[-0.62, 0.52], [0.62, 0.52], [0.62, -0.2], [0, -0.5], [-0.62, -0.2]], 0.08, 0.02), VEST, { p: [0, 3.0, 0.85] }),
    mesh(G.sphere(0.06, 10, 8), GOLD, { p: [0, 3.14, 0.94] }),
    mesh(G.sphere(0.06, 10, 8), GOLD, { p: [0, 2.84, 0.94] }),
    // a watch chain looping to the pocket
    mesh(G.tube([[0, 3.14, 0.95], [0.25, 2.98, 0.96], [0.5, 3.02, 0.95]], 0.018, 10), GOLD),
    // coat fronts cut away toward the tails
    both((s) => mesh(G.extrude([[0, 0.52], [0.84, 0.52], [0.84, -0.52], [0.5, -0.52]], 0.08, 0.02), COAT, { p: [0.62 * s, 3.0, 0.86], s: [s, 1, 1] })),
    // trouser waist
    mesh(G.rbox(2.82, 0.44, 1.62, 0.08), COAT, { p: [0, 2.6, 0] }),
    // coat tails behind
    both((s) => mesh(G.rbox(0.66, 1.5, 0.08, 0.03), COAT, { p: [0.36 * s, 1.95, -0.86], r: [0.08, 0, 0.04 * s] })),
  )
}

// --- Arms ------------------------------------------------------------------------------------
function upperArm(s) {
  const x = 2.0 * s
  return grp(mesh(G.rbox(1.24, 1.28, 1.24, 0.14), COAT, { p: [x, 4.18, 0] }), mesh(G.rbox(1.26, 0.16, 1.26, 0.06), COAT, { p: [x, 3.6, 0] }))
}

function lowerArm(s) {
  const x = 2.0 * s
  return grp(
    mesh(G.rbox(1.22, 0.96, 1.22, 0.1), COAT, { p: [x, 3.12, 0] }),
    // red-lined turned-back cuff and the frilly shirt cuff
    mesh(G.rbox(1.28, 0.16, 1.28, 0.05), VEST, { p: [x, 2.68, 0] }),
    mesh(G.cyl(0.7, 0.55, 0.24, 16, true), M('#f4f2ee', { rough: 0.6, side: 2 }), { p: [x, 2.5, 0] }),
    mesh(G.torus(0.69, 0.035, PI * 2, 6, 20), M('#d8d4cc', { rough: 0.6 }), { p: [x, 2.39, 0], r: [PI / 2, 0, 0] }),
    // pale hand with dark nails and a signet ring
    mesh(G.rbox(0.8, 0.5, 0.82, 0.14), SKIN_D, { p: [x, 2.24, 0] }),
    mesh(G.rbox(0.3, 0.22, 0.24, 0.08), SKIN_D, { p: [x - 0.42 * s, 2.36, 0.3], r: [0, 0, 0.25 * s] }),
    rep(4, (i) => mesh(G.cone(0.06, 0.2, 8), NAIL, { p: [x, 1.92, -0.3 + i * 0.2], r: [PI, 0, 0] })),
    mesh(G.torus(0.12, 0.035, PI * 2, 6, 14), GOLD, { p: [x - 0.47 * s, 2.15, 0.25], r: [0, PI / 2, 0] }),
    mesh(G.sphere(0.06, 10, 8), GEM, { p: [x - 0.5 * s, 2.15, 0.25] }),
  )
}

// --- Legs ------------------------------------------------------------------------------------
function thigh(s) {
  const x = 0.7 * s
  return grp(
    mesh(G.rbox(1.4, 1.22, 1.5, 0.08), COAT, { p: [x, 1.84, 0] }),
    mesh(G.box(0.03, 1.2, 0.16), SATIN, { p: [x + 0.705 * s, 1.84, 0] }),
  )
}

function shin(s) {
  const x = 0.7 * s
  return grp(
    mesh(G.rbox(1.4, 0.86, 1.5, 0.08), COAT, { p: [x, 0.8, 0] }),
    mesh(G.box(0.03, 0.82, 0.16), SATIN, { p: [x + 0.705 * s, 0.82, 0] }),
    // shiny pointed shoes with a heel and a little gold buckle
    mesh(G.rbox(1.38, 0.4, 1.7, 0.16, 3), SHOE, { p: [x, 0.2, 0.12] }),
    grp(mesh(G.cone(0.5, 0.6, 16), SHOE, { s: [1.35, 1, 0.42] }), { p: [x, 0.17, 1.12], r: [PI / 2, 0, 0] }),
    mesh(G.rbox(1.42, 0.08, 1.74, 0.03), SOLE, { p: [x, 0.04, 0.12] }),
    mesh(G.rbox(1.0, 0.16, 0.32, 0.04), SOLE, { p: [x, 0.08, -0.5] }),
    mesh(G.rbox(0.36, 0.2, 0.06, 0.03), GOLD, { p: [x, 0.3, 0.98] }),
    mesh(G.box(0.22, 0.08, 0.07), SHOE, { p: [x, 0.3, 0.99] }),
  )
}

// --- Baking --------------------------------------------------------------------------------
// Every part is modelled from many small pieces; once built it is merged into one mesh per
// material (geometry cached per part), so the whole costume costs a few dozen draw calls.
const baked = new Map()
function bake(key, make) {
  let parts = baked.get(key)
  if (!parts) {
    const src = make()
    src.updateMatrixWorld(true)
    const byMat = new Map()
    src.traverse((m) => {
      if (!m.isMesh) return
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n)
      g.applyMatrix4(m.matrixWorld)
      if (m.matrixWorld.determinant() < 0) {
        // a mirrored piece: restore the triangle winding
        for (const a of Object.values(g.attributes)) {
          const s = a.itemSize
          const arr = a.array
          for (let i = 0; i < a.count; i += 3)
            for (let k = 0; k < s; k++) {
              const t = arr[(i + 1) * s + k]
              arr[(i + 1) * s + k] = arr[(i + 2) * s + k]
              arr[(i + 2) * s + k] = t
            }
        }
      }
      if (!byMat.has(m.material)) byMat.set(m.material, { geos: [], shadow: m.castShadow })
      byMat.get(m.material).geos.push(g)
    })
    parts = [...byMat].map(([mat, { geos, shadow }]) => ({ mat, shadow, geo: mergeGeometries(geos, false) }))
    for (const p of parts) p.geo.computeBoundingSphere()
    baked.set(key, parts)
  }
  const out = new Group()
  for (const p of parts) {
    const m = new Mesh(p.geo, p.mat)
    m.castShadow = p.shadow
    m.receiveShadow = p.shadow
    out.add(m)
  }
  return out
}

export function build(c) {
  c.on('Neck1', bake('vampire:head', () => head()))
  c.on('Spine2', bake('vampire:chest', () => chest()))
  c.on('Spine2', bake('vampire:collar', () => collar()))
  c.on('Spine2', bake('vampire:cape', () => cape()))
  c.on('Spine1', bake('vampire:hips', () => hips()))
  c.on('ArmL1', bake('vampire:upperArm1', () => upperArm(1)))
  c.on('ArmR1', bake('vampire:upperArm-1', () => upperArm(-1)))
  c.on('ArmL2', bake('vampire:lowerArm1', () => lowerArm(1)))
  c.on('ArmR2', bake('vampire:lowerArm-1', () => lowerArm(-1)))
  c.on('LegL1', bake('vampire:thigh1', () => thigh(1)))
  c.on('LegR1', bake('vampire:thigh-1', () => thigh(-1)))
  c.on('LegL2', bake('vampire:shin1', () => shin(1)))
  c.on('LegR2', bake('vampire:shin-1', () => shin(-1)))
}

// Cape swept open: the left arm raised to the side, the right hand clawing forward.
export const pose = {
  ArmL1: { x: -0.2, z: 0.5 },
  ArmL2: { x: -0.5 },
  ArmR1: { x: -0.25, z: -0.3 },
  ArmR2: { x: -0.45 },
}
export const cardYaw = -0.12
