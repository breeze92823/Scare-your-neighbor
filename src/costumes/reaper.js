// Grim Reaper (Divine): a tall black hooded robe, the deep hood framing a skull with
// glowing cyan eye points; a layered robe and ragged mantle, a rope belt with an
// hourglass, a ragged hem split front / back with matching shards on the legs, wide
// tattered sleeves with skeletal hands, and a big scythe in the right hand.
import { Group, Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'
import { bake } from '../bake.js'

const PI = Math.PI
// Rounded boxes with 2 bevel segments: ~half the triangles of the default.
const rb = (w, h, d, r) => G.rbox(w, h, d, r, 2)
const deg = (d) => (d * PI) / 180
const UP = new Vector3(0, 1, 0)

const C = {
  robe: '#292835',
  robeLt: '#44425a',
  robeDk: '#15141c',
  hollow: '#050508',
  bone: '#ddd6c4',
  boneDk: '#b9b09a',
  eye: '#8ff4ff',
  rope: '#6e5a3c',
  wood: '#3a2618',
  wrap: '#5c3d24',
  steel: '#aab4be',
  steelDk: '#5d6670',
}

let seed = 3
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

// A ragged cloth shard: a flat triangle hanging down from its top edge (in XY, facing +Z).
const shardGeo = (w, h) => G.extrude([[-w / 2, 0], [w / 2, 0], [w * 0.12, -h], [-w * 0.05, -h * 0.85]], 0.05)
// A row of shards along a line from a to b (x, z) at height y, facing `yaw`.
function hem(n, a, b, y, yaw, hMin, hMax, mats) {
  const g = new Group()
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const w = (Math.hypot(b[0] - a[0], b[1] - a[1]) / n) * 1.5
    g.add(mesh(shardGeo(w, hMin + rnd() * (hMax - hMin)), mats[i % mats.length], { p: [a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t], r: [0.05 * (rnd() - 0.5), yaw, (rnd() - 0.5) * 0.25] }))
  }
  return g
}
// Ragged hem all around a box footprint (cx, cz, half sizes hx, hz).
function hemBox(cx, cz, hx, hz, y, hMin, hMax, mats, sides = 'fblr') {
  const g = new Group()
  if (sides.includes('f')) g.add(hem(Math.round(hx * 5), [cx - hx, cz + hz], [cx + hx, cz + hz], y, 0, hMin, hMax, mats))
  if (sides.includes('b')) g.add(hem(Math.round(hx * 5), [cx + hx, cz - hz], [cx - hx, cz - hz], y, PI, hMin, hMax, mats))
  if (sides.includes('l')) g.add(hem(Math.round(hz * 5), [cx + hx, cz + hz], [cx + hx, cz - hz], y, PI / 2, hMin, hMax, mats))
  if (sides.includes('r')) g.add(hem(Math.round(hz * 5), [cx - hx, cz - hz], [cx - hx, cz + hz], y, -PI / 2, hMin, hMax, mats))
  return g
}
function seg(a, b, r0, r1, mat, n = 8) {
  const A = new Vector3(...a)
  const B = new Vector3(...b)
  const m = mesh(G.cyl(r1, r0, A.distanceTo(B), n), mat)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize())
  return m
}

const skullTex = () =>
  tex('reaper-skull', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    // cheek hollows
    x.fillStyle = 'rgba(90,80,60,0.35)'
    for (const s of [-1, 1]) {
      x.beginPath()
      x.ellipse(128 + s * 70, 160, 24, 30, 0, 0, PI * 2)
      x.fill()
    }
    // eye sockets
    for (const s of [-1, 1]) {
      const g = x.createRadialGradient(128 + s * 50, 100, 6, 128 + s * 50, 100, 38)
      g.addColorStop(0, '#000000')
      g.addColorStop(0.7, '#0b0a0c')
      g.addColorStop(1, 'rgba(20,18,16,0)')
      x.fillStyle = g
      x.beginPath()
      x.ellipse(128 + s * 50, 100, 38, 34, s * 0.2, 0, PI * 2)
      x.fill()
    }
    // nose cavity
    x.fillStyle = '#0b0a0c'
    x.beginPath()
    x.moveTo(128, 128)
    x.lineTo(112, 162)
    x.quadraticCurveTo(128, 170, 144, 162)
    x.closePath()
    x.fill()
    // teeth
    x.fillStyle = '#1a1612'
    x.fillRect(66, 196, 124, 40)
    x.fillStyle = '#e8e2d2'
    for (let i = 0; i < 8; i++) {
      x.fillRect(69 + i * 15.2, 199, 12, 15)
      x.fillRect(69 + i * 15.2, 218, 12, 15)
    }
    // cracks
    x.strokeStyle = 'rgba(40,30,20,0.75)'
    x.lineWidth = 2.5
    x.beginPath()
    x.moveTo(170, 4)
    x.lineTo(160, 28)
    x.lineTo(172, 44)
    x.lineTo(164, 62)
    x.moveTo(160, 28)
    x.lineTo(146, 36)
    x.stroke()
  })

// The scythe in its own frame: grip at the origin, handle along +Y.
function scythe() {
  const wood = M(C.wood, { rough: 0.75 })
  const wrap = M(C.wrap, { rough: 0.85 })
  const steel = M(C.steel, { rough: 0.3, metal: 0.8 })
  const steelDk = M(C.steelDk, { rough: 0.4, metal: 0.8 })
  const edge = M('#eef6ff', { rough: 0.15, metal: 0.9 })
  const g = new Group()
  const handle = [[0, -2.05, 0], [0.04, -0.8, 0], [0, 0.6, 0.02], [-0.07, 2.2, 0], [-0.1, 3.4, -0.03], [-0.05, 4.3, 0]]
  g.add(mesh(G.tube(handle, 0.085, 40), wood))
  // leather wraps (grip + upper hand)
  for (const [y, n] of [
    [-0.25, 5],
    [2.0, 4],
  ])
    for (let i = 0; i < n; i++) g.add(mesh(G.torus(0.1, 0.03, PI * 2, 6, 14), wrap, { p: [y > 1 ? -0.07 : 0.02, y + i * 0.1, 0], r: [PI / 2 + 0.2, 0, 0] }))
  g.add(mesh(G.cyl(0.095, 0.095, 0.55, 12), wrap, { p: [0.02, -0.05, 0] }))
  // pommel spike + collar
  g.add(mesh(G.cyl(0.12, 0.1, 0.16, 12), steelDk, { p: [0.04, -2.05, 0] }))
  g.add(mesh(G.cone(0.1, 0.35, 12), steel, { p: [0.04, -2.3, 0], r: [PI, 0, 0] }))
  g.add(mesh(G.cyl(0.13, 0.13, 0.36, 14), steelDk, { p: [-0.05, 4.22, 0] }))
  g.add(mesh(G.torus(0.13, 0.03, PI * 2, 6, 16), steel, { p: [-0.05, 4.05, 0], r: [PI / 2, 0, 0] }))
  g.add(mesh(G.sphere(0.13, 12, 10), steel, { p: [-0.05, 4.45, 0] }))
  // crescent blade (in its XY plane, pointing +X), turned across the front
  const outer = [[0, 0.25], [0.5, 0.55], [1.0, 0.7], [1.5, 0.65], [1.95, 0.42], [2.3, 0.04], [2.55, -0.45], [2.66, -0.98]]
  const inner = [[2.42, -0.55], [2.12, -0.2], [1.74, 0.06], [1.3, 0.18], [0.82, 0.15], [0.38, 0.0], [0, -0.2]]
  const blade = new Group()
  blade.add(mesh(G.extrude([...outer, ...inner], 0.06, 0.02), steel))
  blade.add(mesh(G.tube(outer.map(([x, y]) => [x, y, 0]), 0.055, 24), steelDk))
  blade.add(mesh(G.tube(inner.map(([x, y]) => [x, y - 0.035, 0]), 0.02, 24), edge))
  blade.add(mesh(rb(0.42, 0.62, 0.16, 0.05), steelDk, { p: [0.02, 0.02, 0] }))
  blade.add(rep(2, (i) => mesh(G.cyl(0.04, 0.04, 0.2, 8), steel, { p: [0.05, -0.12 + i * 0.26, 0], r: [PI / 2, 0, 0] })))
  blade.position.set(-0.05, 4.2, 0)
  blade.rotation.set(0, deg(-32), deg(4))
  blade.scale.setScalar(1.2)
  g.add(blade)
  return g
}

function parts(c) {
  const robe = M(C.robe, { rough: 0.9 })
  const robeLt = M(C.robeLt, { rough: 0.85 })
  const robeDk = M(C.robeDk, { rough: 0.95 })
  const robeS = M(C.robe, { rough: 0.9, side: 2 })
  const hollow = M(C.hollow, { rough: 1 })
  const bone = M(C.bone, { rough: 0.6 })
  const boneDk = M(C.boneDk, { rough: 0.65 })
  const rope = M(C.rope, { rough: 0.9 })
  const shards = [robe, robeDk, robeLt]
  seed = 3

  // ---- hood + skull -------------------------------------------------------------------
  // deep cowl: a pointed arch frame in front of a rounded shell, dark inside
  const outer = [[-1.08, 0], [-1.1, 0.95], [-1.0, 1.5], [-0.68, 1.9], [0, 2.15], [0.68, 1.9], [1.0, 1.5], [1.1, 0.95], [1.08, 0]]
  const inner = [[0.7, 0], [0.72, 0.9], [0.64, 1.32], [0.36, 1.58], [0, 1.68], [-0.36, 1.58], [-0.64, 1.32], [-0.72, 0.9], [-0.7, 0]]
  c.on('Neck1', mesh(G.extrude([...outer, ...inner], 0.9, 0.05), robe, { p: [0, 4.72, 0.55] }))
  c.on('Neck1', mesh(G.tube(inner.map(([x, y]) => [x * 1.02, 4.72 + y, 1.05]), 0.045, 28), robeLt))
  c.on('Neck1', mesh(G.tube(outer.map(([x, y]) => [x, 4.72 + y, 1.04]), 0.035, 28), robeDk))
  c.on('Neck1', mesh(rb(2.1, 2.0, 1.5, 0.5), robe, { p: [0, 5.74, -0.3] }))
  c.on('Neck1', mesh(G.cone(0.55, 1.0, 14), robe, { p: [0, 6.45, -1.05], r: [-2.1, 0, 0] }))
  c.on('Neck1', mesh(rb(1.5, 1.7, 0.1, 0.03), hollow, { p: [0, 5.6, 0.08] }))
  c.on('Neck1', mesh(rb(1.42, 0.08, 0.9, 0.03), hollow, { p: [0, 6.36, 0.55] }))
  // skull + jaw
  c.on('Neck1', mesh(rb(1.15, 1.18, 0.9, 0.3), bone, { p: [0, 5.55, 0.42] }))
  c.on('Neck1', decal(skullTex(), 1.1, 1.15, { p: [0, 5.52, 0.875] }))
  c.on('Neck1', mesh(rb(0.88, 0.32, 0.7, 0.12), boneDk, { p: [0, 4.98, 0.5] }))
  c.on('Neck1', both((s) => mesh(rb(0.16, 0.36, 0.5, 0.06), boneDk, { p: [s * 0.52, 5.12, 0.42] })))
  // glowing eye points with a faint halo
  const eye = M(C.eye, { emissive: C.eye, glow: 1.3, rough: 0.2 })
  const halo = M(C.eye, { emissive: '#3ad8ff', glow: 0.8, opacity: 0.35 })
  c.on('Neck1', both((s) => mesh(G.sphere(0.085, 12, 10), eye, { p: [s * 0.22, 5.63, 0.86] })))
  c.on('Neck1', both((s) => mesh(G.sphere(0.16, 12, 10), halo, { p: [s * 0.22, 5.63, 0.86], shadow: false })))

  // ---- robe torso, mantle --------------------------------------------------------------
  c.on('Spine2', mesh(rb(2.86, 2.2, 1.72, 0.14), robe, { p: [0, 3.72, 0] }))
  c.on('Spine2', mesh(G.extrude([[-0.75, 1.0], [0.75, 1.0], [0, -0.9]], 0.06), robeDk, { p: [0, 3.82, 0.87] }))
  c.on('Spine2', both((s) => mesh(rb(0.3, 2.05, 0.08, 0.03), robeLt, { p: [s * 0.44, 3.82, 0.89], r: [0, 0, -s * 0.34] })))
  c.on('Spine2', mesh(rb(3.12, 0.55, 1.98, 0.22), robe, { p: [0, 4.62, -0.02] }))
  c.on('Spine2', mesh(rb(3.0, 0.1, 1.9, 0.04), robeLt, { p: [0, 4.88, -0.02] }))
  c.on('Spine2', hemBox(0, -0.02, 1.52, 0.97, 4.38, 0.3, 0.6, shards, 'fb'))
  // back cloak panel
  c.on('Spine2', mesh(rb(2.7, 2.0, 0.1, 0.04), robeDk, { p: [0, 3.55, -0.9] }))

  // ---- hips: rope belt, hourglass, split hem ----------------------------------------
  c.on('Spine1', mesh(rb(2.9, 0.75, 1.76, 0.14), robe, { p: [0, 2.62, 0] }))
  c.on('Spine1', mesh(G.torus(1, 0.075, PI * 2, 8, 40), rope, { p: [0, 2.9, 0], r: [PI / 2, 0, 0], s: [1.53, 0.95, 1] }))
  c.on('Spine1', mesh(G.torus(1, 0.06, PI * 2, 8, 40), M('#54442c', { rough: 0.9 }), { p: [0, 2.78, 0], r: [PI / 2, 0, 0.05], s: [1.52, 0.94, 1] }))
  c.on('Spine1', mesh(G.sphere(0.14, 12, 10), rope, { p: [-0.5, 2.86, 0.95] }))
  c.on('Spine1', mesh(G.tube([[-0.5, 2.82, 0.98], [-0.42, 2.4, 1.02], [-0.48, 1.9, 1.0]], 0.055, 12), rope))
  c.on('Spine1', mesh(G.tube([[-0.5, 2.82, 0.98], [-0.62, 2.45, 1.0], [-0.66, 2.05, 0.98]], 0.05, 12), rope))
  c.on('Spine1', mesh(G.cone(0.09, 0.22, 8), rope, { p: [-0.48, 1.82, 1.0], r: [PI, 0, 0] }))
  // hourglass at the right hip
  const wood = M(C.wood, { rough: 0.7 })
  const glass = M('#cfefff', { rough: 0.05, metal: 0.1, opacity: 0.4 })
  const sand = M('#e9c46a', { emissive: '#7a5410', glow: 0.5, rough: 0.6 })
  c.on(
    'Spine1',
    grp(
      mesh(G.cyl(0.2, 0.2, 0.07, 14), wood, { p: [0, 0.28, 0] }),
      mesh(G.cyl(0.2, 0.2, 0.07, 14), wood, { p: [0, -0.28, 0] }),
      rep(3, (i) => mesh(G.cyl(0.022, 0.022, 0.5, 6), wood, { p: [Math.cos((i / 3) * PI * 2) * 0.16, 0, Math.sin((i / 3) * PI * 2) * 0.16] })),
      mesh(G.cone(0.15, 0.25, 14), glass, { p: [0, 0.12, 0], r: [PI, 0, 0], shadow: false }),
      mesh(G.cone(0.15, 0.25, 14), glass, { p: [0, -0.12, 0], shadow: false }),
      mesh(G.cone(0.13, 0.12, 14), sand, { p: [0, -0.18, 0] }),
      mesh(G.cone(0.08, 0.08, 12), sand, { p: [0, 0.05, 0], r: [PI, 0, 0] }),
      mesh(G.cyl(0.012, 0.012, 0.2, 4), sand, { p: [0, -0.05, 0] }),
      mesh(G.torus(0.06, 0.015, PI * 2, 4, 10), M('#8a8a90', { metal: 0.8, rough: 0.3 }), { p: [0, 0.37, 0] }),
      { p: [-1.05, 2.4, 0.98], r: [0, 0, 0.08] },
    ),
  )
  c.on('Spine1', mesh(G.cyl(0.015, 0.015, 0.2, 4), rope, { p: [-1.04, 2.7, 0.98] }))
  // split robe skirt: front and back panels with ragged hems
  c.on('Spine1', mesh(rb(2.7, 0.95, 0.12, 0.04), robe, { p: [0, 2.0, 0.93], r: [0.06, 0, 0] }))
  c.on('Spine1', mesh(rb(2.8, 1.05, 0.12, 0.04), robe, { p: [0, 1.95, -0.93], r: [-0.06, 0, 0] }))
  c.on('Spine1', hem(9, [-1.35, 0.97], [1.35, 0.97], 1.56, 0.06, 0.3, 0.6, shards))
  c.on('Spine1', hem(9, [1.4, -0.97], [-1.4, -0.97], 1.46, PI, 0.4, 0.8, shards))

  // ---- legs: robe tubes with ragged shards + bony toes -----------------------------
  const leg = (s) => {
    const x = s * 0.72
    const B1 = s > 0 ? 'LegL1' : 'LegR1'
    const B2 = s > 0 ? 'LegL2' : 'LegR2'
    c.on(B1, mesh(rb(1.42, 1.3, 1.7, 0.12), robe, { p: [x, 1.8, 0] }))
    c.on(B2, mesh(rb(1.5, 1.05, 1.76, 0.12), robe, { p: [x, 0.88, 0] }))
    c.on(B2, hemBox(x, 0, 0.75, 0.88, 0.38, 0.18, 0.34, shards, s > 0 ? 'fbl' : 'fbr'))
    c.on(B2, rep(3, (i) => mesh(rb(0.2, 0.14, 0.34, 0.05), bone, { p: [x + (i - 1) * 0.28, 0.07, 0.86] })))
    c.on(B2, rep(3, (i) => mesh(G.sphere(0.08, 8, 6), boneDk, { p: [x + (i - 1) * 0.28, 0.1, 1.02] })))
  }
  leg(1)
  leg(-1)

  // ---- arms: wide tattered sleeves, skeletal hands ---------------------------------
  const arm = (s) => {
    const x = s * 2.0
    const B1 = s > 0 ? 'ArmL1' : 'ArmR1'
    const B2 = s > 0 ? 'ArmL2' : 'ArmR2'
    c.on(B1, mesh(rb(1.32, 1.3, 1.74, 0.16), robe, { p: [x, 4.18, 0] }))
    c.on(B1, hemBox(x, 0, 0.67, 0.88, 3.62, 0.18, 0.36, shards, s > 0 ? 'fbl' : 'fbr'))
    c.on(B2, mesh(G.cyl(0.74, 1.0, 1.15, 18, true), robeS, { p: [x, 3.05, 0.02] }))
    c.on(B2, mesh(G.cyl(0.7, 0.95, 1.1, 18, true), M(C.hollow, { side: 1 }), { p: [x, 3.05, 0.02] }))
    c.on(B2, mesh(G.torus(0.98, 0.04, PI * 2, 6, 28), robeLt, { p: [x, 2.5, 0.02], r: [PI / 2, 0, 0] }))
    c.on(
      B2,
      rep(12, (i) => {
        const a = (i / 12) * PI * 2
        return mesh(shardGeo(0.6, 0.25 + rnd() * 0.35), shards[i % 3], { p: [x + Math.sin(a) * 0.97, 2.52, 0.02 + Math.cos(a) * 0.97], r: [0, a, (rnd() - 0.5) * 0.3] })
      }),
    )
    // wrist + palm + finger bones
    c.on(B2, seg([x, 3.0, 0.15], [x, 2.55, 0.18], 0.07, 0.07, bone))
    c.on(B2, mesh(rb(0.34, 0.36, 0.5, 0.08), bone, { p: [x, 2.42, 0.22] }))
    c.on(B2, mesh(G.sphere(0.09, 10, 8), boneDk, { p: [x, 2.62, 0.18] }))
    const grip = s < 0
    for (let i = 0; i < 4; i++) {
      const z = 0.02 + i * 0.13
      if (grip) {
        // curled round the scythe handle (in front of the palm, inner side)
        c.on(B2, seg([x - 0.05, 2.28, z], [x + 0.2, 2.2, z], 0.035, 0.032, bone, 6))
        c.on(B2, seg([x + 0.2, 2.2, z], [x + 0.18, 2.36, z], 0.032, 0.028, bone, 6))
      } else {
        c.on(B2, seg([x, 2.25, z + 0.05], [x - s * 0.06, 1.98, z + 0.1], 0.035, 0.03, bone, 6))
        c.on(B2, seg([x - s * 0.06, 1.98, z + 0.1], [x - s * 0.14, 1.8, z + 0.08], 0.03, 0.022, bone, 6))
      }
      c.on(B2, mesh(G.sphere(0.045, 8, 6), boneDk, { p: [x, 2.25, z + (grip ? 0 : 0.05)] }))
    }
    c.on(B2, seg([x - s * 0.12, 2.4, 0.45], [x - s * 0.22, 2.2, 0.55], 0.04, 0.03, bone, 6))
  }
  arm(1)
  arm(-1)

  // ---- the scythe in the right hand ---------------------------------------------------
  c.on('ArmR2', grp(scythe(), { p: [-1.88, 2.3, 0.2], r: [deg(16), 0, deg(10)], s: 0.92 }))
}

// Thumbnail: the right arm a little forward and bent so the scythe stands upright.
export const pose = {
  ArmR1: { x: deg(-12), z: deg(-18) },
  ArmR2: { x: deg(-18) },
}

// Every part is merged per bone and material, so the whole costume is a few dozen
// draw calls (phones) while it is authored as many small pieces.
export function build(c) {
  const byBone = {}
  parts({ on: (bone, o) => ((byBone[bone] ??= new Group()).add(o), o) })
  for (const [bone, g] of Object.entries(byBone)) c.on(bone, bake(g, true))
}
