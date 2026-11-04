// Ghost (Common): a floating white-blue sheet ghost. A rounded dome head melts into a
// sheet that flares to a wavy, ragged hem just above the ground (no legs: the sheet
// hides them), sleeve arms with drooping ragged cuffs, big black oval eyes and an open
// "Oooo" mouth. A solid inner sheet carries a faint pale glow; a thin translucent
// outer layer gives it the misty edge.
import { Group, Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { G, M, grp, mesh, rep } from '../models/kit.js'

const PI = Math.PI
const SHEET = M('#eaf0ff', { rough: 0.85, emissive: '#a8c2fa', glow: 0.2, side: 2 })
const SHADE = M('#c9d5f4', { rough: 0.9, emissive: '#8eaaf0', glow: 0.18, side: 2 })
const MIST = M('#d8e6ff', { rough: 0.4, emissive: '#9cbcff', glow: 0.35, opacity: 0.28, side: 2 })
const INK = M('#101018', { rough: 0.35 })
const MOUTH = M('#1a1220', { rough: 0.5 })
const TONGUE = M('#5a6a9a', { rough: 0.6 })
const SHINE = M('#ffffff', { rough: 0.1, emissive: '#ffffff', glow: 0.6 })
const BLUSH = M('#c9d6ff', { rough: 0.9, emissive: '#9fb4ff', glow: 0.25 })

// A tongue-shaped flap outline (top edge at y 0, rounded tip at y -h), for ragged hems.
const tongue = (w, h, n = 8) => {
  const pts = [[-w / 2, 0], [w / 2, 0]]
  const r = w / 2
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * PI // right side round to left side
    pts.push([Math.cos(a) * r, -h + r - Math.sin(a) * r])
  }
  return pts
}

// Point on the sphere head's surface for a face feature, turned to face outward.
const HEAD_C = [0, 5.5, 0]
const HEAD_R = 1.08
const onHead = (x, y, lift = 0) => {
  const dx = x
  const dy = y - HEAD_C[1]
  const z = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - dx * dx - dy * dy)) * 0.96 + lift
  return { p: [x, y, z], r: [-Math.atan2(dy, z), Math.atan2(dx, z), 0] }
}

function head() {
  const eye = (s) => {
    const a = onHead(0.38 * s, 5.68, -0.02)
    const hl = onHead(0.31 * s, 5.86, 0.03)
    const hl2 = onHead(0.45 * s, 5.5, 0.03)
    return grp(
      mesh(G.sphere(0.25, 20, 14), INK, { p: a.p, r: a.r, s: [0.82, 1.25, 0.32] }),
      mesh(G.sphere(0.075, 12, 8), SHINE, { p: hl.p, r: hl.r, s: [1, 1.2, 0.4] }),
      mesh(G.sphere(0.035, 10, 6), SHINE, { p: hl2.p, r: hl2.r, s: [1, 1, 0.4] }),
    )
  }
  const mouth = onHead(0, 5.06, -0.02)
  const tongueP = onHead(0, 4.96, 0.0)
  const blush = (s) => {
    const b = onHead(0.66 * s, 5.2, -0.01)
    return mesh(G.sphere(0.16, 14, 10), BLUSH, { p: b.p, r: b.r, s: [1.2, 0.6, 0.3] })
  }
  const brow = (s) => {
    const b = onHead(0.4 * s, 6.12, 0)
    return mesh(G.capsule(0.035, 0.26, 6), SHADE, { p: b.p, r: [b.r[0], b.r[1], (PI / 2) + 0.35 * s] })
  }
  return grp(
    // dome head, a touch taller than wide, melting into the shoulders below
    mesh(G.sphere(HEAD_R, 24, 18), SHEET, { p: HEAD_C, s: [1, 1.04, 0.96] }),
    mesh(G.sphere(HEAD_R * 1.05, 20, 14), MIST, { p: HEAD_C, s: [1, 1.04, 0.96], shadow: false }),
    // the little peak where the sheet is pinched on top
    mesh(G.cone(0.2, 0.32, 14), SHEET, { p: [0.04, 6.58, -0.05], r: [-0.25, 0, -0.2] }),
    mesh(G.sphere(0.12, 12, 8), SHEET, { p: [0.12, 6.76, -0.12] }),
    eye(1),
    eye(-1),
    brow(1),
    brow(-1),
    blush(1),
    blush(-1),
    mesh(G.sphere(0.17, 18, 12), MOUTH, { p: mouth.p, r: mouth.r, s: [0.95, 1.25, 0.32] }),
    mesh(G.sphere(0.09, 12, 8), TONGUE, { p: tongueP.p, r: tongueP.r, s: [1.2, 0.6, 0.3] }),
  )
}

// The upper sheet (shoulders and chest) around Spine2.
function chest() {
  const prof = [
    [1.52, 3.15],
    [1.55, 3.6],
    [1.52, 4.05],
    [1.4, 4.45],
    [1.12, 4.8],
    [0.8, 5.0],
    [0.5, 5.1],
  ]
  return grp(
    mesh(G.lathe(prof, 28), SHEET, { s: [1, 1, 0.78] }),
    mesh(G.lathe(prof.map(([r, y]) => [r * 1.04, y]), 24), MIST, { s: [1, 1, 0.8], shadow: false }),
    // drapes falling from the shoulders over the chest
    ...[-0.75, 0.75].map((x) => mesh(G.tube([[x, 4.75, 0.82], [x * 1.1, 4.2, 1.15], [x * 1.12, 3.5, 1.22]], 0.06, 12), SHADE)),
    mesh(G.tube([[0, 4.95, 0.62], [0, 4.4, 1.06], [0, 3.5, 1.2]], 0.05, 12), SHADE),
  )
}

// The lower sheet: hips down to the ragged hem, around Spine1.
function skirt() {
  const prof = [
    [2.0, 0.62],
    [1.98, 0.8],
    [1.88, 1.3],
    [1.74, 1.9],
    [1.62, 2.5],
    [1.55, 3.0],
    [1.52, 3.5],
  ]
  const sz = 0.82
  const n = 14
  const r0 = 1.97
  const flapLong = G.extrude(tongue(1.0, 0.62), 0.05, 0.02)
  const flapShort = G.extrude(tongue(0.9, 0.44), 0.05, 0.02)
  // flaps on an ellipse: position and outward normal
  const ring = (ang, r, y, geo, mat, flare) => {
    const x = Math.sin(ang) * r
    const z = Math.cos(ang) * r * sz
    const nAng = Math.atan2(Math.sin(ang) / 1, Math.cos(ang) / sz)
    return grp(mesh(geo, mat, { r: [-flare, 0, 0] }), { p: [x, y, z], r: [0, nAng, 0] })
  }
  return grp(
    mesh(G.lathe(prof, 32), SHEET, { s: [1, 1, sz] }),
    mesh(G.lathe(prof.map(([r, y]) => [r * 1.035, y + 0.02]), 28), MIST, { s: [1, 1, sz + 0.01], shadow: false }),
    // ragged hem: long and short tongues alternating, slightly flared
    rep(n, (i) => ring(((i + 0.5) / n) * PI * 2, r0, 0.72, i % 2 ? flapShort : flapLong, i % 2 ? SHADE : SHEET, 0.22)),
    rep(n, (i) => ring((i / n) * PI * 2, r0 - 0.04, 0.74, flapShort, SHEET, 0.16)),
    // soft vertical folds down the sheet
    rep(10, (i) => {
      const a = ((i + 0.3) / 10) * PI * 2
      const pt = (r, y) => [Math.sin(a) * (r + 0.03), y, Math.cos(a) * (r + 0.03) * sz]
      return mesh(G.tube([pt(1.53, 3.2), pt(1.63, 2.4), pt(1.8, 1.5), pt(1.97, 0.75)], 0.05, 12), SHADE)
    }),
  )
}

// Sleeve arms: a puffy upper sleeve and a widening lower sleeve that droops into rags.
function upperSleeve(s) {
  const x = 2.0 * s
  return grp(
    mesh(G.capsule(0.56, 0.5, 16), SHEET, { p: [x, 4.2, 0] }),
    mesh(G.capsule(0.6, 0.5, 14), MIST, { p: [x, 4.2, 0], shadow: false }),
    // fold where the sleeve meets the shoulder
    mesh(G.torus(0.52, 0.05, PI * 2, 6, 20), SHADE, { p: [x - 0.05 * s, 4.42, 0], r: [PI / 2, 0.25 * s, 0] }),
  )
}

function lowerSleeve(s) {
  const x = 2.0 * s
  const cuff = G.lathe([[0.82, 2.55], [0.74, 2.85], [0.62, 3.3], [0.56, 3.75]], 20)
  const rag = G.extrude(tongue(0.5, 0.55), 0.04, 0.015)
  const ragS = G.extrude(tongue(0.42, 0.36), 0.04, 0.015)
  return grp(
    mesh(cuff, SHEET, { p: [x, 0, 0] }),
    mesh(G.lathe([[0.86, 2.6], [0.78, 2.9], [0.66, 3.35], [0.6, 3.7]], 18), MIST, { p: [x, 0, 0], shadow: false }),
    // the sheet closes over the hand in a soft rounded end
    mesh(G.sphere(0.76, 20, 12), SHEET, { p: [x, 2.72, 0], s: [1, 0.55, 1] }),
    mesh(G.sphere(0.8, 18, 10), MIST, { p: [x, 2.72, 0], s: [1, 0.58, 1], shadow: false }),
    // drooping ragged ends hanging below the cuff, longest at the back and outer side
    rep(8, (i) => {
      const a = (i / 8) * PI * 2
      const long = i % 2 === 0
      return grp(mesh(long ? rag : ragS, long ? SHEET : SHADE, { r: [-0.18, 0, 0] }), {
        p: [x + Math.sin(a) * 0.78, 2.62, Math.cos(a) * 0.78],
        r: [0, a, 0],
      })
    }),
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
  c.on('Neck1', bake('ghost:head', () => head()))
  c.on('Spine2', bake('ghost:chest', () => chest()))
  c.on('Spine1', bake('ghost:skirt', () => skirt()))
  c.on('ArmL1', bake('ghost:upperSleeve1', () => upperSleeve(1)))
  c.on('ArmR1', bake('ghost:upperSleeve-1', () => upperSleeve(-1)))
  c.on('ArmL2', bake('ghost:lowerSleeve1', () => lowerSleeve(1)))
  c.on('ArmR2', bake('ghost:lowerSleeve-1', () => lowerSleeve(-1)))
}

// Spooky "boo" arms: both raised forward, the sleeve ends drooping.
export const pose = {
  ArmL1: { x: -1.2, z: 0.1 },
  ArmR1: { x: -1.25, z: -0.1 },
  ArmL2: { x: 0.65 },
  ArmR2: { x: 0.6 },
}
export const cardYaw = -0.22
