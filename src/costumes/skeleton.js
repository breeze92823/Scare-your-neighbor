// Skeleton (Uncommon): a see-through ivory bone skeleton. No flesh behind it, the gaps
// are the point: a chunky skull (cranium, deep eye sockets, nasal hole, cheekbones,
// teeth and a jaw), the vertebra column, a ribcage of curved ribs around a sternum,
// shoulder blades and collarbones, a pelvis, and limb bones down to the finger and
// toe bones.
import { Group, Mesh, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const BONE = M('#efe6cc', { rough: 0.55 })
const BONE2 = M('#ddd0ae', { rough: 0.6 })
const JOINT = M('#c9b88f', { rough: 0.65 })
const TOOTH = M('#fbf6e6', { rough: 0.3 })
const VOID = M('#1b140f', { rough: 0.9 })
const EMBER = M('#ff9a3a', { rough: 0.4, emissive: '#ff7a1a', glow: 0.9 })

// Straight bone between two points, as a cylinder (r0 at a, r1 at b).
const UP = new Vector3(0, 1, 0)
function bone(a, b, r0, r1 = r0, mat = BONE, seg = 12) {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const len = d.length()
  const m = mesh(G.cyl(r1, r0, len, seg), mat, { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] })
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

// A long bone with knobbly ends (epiphyses).
const longBone = (a, b, r, knobA = r * 1.7, knobB = r * 1.7, mat = BONE) =>
  grp(bone(a, b, r, r * 0.92, mat), mesh(G.sphere(knobA, 14, 10), mat, { p: a, s: [1.15, 0.8, 1] }), mesh(G.sphere(knobB, 14, 10), mat, { p: b, s: [1.15, 0.8, 1] }))

// --- Skull -------------------------------------------------------------------------------
const skullTex = () =>
  tex('skeleton:face', 256, 192, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    // eye sockets: deep, soft-edged
    for (const cx of [70, 186]) {
      const g = x.createRadialGradient(cx, 84, 8, cx, 84, 54)
      g.addColorStop(0, '#0d0907')
      g.addColorStop(0.62, '#1f1610')
      g.addColorStop(0.8, 'rgba(70,52,34,0.55)')
      g.addColorStop(1, 'rgba(120,100,70,0)')
      x.fillStyle = g
      x.beginPath()
      x.ellipse(cx, 84, 52, 48, 0, 0, PI * 2)
      x.fill()
    }
    // nasal hole: an upside-down heart
    x.fillStyle = '#140e0a'
    x.beginPath()
    x.moveTo(128, 120)
    x.quadraticCurveTo(112, 134, 114, 156)
    x.quadraticCurveTo(122, 166, 128, 158)
    x.quadraticCurveTo(134, 166, 142, 156)
    x.quadraticCurveTo(144, 134, 128, 120)
    x.fill()
    // cracks and suture lines
    x.strokeStyle = 'rgba(90,70,45,0.75)'
    x.lineWidth = 3
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(200, 4)
    x.lineTo(206, 18)
    x.lineTo(196, 30)
    x.lineTo(204, 40)
    x.moveTo(206, 18)
    x.lineTo(222, 22)
    x.moveTo(40, 6)
    x.lineTo(48, 20)
    x.lineTo(44, 28)
    x.stroke()
    // ivory grime
    x.fillStyle = 'rgba(150,125,85,0.18)'
    for (let i = 0; i < 28; i++) {
      const px = (i * 73) % w
      const py = (i * 41) % h
      x.beginPath()
      x.arc(px, py, 3 + (i % 4), 0, PI * 2)
      x.fill()
    }
  })

function skull() {
  const teeth = (y, z, n, w, h, mat) =>
    rep(n, (i) => mesh(G.rbox(w, h, 0.12, 0.03), mat, { p: [-((n - 1) * (w + 0.02)) / 2 + i * (w + 0.02), y, z], r: [0, 0, (i % 3 - 1) * 0.04] }))
  return grp(
    // cranium: a rounded block, flat face front for the sockets
    mesh(G.rbox(1.62, 1.28, 1.62, 0.5, 4), BONE, { p: [0, 5.88, -0.02] }),
    // back of the head bulge (occipital)
    mesh(G.sphere(0.7, 18, 12), BONE, { p: [0, 5.92, -0.38], s: [1.05, 0.9, 0.8] }),
    // temple ridges on the sides
    both((s) => mesh(G.rbox(0.12, 0.6, 0.9, 0.05), BONE2, { p: [0.8 * s, 5.75, 0.0] })),
    // brow ridge over the sockets
    mesh(G.rbox(1.42, 0.16, 0.22, 0.07), BONE, { p: [0, 6.08, 0.71] }),
    // sockets, nose and cracks painted on the front face
    decal(skullTex(), 1.42, 1.06, { p: [0, 5.78, 0.795] }),
    // a faint ember deep in each socket
    both((s) => mesh(G.sphere(0.07, 10, 8), EMBER, { p: [0.36 * s, 5.83, 0.72], shadow: false })),
    // cheekbones (zygomatic arches)
    both((s) => grp(
      mesh(G.rbox(0.42, 0.24, 0.5, 0.1), BONE, { p: [0.54 * s, 5.4, 0.54] }),
      mesh(G.rbox(0.16, 0.18, 0.6, 0.06), BONE2, { p: [0.72 * s, 5.4, 0.12] }),
    )),
    // upper jaw (maxilla) and its teeth
    mesh(G.rbox(1.08, 0.36, 0.95, 0.14), BONE, { p: [0, 5.2, 0.27] }),
    teeth(5.0, 0.72, 7, 0.12, 0.17, TOOTH),
    // jaw hinge and the dropped mandible with its teeth
    both((s) => mesh(G.rbox(0.2, 0.62, 0.34, 0.08), BONE2, { p: [0.52 * s, 5.02, -0.08], r: [0.15, 0, 0] })),
    mesh(G.rbox(1.06, 0.24, 0.98, 0.1), BONE, { p: [0, 4.74, 0.24] }),
    mesh(G.rbox(0.42, 0.16, 0.2, 0.06), BONE2, { p: [0, 4.66, 0.7] }),
    teeth(4.89, 0.68, 6, 0.12, 0.13, TOOTH),
    // the dark mouth gap behind the teeth
    mesh(G.box(0.86, 0.22, 0.1), VOID, { p: [0, 4.95, 0.58] }),
    // neck vertebrae under the skull
    rep(2, (i) => vertebra(4.6 - i * 0.22, -0.2, 0.85)),
  )
}

// One vertebra: a disc with a spike pointing backwards and two side wings.
function vertebra(y, z, k = 1) {
  return grp(
    mesh(G.cyl(0.17 * k, 0.17 * k, 0.15, 12), BONE, { p: [0, y, z] }),
    mesh(G.rbox(0.12 * k, 0.1, 0.32 * k, 0.04), BONE2, { p: [0, y - 0.02, z - 0.24 * k], r: [-0.35, 0, 0] }),
    mesh(G.rbox(0.48 * k, 0.07, 0.1, 0.03), BONE2, { p: [0, y, z - 0.08] }),
    mesh(G.cyl(0.13 * k, 0.13 * k, 0.06, 10), JOINT, { p: [0, y - 0.11, z] }),
  )
}

// --- Chest: ribcage, sternum, collarbones, shoulder blades (Spine2) -------------------------
function chest() {
  const rib = (s, y, w, drop) =>
    mesh(
      G.tube(
        [
          [0.16 * s, y, -0.5],
          [0.7 * w * s, y + 0.03, -0.56],
          [1.18 * w * s, y - 0.06 * drop, -0.12],
          [1.08 * w * s, y - 0.18 * drop, 0.34],
          [0.62 * w * s, y - 0.3 * drop, 0.6],
          [0.18 * s, y - 0.36 * drop, 0.66],
        ],
        0.07,
        24,
      ),
      BONE,
    )
  const ribs = [
    [4.45, 0.82, 0.7],
    [4.2, 0.95, 0.85],
    [3.95, 1.0, 1],
    [3.7, 1.0, 1],
    [3.45, 0.96, 1],
    [3.2, 0.88, 0.9],
  ]
  return grp(
    // spine column through the chest
    rep(7, (i) => vertebra(4.62 - i * 0.24, -0.48)),
    ...ribs.map(([y, w, d]) => both((s) => rib(s, y, w, d))),
    // floating lowest ribs (not joined at the front)
    both((s) => mesh(G.tube([[0.16 * s, 3.0, -0.5], [0.8 * s, 2.98, -0.52], [1.02 * s, 2.9, -0.15], [0.86 * s, 2.82, 0.12]], 0.06, 14), BONE2)),
    // sternum: manubrium + body + the pointy tip
    mesh(G.rbox(0.42, 0.34, 0.14, 0.06), BONE, { p: [0, 4.4, 0.68] }),
    mesh(G.rbox(0.28, 1.0, 0.13, 0.06), BONE, { p: [0, 3.72, 0.7] }),
    mesh(G.cone(0.1, 0.2, 10), BONE2, { p: [0, 3.12, 0.7], r: [PI, 0, 0] }),
    // cartilage studs where the ribs meet the sternum
    rep(5, (i) => mesh(G.box(0.4, 0.05, 0.08), JOINT, { p: [0, 4.2 - i * 0.24, 0.72] })),
    // collarbones to the shoulders
    both((s) => mesh(G.tube([[0.18 * s, 4.58, 0.62], [0.8 * s, 4.72, 0.5], [1.42 * s, 4.7, 0.24], [1.66 * s, 4.66, 0.28]], 0.07, 16), BONE)),
    // shoulder blades on the back
    both((s) => mesh(G.extrude([[0, 0.38], [0.5, 0.42], [0.36, -0.1], [0.08, -0.5]], 0.07, 0.03), BONE2, { p: [0.5 * s, 4.3, -0.66], s: [s, 1, 1] })),
    both((s) => mesh(G.rbox(0.56, 0.08, 0.1, 0.03), BONE, { p: [0.8 * s, 4.58, -0.7], r: [0, 0, -0.1 * s] })),
  )
}

// --- Hips: lumbar spine + pelvis (Spine1) --------------------------------------------------
function hips() {
  return grp(
    rep(4, (i) => vertebra(3.32 - i * 0.24, -0.42, 1.1)),
    // sacrum
    mesh(G.rbox(0.5, 0.5, 0.26, 0.1), BONE2, { p: [0, 2.42, -0.4], r: [0.25, 0, 0] }),
    mesh(G.cone(0.12, 0.25, 10), BONE2, { p: [0, 2.08, -0.48], r: [PI - 0.3, 0, 0] }),
    // iliac wings, flaring up and out
    both((s) => grp(
      mesh(G.extrude([[-0.05, -0.3], [0.3, -0.32], [0.62, 0.0], [0.62, 0.28], [0.3, 0.42], [-0.04, 0.2]], 0.12, 0.05), BONE, {
        r: [0, -0.55 * s, 0.12 * s],
        s: [s, 1, 1],
      }),
      { p: [0.3 * s, 2.62, -0.2] },
    )),
    // the front pubic arch and the hip sockets
    mesh(G.torus(0.34, 0.08, PI, 10, 18), BONE, { p: [0, 2.46, 0.3], r: [0.3, 0, PI] }),
    both((s) => mesh(G.sphere(0.2, 14, 10), JOINT, { p: [0.62 * s, 2.36, 0.02] })),
  )
}

// --- Arms ------------------------------------------------------------------------------------
function upperArm(s) {
  const x = 2.0 * s
  return grp(
    mesh(G.sphere(0.3, 16, 12), BONE, { p: [1.9 * s, 4.6, 0.3] }),
    longBone([x, 4.42, 0.3], [x, 3.74, 0.3], 0.13, 0.2, 0.18),
  )
}

function lowerArm(s) {
  const x = 2.0 * s
  const finger = (z, len) => {
    const top = [x, 2.42, z + 0.3]
    const mid = [x + 0.03 * s, 2.42 - len * 0.55, z + 0.31]
    const tip = [x + 0.06 * s, 2.42 - len, z + 0.32]
    return grp(
      bone(top, mid, 0.045, 0.042),
      mesh(G.sphere(0.055, 8, 6), JOINT, { p: mid }),
      bone(mid, tip, 0.04, 0.03),
      mesh(G.sphere(0.04, 8, 6), BONE, { p: tip }),
    )
  }
  return grp(
    // elbow knob, radius and ulna
    mesh(G.sphere(0.19, 14, 10), JOINT, { p: [x, 3.6, 0.3] }),
    longBone([x - 0.08 * s, 3.5, 0.38], [x - 0.06 * s, 2.86, 0.4], 0.075, 0.1, 0.1),
    longBone([x + 0.08 * s, 3.5, 0.22], [x + 0.08 * s, 2.86, 0.24], 0.07, 0.12, 0.09, BONE2),
    // wrist (carpals) and the palm (metacarpals)
    mesh(G.rbox(0.3, 0.14, 0.38, 0.06), BONE, { p: [x, 2.76, 0.32] }),
    rep(4, (i) => bone([x, 2.7, 0.15 + i * 0.1], [x, 2.44, 0.14 + i * 0.105], 0.035)),
    rep(4, (i) => mesh(G.sphere(0.05, 8, 6), JOINT, { p: [x, 2.43, 0.14 + i * 0.105] })),
    finger(-0.16, 0.3, 0),
    finger(-0.055, 0.36, 1),
    finger(0.05, 0.38, 2),
    finger(0.155, 0.33, 3),
    // thumb, angled forward
    bone([x, 2.7, 0.48], [x - 0.02 * s, 2.5, 0.62], 0.04),
    mesh(G.sphere(0.05, 8, 6), JOINT, { p: [x - 0.02 * s, 2.5, 0.62] }),
    bone([x - 0.02 * s, 2.5, 0.62], [x - 0.03 * s, 2.34, 0.7], 0.035, 0.03),
  )
}

// --- Legs ------------------------------------------------------------------------------------
function thigh(s) {
  const x = 0.7 * s
  return grp(
    // femur head angled into the hip socket, shaft, and the two condyles above the knee
    bone([0.62 * s, 2.34, 0.02], [x, 2.12, 0], 0.11),
    longBone([x, 2.12, 0], [x, 1.42, 0.02], 0.13, 0.17, 0.16),
    both((t) => mesh(G.sphere(0.13, 12, 8), BONE, { p: [x + 0.11 * t, 1.33, 0.02] })),
  )
}

function shin(s) {
  const x = 0.7 * s
  return grp(
    // kneecap
    mesh(G.sphere(0.15, 14, 10), BONE, { p: [x, 1.22, 0.2], s: [1, 1.1, 0.6] }),
    // tibia (thick) + fibula (thin, outside)
    mesh(G.rbox(0.42, 0.14, 0.36, 0.06), BONE2, { p: [x, 1.12, 0.02] }),
    longBone([x - 0.04 * s, 1.08, 0.04], [x - 0.02 * s, 0.38, 0.04], 0.11, 0.13, 0.13),
    longBone([x + 0.16 * s, 1.02, -0.06], [x + 0.15 * s, 0.4, -0.04], 0.05, 0.07, 0.07, BONE2),
    // ankle, heel, tarsals, metatarsals and toes
    mesh(G.sphere(0.16, 12, 8), JOINT, { p: [x, 0.32, 0.02] }),
    mesh(G.rbox(0.26, 0.2, 0.34, 0.08), BONE, { p: [x, 0.13, -0.14] }),
    mesh(G.rbox(0.44, 0.16, 0.36, 0.06), BONE, { p: [x, 0.18, 0.18] }),
    rep(5, (i) => {
      const tx = x - 0.18 + i * 0.09
      return grp(
        bone([tx, 0.14, 0.32], [tx, 0.06, 0.64], 0.035),
        mesh(G.sphere(0.045, 8, 6), JOINT, { p: [tx, 0.06, 0.64] }),
        bone([tx, 0.06, 0.64], [tx, 0.04, 0.78 - Math.abs(i - 1.5) * 0.03], 0.03),
      )
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
  c.on('Neck1', bake('skeleton:skull', () => skull()))
  c.on('Spine2', bake('skeleton:chest', () => chest()))
  c.on('Spine1', bake('skeleton:hips', () => hips()))
  c.on('ArmL1', bake('skeleton:upperArm1', () => upperArm(1)))
  c.on('ArmR1', bake('skeleton:upperArm-1', () => upperArm(-1)))
  c.on('ArmL2', bake('skeleton:lowerArm1', () => lowerArm(1)))
  c.on('ArmR2', bake('skeleton:lowerArm-1', () => lowerArm(-1)))
  c.on('LegL1', bake('skeleton:thigh1', () => thigh(1)))
  c.on('LegR1', bake('skeleton:thigh-1', () => thigh(-1)))
  c.on('LegL2', bake('skeleton:shin1', () => shin(1)))
  c.on('LegR2', bake('skeleton:shin-1', () => shin(-1)))
}

// A spooky little wave: right hand up, head cocked.
export const pose = {
  Neck1: { z: 0.1 },
  ArmR1: { x: -0.3, z: -0.5 },
  ArmR2: { x: -1.3 },
  ArmL1: { x: 0.1, z: 0.2 },
}
