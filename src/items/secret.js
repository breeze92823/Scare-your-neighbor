// Secret Index items: the big-ticket machines and landmarks. Each model stands on y = 0 facing +Z.
import { Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const AX = [0, 0, PI / 2] // cylinder axis -> X
const AZ = [PI / 2, 0, 0] // cylinder axis -> Z
const UP = new Vector3(0, 1, 0)

function rod(a, b, r, mat, seg = 10) {
  const va = new Vector3(...a)
  const vb = new Vector3(...b)
  const d = vb.clone().sub(va)
  const m = mesh(G.cyl(r, r, 1, seg), mat)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.scale.set(1, d.length(), 1)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}
// Side profile [[forward(+Z), up], ...] extruded across X.
const side = (pts, w, mat, o = {}, bevel = 0) => mesh(G.extrude(pts, w, bevel), mat, { ...o, r: [0, -PI / 2, 0] })
// Plan outline [[x, forward(+Z)], ...] extruded up by h (centred on p.y).
const plan = (pts, h, mat, o = {}, bevel = 0) => mesh(G.extrude(pts, h, bevel), mat, { ...o, r: [PI / 2, 0, 0] })

const C = {
  tire: M('#1d1d22', { rough: 0.92 }),
  chrome: M('#dfe3e8', { metal: 0.95, rough: 0.2 }),
  steel: M('#8b919a', { metal: 0.75, rough: 0.38 }),
  dark: M('#2c2f36', { metal: 0.3, rough: 0.6 }),
  black: M('#18191d', { rough: 0.75 }),
  glass: M('#263a50', { metal: 0.6, rough: 0.1 }),
  head: M('#fffbe6', { emissive: '#fff0b0', glow: 1.6 }),
  tail: M('#ff3a30', { emissive: '#ff1a1a', glow: 1.3 }),
  white: M('#f4f5f7', { rough: 0.45 }),
  gold: M('#ffc531', { metal: 0.95, rough: 0.25 }),
}

function yacht() {
  const hull = [[-0.62, -2.1], [0.62, -2.1], [0.7, -0.6], [0.66, 0.7], [0.48, 1.5], [0.22, 2.05], [0, 2.25], [-0.22, 2.05], [-0.48, 1.5], [-0.66, 0.7], [-0.7, -0.6]]
  const navy = M('#1b2a4a', { rough: 0.4 })
  const teak = M('#b77a45', { rough: 0.7 })
  const rail = []
  for (const [x, z] of hull) if (z > -1.9) rail.push([x * 0.94, 0.86, z * 0.96])
  return grp(
    plan(hull, 0.24, navy, { p: [0, 0.12, 0], s: [0.7, 0.92, 1] }),
    plan(hull, 0.36, C.white, { p: [0, 0.42, 0], s: [0.92, 0.98, 1] }),
    plan(hull, 0.06, M('#2a7ad6', { rough: 0.4 }), { p: [0, 0.63, 0], s: [0.995, 1, 1] }),
    plan(hull, 0.1, C.white, { p: [0, 0.71, 0], s: [1.01, 1.01, 1] }, 0.02),
    mesh(G.rbox(1.2, 0.04, 1.1, 0.02), teak, { p: [0, 0.78, -1.45] }),
    mesh(G.rbox(1.1, 0.06, 0.4, 0.02), teak, { p: [0, 0.18, -2.25] }),
    // deck 1
    mesh(G.rbox(1.06, 0.42, 2.3, 0.08), C.white, { p: [0, 0.98, -0.15] }),
    both((s) => mesh(G.rbox(0.03, 0.18, 2.0, 0.01), C.glass, { p: [s * 0.53, 1.0, -0.15] })),
    side([[0, 0], [0.55, 0], [0.1, 0.42], [0, 0.42]], 1.06, C.white, { p: [0, 0.77, 1.0] }),
    mesh(G.box(0.96, 0.24, 0.03), C.glass, { p: [0, 1.0, 1.32], r: [-0.85, 0, 0] }),
    // deck 2
    mesh(G.rbox(0.92, 0.34, 1.6, 0.08), C.white, { p: [0, 1.36, -0.35] }),
    both((s) => mesh(G.rbox(0.03, 0.14, 1.3, 0.01), C.glass, { p: [s * 0.46, 1.38, -0.3] })),
    side([[0, 0], [0.45, 0], [0, 0.34]], 0.92, C.glass, { p: [0, 1.19, 0.45] }),
    // flybridge + arch + radar
    mesh(G.rbox(0.8, 0.08, 1.1, 0.03), C.white, { p: [0, 1.57, -0.5] }),
    both((s) => rod([s * 0.36, 1.6, -0.6], [s * 0.2, 2.05, -0.75], 0.05, C.white)),
    mesh(G.rbox(0.5, 0.08, 0.2, 0.03), C.white, { p: [0, 2.08, -0.76] }),
    mesh(G.cyl(0.14, 0.14, 0.08, 16), C.white, { p: [0, 2.17, -0.76] }),
    mesh(G.rbox(0.5, 0.04, 0.06, 0.02), C.dark, { p: [0, 2.26, -0.76] }),
    rod([0.15, 2.1, -0.85], [0.15, 2.5, -0.9], 0.015, C.steel),
    mesh(G.box(0.28, 0.16, 0.02), M('#d42a20', { side: 2 }), { p: [0, 0.98, -2.24] }),
    // rails + lifebuoy
    mesh(G.tube(rail, 0.018, 32), C.chrome),
    rep(5, (i) => rod([0.62 - i * 0.03, 0.74, 1.4 - i * 0.7], [0.62 - i * 0.03, 0.86, 1.4 - i * 0.7], 0.012, C.chrome)),
    mesh(G.torus(0.12, 0.04, PI * 2, 8, 16), M('#ff5a2a', { rough: 0.5 }), { p: [-0.54, 1.0, -1.25], r: [0, PI / 2, 0] }),
  )
}

function helicopter() {
  const red = M('#d42a20', { metal: 0.35, rough: 0.35 })
  const blade = M('#2a2d33', { metal: 0.4, rough: 0.5 })
  const rotor = (n, len, w) => rep(n, (i) => mesh(G.rbox(len, 0.03, w, 0.012), blade, { p: [0, 0, 0], r: [0, (i * PI) / n, 0] }))
  return grp(
    // skids
    both((s) => grp(
      mesh(G.tube([[s * 0.58, 0.18, 1.2], [s * 0.58, 0.05, 1.0], [s * 0.58, 0.05, -0.9]], 0.04, 16), C.steel),
      rod([s * 0.58, 0.05, 0.55], [s * 0.36, 0.55, 0.45], 0.035, C.steel),
      rod([s * 0.58, 0.05, -0.45], [s * 0.36, 0.55, -0.4], 0.035, C.steel),
    )),
    // cabin
    mesh(G.sphere(1, 22, 16), red, { p: [0, 0.95, 0], s: [0.62, 0.55, 0.95] }),
    mesh(G.sphere(1, 22, 16, ), C.glass, { p: [0, 1.0, 0.32], s: [0.56, 0.48, 0.7] }),
    mesh(G.rbox(0.66, 0.26, 0.7, 0.1), red, { p: [0, 1.45, -0.25] }),
    mesh(G.rbox(0.5, 0.12, 0.04, 0.02), C.dark, { p: [0, 1.48, -0.62] }),
    both((s) => mesh(G.rbox(0.02, 0.3, 0.42, 0.04), C.glass, { p: [s * 0.6, 1.0, -0.2] })),
    // tail boom
    mesh(G.cyl(0.08, 0.2, 2.1, 14), red, { p: [0, 1.15, -1.75], r: [PI / 2 + 0.05, 0, 0] }),
    side([[0, 0], [0.32, 0], [0.12, 0.7], [-0.12, 0.75]], 0.06, red, { p: [0, 1.15, -2.95] }, 0.02),
    mesh(G.rbox(0.8, 0.04, 0.2, 0.02), red, { p: [0, 1.13, -2.4] }),
    mesh(G.cyl(0.05, 0.05, 0.16, 10), C.dark, { p: [0.08, 1.55, -2.92], r: AX }),
    grp(rep(2, (i) => mesh(G.rbox(0.03, 0.62, 0.08, 0.01), blade, { r: [(i * PI) / 2, 0, 0] })), { p: [0.17, 1.55, -2.92] }),
    // mast + main rotor
    mesh(G.cyl(0.07, 0.09, 0.3, 12), C.dark, { p: [0, 1.7, -0.15] }),
    mesh(G.cyl(0.16, 0.16, 0.08, 14), C.steel, { p: [0, 1.86, -0.15] }),
    grp(rotor(2, 3.6, 0.2), { p: [0, 1.88, -0.15], r: [0, 0.35, 0] }),
    mesh(G.sphere(0.06, 10, 8), C.steel, { p: [0, 1.93, -0.15] }),
    mesh(G.sphere(0.04, 8, 6), C.tail, { p: [0, 0.48, -0.1] }),
    mesh(G.cyl(0.06, 0.06, 0.04, 12), C.head, { p: [0, 0.6, 0.84], r: [1.1, 0, 0] }),
  )
}

const camoTex = () =>
  tex('sec-camo', 128, 128, (x, w, h) => {
    x.fillStyle = '#5c6e34'
    x.fillRect(0, 0, w, h)
    const blobs = [['#3e4c22', 9], ['#8a8448', 8], ['#2e3418', 6]]
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (const [c, n] of blobs) {
      x.fillStyle = c
      for (let i = 0; i < n; i++) {
        x.beginPath()
        x.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 16, 6 + rnd() * 10, rnd() * 3, 0, PI * 2)
        x.fill()
      }
    }
  })

function tank() {
  const camo = M('#ffffff', { map: camoTex(), rough: 0.8 })
  const olive = M('#4d5c2a', { rough: 0.75 })
  const track = M('#26272a', { rough: 0.9, metal: 0.2 })
  const treads = tex('sec-tread', 16, 64, (x, w, h) => {
    x.fillStyle = '#2a2b2e'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#121314'
    for (let i = 0; i < 8; i++) x.fillRect(0, i * 8, w, 3)
  }, { repeat: [1, 6] })
  const trackSide = (s) => grp(
    mesh(G.rbox(0.42, 0.55, 3.0, 0.22), M('#ffffff', { map: treads, rough: 0.9 }), { p: [0, 0.3, 0] }),
    rep(5, (i) => mesh(G.cyl(0.2, 0.2, 0.08, 16), olive, { p: [s * 0.22, 0.25, -1.0 + i * 0.5], r: AX })),
    rep(5, (i) => mesh(G.cyl(0.07, 0.07, 0.1, 10), C.dark, { p: [s * 0.24, 0.25, -1.0 + i * 0.5], r: AX })),
    mesh(G.cyl(0.18, 0.18, 0.1, 10), C.dark, { p: [s * 0.21, 0.36, 1.38], r: AX }),
    mesh(G.rbox(0.5, 0.06, 3.1, 0.02), olive, { p: [0, 0.6, 0] }),
    { p: [s * 0.82, 0, 0] },
  )
  return grp(
    both(trackSide),
    mesh(G.rbox(1.24, 0.4, 2.7, 0.05), camo, { p: [0, 0.55, 0] }),
    side([[-1.4, 0], [1.1, 0], [1.6, -0.25], [1.4, 0.3], [-1.4, 0.3]], 1.5, camo, { p: [0, 0.6, 0] }, 0.03),
    both((s) => mesh(G.cyl(0.07, 0.07, 0.05, 12), C.head, { p: [s * 0.55, 0.85, 1.46], r: [1.1, 0, 0] })),
    both((s) => mesh(G.rbox(0.36, 0.2, 0.3, 0.04), olive, { p: [s * 0.4, 1.0, -1.15] })),
    // turret
    grp(
      plan([[-0.6, -0.7], [0.6, -0.7], [0.72, 0.2], [0.42, 0.75], [-0.42, 0.75], [-0.72, 0.2]], 0.42, camo, { p: [0, 0.21, 0] }, 0.04),
      mesh(G.rbox(0.9, 0.24, 0.4, 0.05), camo, { p: [0, 0.18, -0.85] }),
      mesh(G.cyl(0.2, 0.24, 0.3, 14), olive, { p: [0, 0.18, 0.78], r: AZ }),
      mesh(G.cyl(0.085, 0.085, 2.2, 14), olive, { p: [0, 0.18, 1.95], r: AZ }),
      mesh(G.cyl(0.12, 0.12, 0.28, 14), olive, { p: [0, 0.18, 1.6], r: AZ }),
      mesh(G.cyl(0.13, 0.12, 0.24, 14), C.dark, { p: [0, 0.18, 3.08], r: AZ }),
      // commander hatch + machine gun
      mesh(G.cyl(0.24, 0.26, 0.14, 16), olive, { p: [-0.28, 0.5, -0.2] }),
      mesh(G.cyl(0.2, 0.2, 0.05, 16), C.dark, { p: [-0.28, 0.6, -0.2] }),
      rod([0.3, 0.5, -0.1], [0.3, 0.68, -0.1], 0.03, C.dark),
      mesh(G.cyl(0.025, 0.025, 0.8, 8), C.black, { p: [0.3, 0.7, 0.25], r: AZ }),
      mesh(G.rbox(0.1, 0.1, 0.26, 0.02), C.black, { p: [0.3, 0.7, -0.05] }),
      rod([0.5, 0.42, -0.6], [0.6, 1.1, -0.8], 0.012, C.black, 6),
      { p: [0, 0.98, -0.1] },
    ),
  )
}

function bankVault() {
  const steel = M('#9aa2ae', { metal: 0.85, rough: 0.35 })
  const wall = M('#5d6470', { metal: 0.5, rough: 0.6 })
  const dark = M('#0d0e12', { rough: 0.9 })
  const bar = (p, r = 0) => grp(
    mesh(G.extrude([[-0.2, 0], [0.2, 0], [0.16, 0.1], [-0.16, 0.1]], 0.12, 0.005), C.gold, {}),
    { p, r: [0, r, 0] },
  )
  const bolts = rep(10, (i) => {
    const a = (i / 10) * PI * 2
    return mesh(G.cyl(0.05, 0.05, 0.18, 10), C.chrome, { p: [Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0], r: [0, 0, a + PI / 2] })
  })
  const door = grp(
    mesh(G.cyl(0.82, 0.82, 0.38, 28), steel, { r: AZ }),
    mesh(G.cyl(0.66, 0.66, 0.04, 28), M('#b8c0cc', { metal: 0.9, rough: 0.25 }), { p: [0, 0, 0.2], r: AZ }),
    mesh(G.torus(0.55, 0.03, PI * 2, 8, 28), C.chrome, { p: [0, 0, 0.22] }),
    bolts,
    // spoke wheel
    mesh(G.torus(0.32, 0.04, PI * 2, 8, 24), C.chrome, { p: [0, 0, 0.36] }),
    rep(3, (i) => mesh(G.box(0.64, 0.05, 0.05), C.chrome, { p: [0, 0, 0.36], r: [0, 0, (i * PI) / 3] })),
    rep(6, (i) => mesh(G.sphere(0.05, 8, 6), C.chrome, { p: [Math.cos((i * PI) / 3) * 0.32, Math.sin((i * PI) / 3) * 0.32, 0.36] })),
    rod([0, 0, 0.2], [0, 0, 0.36], 0.08, C.steel),
    mesh(G.cyl(0.08, 0.08, 0.05, 14), C.dark, { p: [0.42, 0.42, 0.22], r: AZ }),
    // lock mechanism on the inside face
    mesh(G.cyl(0.6, 0.6, 0.04, 24), M('#b8c0cc', { metal: 0.9, rough: 0.25 }), { p: [0, 0, -0.2], r: AZ }),
    rep(4, (i) => mesh(G.rbox(1.5, 0.08, 0.06, 0.02), C.chrome, { p: [0, -0.36 + i * 0.24, -0.24] })),
    mesh(G.cyl(0.2, 0.2, 0.1, 16), C.gold, { p: [0, 0, -0.26], r: AZ }),
    rep(8, (i) => mesh(G.box(0.06, 0.06, 0.1), C.gold, { p: [Math.cos((i * PI) / 4) * 0.22, Math.sin((i * PI) / 4) * 0.22, -0.26], r: [0, 0, (i * PI) / 4] })),
    { p: [0.82, 0, 0.19] },
  )
  return grp(
    mesh(G.rbox(2.6, 0.2, 1.6, 0.04), M('#444a54', { rough: 0.8 }), { p: [0, 0.1, 0.3] }),
    mesh(G.rbox(2.4, 2.3, 0.6, 0.06), wall, { p: [0, 1.35, -0.3] }),
    rep(4, (i) => mesh(G.cyl(0.05, 0.05, 0.04, 10), C.steel, { p: [i < 2 ? -1.05 : 1.05, i % 2 ? 0.4 : 2.3, 0.02], r: AZ })),
    mesh(G.cyl(0.86, 0.86, 0.04, 28), dark, { p: [0, 1.3, 0.01], r: AZ }),
    mesh(G.lathe([[0.86, 0], [1.02, 0], [1.02, 0.16], [0.86, 0.16], [0.86, 0]], 28), steel, { p: [0, 1.3, 0.0], r: AZ }),
    // gold inside + on the floor
    bar([-0.2, 0.95, -0.02]), bar([0.22, 0.95, -0.02]), bar([0.0, 1.05, -0.02]),
    // door hinged on the left, swung open toward the viewer
    grp(door, { p: [-1.02, 1.3, 0.12], r: [0, -2.5, 0] }),
    mesh(G.rbox(0.16, 0.5, 0.2, 0.03), steel, { p: [-0.98, 1.3, 0.1] }),
    bar([0.4, 0.2, 0.6], 0.2), bar([0.82, 0.2, 0.55], -0.1), bar([0.6, 0.2, 0.9], 0.1), bar([0.62, 0.3, 0.68], 0.05), bar([1.0, 0.2, 0.85], 0.3),
    mesh(G.cyl(0.12, 0.12, 0.03, 16), C.gold, { p: [0.15, 0.215, 0.9] }),
    mesh(G.cyl(0.12, 0.12, 0.03, 16), C.gold, { p: [0.15, 0.245, 0.9] }),
    mesh(G.cyl(0.12, 0.12, 0.03, 16), C.gold, { p: [0.17, 0.275, 0.88] }),
  )
}

function satelliteDish() {
  const dish = M('#eef0f3', { metal: 0.3, rough: 0.4, side: 2 })
  const frame = M('#8f97a3', { metal: 0.8, rough: 0.35 })
  const conc = M('#9a9a94', { rough: 0.95 })
  const fx = 1.15
  const disc = grp(
    mesh(G.lathe([[0.02, 0], [0.4, 0.03], [0.8, 0.13], [1.15, 0.28], [1.4, 0.42]], 28), dish),
    mesh(G.torus(1.4, 0.04, PI * 2, 8, 36), frame, { p: [0, 0.42, 0], r: [PI / 2, 0, 0] }),
    rep(3, (i) => {
      const a = (i / 3) * PI * 2 + PI / 2
      return rod([Math.cos(a) * 1.35, 0.42, Math.sin(a) * 1.35], [0, fx, 0], 0.025, frame, 6)
    }),
    mesh(G.cyl(0.1, 0.08, 0.26, 12), C.dark, { p: [0, fx, 0] }),
    mesh(G.cyl(0.16, 0.16, 0.04, 14), frame, { p: [0, fx - 0.14, 0] }),
    mesh(G.cyl(0.32, 0.36, 0.18, 16), frame, { p: [0, -0.06, 0] }),
    rep(4, (i) => rod([0, -0.1, 0], [Math.cos(i * PI / 2) * 1.0, 0.18, Math.sin(i * PI / 2) * 1.0], 0.03, frame, 6)),
    { p: [0, 1.85, 0], r: [0.75, 0, 0] },
  )
  return grp(
    mesh(G.rbox(1.3, 0.3, 1.3, 0.04), conc, { p: [0, 0.15, 0] }),
    mesh(G.cyl(0.26, 0.32, 1.2, 16), frame, { p: [0, 0.9, -0.1] }),
    mesh(G.rbox(0.7, 0.2, 0.5, 0.04), frame, { p: [0, 1.5, -0.1] }),
    both((s) => mesh(G.rbox(0.1, 0.55, 0.4, 0.03), frame, { p: [s * 0.3, 1.72, -0.1] })),
    mesh(G.cyl(0.08, 0.08, 0.8, 12), C.dark, { p: [0, 1.85, -0.1], r: AX }),
    disc,
    mesh(G.rbox(0.4, 0.4, 0.2, 0.04), M('#f0f0ee', { rough: 0.6 }), { p: [0.4, 0.5, 0.5] }),
    mesh(G.sphere(0.035, 8, 6), M('#40ff80', { emissive: '#30ff60', glow: 2 }), { p: [0.32, 0.6, 0.61] }),
    mesh(G.tube([[0.3, 0.4, 0.4], [0.15, 0.3, 0.2], [0.05, 0.6, -0.1]], 0.025, 12), C.black),
  )
}

function dinoSkeleton() {
  const bone = M('#efe3c4', { rough: 0.7 })
  const boneD = M('#d8c69e', { rough: 0.75 })
  const marble = M('#3b3f48', { rough: 0.5, metal: 0.2 })
  const sock = M('#2a1e14', { rough: 0.9 })
  // spine from tail tip to neck
  const spine = [[0, 0.7, -2.5], [0, 1.05, -1.9], [0, 1.45, -1.2], [0, 1.75, -0.45], [0, 1.85, 0.25], [0, 1.95, 0.75], [0, 2.25, 1.05]]
  const verts = []
  for (let i = 0; i < spine.length - 1; i++) {
    for (let t = 0; t < 1; t += 0.34) {
      const a = spine[i]
      const b = spine[i + 1]
      const p = [0, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
      const sz = 0.06 + (i / spine.length) * 0.07
      verts.push(mesh(G.rbox(sz * 1.8, sz * 1.6, sz * 1.2, sz * 0.4), bone, { p }))
      if (i > 0 && i < 5) verts.push(mesh(G.box(0.03, sz * 2.4, 0.04), boneD, { p: [0, p[1] + sz * 1.6, p[2]] }))
    }
  }
  const ribs = rep(6, (i) => {
    const z = -0.35 + i * 0.18
    const r = 0.38 - Math.abs(i - 2.2) * 0.06
    return mesh(G.torus(r, 0.025, PI * 1.15, 6, 14), bone, { p: [0, 1.82 - r * 0.25, z], r: [0, 0, PI * 1.5 - PI * 0.575] })
  })
  const leg = (s) => grp(
    mesh(G.rbox(0.16, 0.32, 0.42, 0.06), bone, { p: [s * 0.18, 1.62, -0.5] }),
    rod([s * 0.24, 1.6, -0.5], [s * 0.28, 1.05, -0.1], 0.07, bone),
    mesh(G.sphere(0.09, 10, 8), bone, { p: [s * 0.28, 1.05, -0.1] }),
    rod([s * 0.28, 1.05, -0.1], [s * 0.3, 0.5, -0.45], 0.055, bone),
    mesh(G.sphere(0.07, 10, 8), bone, { p: [s * 0.3, 0.5, -0.45] }),
    rod([s * 0.3, 0.5, -0.45], [s * 0.3, 0.3, -0.3], 0.045, bone),
    rep(3, (i) => rod([s * 0.3, 0.3, -0.3], [s * 0.3 + (i - 1) * 0.1, 0.27, 0.0], 0.025, bone, 6)),
  )
  const skull = grp(
    side([[-0.35, 0], [0.1, -0.06], [0.5, 0.02], [0.55, 0.12], [0.3, 0.2], [-0.05, 0.28], [-0.3, 0.3], [-0.42, 0.18]], 0.32, bone, {}, 0.03),
    both((s) => mesh(G.sphere(0.07, 10, 8), sock, { p: [s * 0.17, 0.2, -0.12], s: [0.4, 1, 1] })),
    both((s) => mesh(G.sphere(0.06, 10, 8), sock, { p: [s * 0.17, 0.08, 0.15], s: [0.4, 0.8, 1.6] })),
    rep(5, (i) => both((s) => mesh(G.cone(0.025, 0.08, 6), C.white, { p: [s * 0.14, -0.08, 0.05 + i * 0.09], r: [PI, 0, 0] }))),
    // jaw
    grp(
      side([[-0.32, 0], [0.42, 0.02], [0.44, 0.08], [-0.1, 0.1], [-0.3, 0.08]], 0.28, bone, {}, 0.02),
      rep(5, (i) => both((s) => mesh(G.cone(0.022, 0.07, 6), C.white, { p: [s * 0.12, 0.15, 0.0 + i * 0.08] }))),
      { p: [0, -0.24, 0.0], r: [0.28, 0, 0] },
    ),
    { p: [0, 2.2, 1.4], r: [0.12, 0, 0] },
  )
  const arm = (s) => grp(
    rod([s * 0.2, 1.75, 0.65], [s * 0.24, 1.55, 0.8], 0.03, bone, 6),
    rod([s * 0.24, 1.55, 0.8], [s * 0.22, 1.48, 0.98], 0.025, bone, 6),
    both((t) => rod([s * 0.22, 1.48, 0.98], [s * 0.22 + t * 0.03, 1.4, 1.04], 0.012, bone, 5)),
  )
  const dino = grp(
    mesh(G.tube(spine, 0.05, 32), boneD),
    ...verts,
    ribs,
    mesh(G.rbox(0.42, 0.18, 0.5, 0.06), bone, { p: [0, 1.7, -0.5] }),
    both(leg), both(arm), skull,
    // stand
    mesh(G.rbox(1.0, 0.24, 3.8, 0.06), marble, { p: [0, 0.12, -0.4] }),
    mesh(G.rbox(0.5, 0.18, 0.03, 0.01), C.gold, { p: [0, 0.14, 1.51] }),
    rod([0, 0.24, -0.5], [0, 1.68, -0.5], 0.025, C.steel),
    rod([0, 0.24, 0.55], [0, 1.85, 0.55], 0.025, C.steel),
    rod([0, 0.24, -1.6], [0, 1.3, -1.6], 0.025, C.steel),
  )
  return grp(dino, { r: [0, 1.05, 0] })
}

const canopyTex = () =>
  tex('sec-canopy', 256, 64, (x, w, h) => {
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i % 2 ? '#ffffff' : '#e83a4a'
      x.fillRect((i * w) / 16, 0, w / 16 + 1, h)
    }
  })

function carousel() {
  const canopy = M('#ffffff', { map: canopyTex(), rough: 0.6 })
  const gold = C.gold
  const bulb = M('#fff6c8', { emissive: '#ffe28a', glow: 2 })
  const saddles = ['#3f8cff', '#ff4fa0', '#40c060', '#ffb020']
  const horse = (col) => {
    const body = M('#fbf7ef', { rough: 0.45 })
    const mane = M('#e8b923', { rough: 0.6 })
    return grp(
      mesh(G.capsule(0.16, 0.5, 12), body, { r: AZ }),
      rod([0, 0.08, 0.3], [0, 0.42, 0.48], 0.1, body),
      mesh(G.rbox(0.16, 0.18, 0.34, 0.06), body, { p: [0, 0.48, 0.6], r: [0.5, 0, 0] }),
      mesh(G.rbox(0.06, 0.3, 0.16, 0.03), mane, { p: [0, 0.38, 0.32], r: [-0.6, 0, 0] }),
      both((s) => mesh(G.cone(0.03, 0.08, 6), body, { p: [s * 0.05, 0.62, 0.5] })),
      mesh(G.rbox(0.36, 0.06, 0.3, 0.02), M(col, { rough: 0.5 }), { p: [0, 0.16, -0.02] }),
      both((s) => rod([s * 0.08, -0.05, 0.25], [s * 0.08, -0.2, 0.48], 0.035, body, 6)),
      both((s) => rod([s * 0.08, -0.05, -0.25], [s * 0.08, -0.38, -0.3], 0.035, body, 6)),
      mesh(G.cone(0.06, 0.32, 8), mane, { p: [0, 0.0, -0.5], r: [-2.2, 0, 0] }),
    )
  }
  return grp(
    mesh(G.cyl(1.7, 1.78, 0.28, 24), M('#7a3ad6', { rough: 0.5 }), { p: [0, 0.14, 0] }),
    mesh(G.cyl(1.62, 1.62, 0.04, 24), M('#c89a60', { rough: 0.7 }), { p: [0, 0.3, 0] }),
    rep(12, (i) => mesh(G.sphere(0.04, 8, 6), bulb, { p: [Math.sin((i / 12) * PI * 2) * 1.76, 0.14, Math.cos((i / 12) * PI * 2) * 1.76] })),
    mesh(G.cyl(0.3, 0.34, 2.4, 18), M('#e83a4a', { rough: 0.5 }), { p: [0, 1.5, 0] }),
    mesh(G.cyl(0.36, 0.36, 0.1, 18), gold, { p: [0, 0.36, 0] }),
    // canopy
    mesh(G.cyl(1.8, 1.8, 0.28, 24, true), M('#ffffff', { map: canopyTex(), rough: 0.6, side: 2 }), { p: [0, 2.55, 0] }),
    mesh(G.cone(1.85, 0.9, 24), canopy, { p: [0, 3.14, 0] }),
    rep(16, (i) => {
      const a = (i / 16) * PI * 2
      return mesh(G.sphere(0.12, 10, 6), i % 2 ? M('#ffffff', { rough: 0.6 }) : M('#e83a4a', { rough: 0.6 }), { p: [Math.sin(a) * 1.8, 2.42, Math.cos(a) * 1.8], s: [1, 0.7, 0.5], r: [0, a, 0] })
    }),
    rep(12, (i) => mesh(G.sphere(0.04, 8, 6), bulb, { p: [Math.sin((i / 12) * PI * 2 + 0.2) * 1.82, 2.6, Math.cos((i / 12) * PI * 2 + 0.2) * 1.82] })),
    mesh(G.sphere(0.12, 12, 8), gold, { p: [0, 3.65, 0] }),
    rod([0, 3.7, 0], [0, 4.1, 0], 0.02, gold),
    mesh(G.extrude([[0, 0], [0.35, -0.08], [0, -0.16]], 0.02), M('#3f8cff', { side: 2 }), { p: [0, 4.08, 0], r: [0, -0.5, 0] }),
    // horses on poles
    rep(4, (i) => {
      const a = (i / 4) * PI * 2 + 0.3
      const y = 1.15 + (i % 2) * 0.3
      return grp(
        rod([0, 0.3, 0], [0, 2.42, 0], 0.03, gold),
        grp(horse(saddles[i]), { p: [0, y, 0] }),
        { p: [Math.sin(a) * 1.2, 0, Math.cos(a) * 1.2], r: [0, a - PI / 2, 0] },
      )
    }),
  )
}

const stripeTex = () =>
  tex('sec-lighthouse', 16, 128, (x, w, h) => {
    for (let i = 0; i < 6; i++) {
      x.fillStyle = i % 2 ? '#ffffff' : '#e02a2a'
      x.fillRect(0, (i * h) / 6, w, h / 6 + 1)
    }
  })

function lighthouse() {
  const red = M('#e02a2a', { rough: 0.5 })
  const rock = M('#6a6a72', { rough: 0.95, flat: true })
  const lamp = M('#fff6c8', { emissive: '#ffe070', glow: 2.6 })
  return grp(
    mesh(G.ico(1.0, 1), rock, { p: [0, 0.2, 0], s: [1.4, 0.5, 1.3] }),
    mesh(G.ico(0.5, 0), rock, { p: [1.0, 0.15, 0.6], s: [1, 0.6, 1] }),
    mesh(G.ico(0.4, 0), rock, { p: [-1.1, 0.12, 0.3], s: [1, 0.6, 1] }),
    mesh(G.cyl(0.9, 0.95, 0.3, 20), M('#d8d4c8', { rough: 0.8 }), { p: [0, 0.55, 0] }),
    mesh(G.cyl(0.52, 0.78, 3.6, 20), M('#ffffff', { map: stripeTex(), rough: 0.55 }), { p: [0, 2.5, 0] }),
    // door + windows
    mesh(G.extrude([[-0.16, 0], [0.16, 0], [0.16, 0.3], [0, 0.42], [-0.16, 0.3]], 0.1), M('#2a3a5a', { rough: 0.6 }), { p: [-0.2, 0.7, 0.75], r: [-0.06, -0.26, 0] }),
    mesh(G.rbox(0.14, 0.22, 0.06, 0.03), C.glass, { p: [-0.18, 2.3, 0.63], r: [-0.06, -0.26, 0] }),
    mesh(G.rbox(0.14, 0.22, 0.06, 0.03), C.glass, { p: [-0.16, 3.4, 0.55], r: [-0.06, -0.26, 0] }),
    // gallery
    mesh(G.cyl(0.8, 0.6, 0.18, 20), M('#2a2d33', { metal: 0.4, rough: 0.5 }), { p: [0, 4.38, 0] }),
    rep(16, (i) => {
      const a = (i / 16) * PI * 2
      return rod([Math.sin(a) * 0.76, 4.46, Math.cos(a) * 0.76], [Math.sin(a) * 0.76, 4.76, Math.cos(a) * 0.76], 0.015, C.black, 5)
    }),
    mesh(G.torus(0.76, 0.025, PI * 2, 6, 32), C.black, { p: [0, 4.76, 0], r: [PI / 2, 0, 0] }),
    // lantern room
    mesh(G.cyl(0.46, 0.46, 0.12, 16), red, { p: [0, 4.52, 0] }),
    mesh(G.cyl(0.42, 0.42, 0.6, 16), M('#fff2b0', { emissive: '#ffd860', glow: 0.9, opacity: 0.6, rough: 0.05 }), { p: [0, 4.88, 0] }),
    mesh(G.sphere(0.2, 14, 10), lamp, { p: [0, 4.88, 0] }),
    rep(6, (i) => rod([Math.sin(i) * 0.43, 4.58, Math.cos(i) * 0.43], [Math.sin(i) * 0.43, 5.18, Math.cos(i) * 0.43], 0.02, red, 5)),
    mesh(G.cyl(0.5, 0.5, 0.06, 16), red, { p: [0, 5.2, 0] }),
    mesh(G.dome(0.46, PI / 2, 18, 8), red, { p: [0, 5.22, 0] }),
    mesh(G.sphere(0.08, 10, 8), C.black, { p: [0, 5.7, 0] }),
    rod([0, 5.7, 0], [0, 6.0, 0], 0.015, C.black, 5),
  )
}

function privateJet() {
  const white = C.white
  const blue = M('#1f3a7a', { rough: 0.35, metal: 0.3 })
  const body = [[0, 0], [0.12, 0.1], [0.28, 0.6], [0.4, 1.4], [0.42, 3.0], [0.38, 3.7], [0.26, 4.2], [0.1, 4.5], [0, 4.56]]
  const wing = [[0, 0.5], [2.2, -0.5], [2.35, -0.75], [2.2, -0.85], [0, -0.35]]
  const gear = (x, z, h) => grp(
    rod([x, h, z], [x, 0.14, z], 0.03, C.steel),
    mesh(G.cyl(0.14, 0.14, 0.1, 14), C.tire, { p: [x, 0.14, z], r: AX }),
  )
  return grp(
    mesh(G.lathe(body, 22), white, { p: [0, 0.82, -2.4], r: [PI / 2, 0, 0] }),
    mesh(G.box(0.02, 0.06, 3.0), blue, { p: [-0.415, 0.75, -0.1] }),
    mesh(G.box(0.02, 0.06, 3.0), blue, { p: [0.415, 0.75, -0.1] }),
    // cockpit + windows
    mesh(G.sphere(0.3, 16, 10), C.glass, { p: [0, 0.98, 1.6], s: [1, 0.45, 0.9] }),
    both((s) => rep(6, (i) => mesh(G.sphere(0.06, 10, 8), C.glass, { p: [s * 0.4, 0.92, 0.9 - i * 0.36], s: [0.3, 1, 0.8] }))),
    // wings
    both((s) => plan(wing.map(([x, z]) => [x * s, z]), 0.06, white, { p: [0, 0.6, 0.0] })),
    both((s) => mesh(G.rbox(0.03, 0.34, 0.3, 0.01), blue, { p: [s * 2.3, 0.75, -0.72], r: [0, 0, s * -0.2] })),
    // engines
    both((s) => grp(
      mesh(G.capsule(0.17, 0.6, 14), M('#d8dce2', { metal: 0.6, rough: 0.3 }), { r: AZ }),
      mesh(G.cyl(0.13, 0.13, 0.04, 14), C.dark, { p: [0, 0, 0.47], r: AZ }),
      mesh(G.rbox(0.3, 0.06, 0.3, 0.02), white, { p: [-s * 0.18, 0, 0] }),
      { p: [s * 0.62, 1.08, -1.45] },
    )),
    // T-tail
    side([[0, 0], [0.55, 0], [0.05, 1.0], [-0.35, 1.05]], 0.06, blue, { p: [0, 1.1, -2.15] }, 0.02),
    plan([[0, 0.15], [0.8, -0.2], [0.8, -0.4], [0, -0.25], [-0.8, -0.4], [-0.8, -0.2]], 0.05, blue, { p: [0, 2.15, -2.35] }),
    gear(0, 1.3, 0.5), gear(0.5, -0.4, 0.55), gear(-0.5, -0.4, 0.55),
    mesh(G.sphere(0.04, 8, 6), C.tail, { p: [-2.32, 0.62, -0.7] }),
    mesh(G.sphere(0.04, 8, 6), M('#40ff80', { emissive: '#30ff60', glow: 2 }), { p: [2.32, 0.62, -0.7] }),
  )
}

function submarine() {
  const yel = M('#ffc21a', { rough: 0.4, metal: 0.2 })
  const wood = M('#7a4a26', { rough: 0.85 })
  const port = (x, z) => grp(
    mesh(G.torus(0.12, 0.035, PI * 2, 8, 16), C.chrome, {}),
    mesh(G.cyl(0.11, 0.11, 0.02, 14), M('#5ad0ff', { emissive: '#1a90c0', glow: 0.8, rough: 0.1 }), { r: AZ }),
    { p: [x, 0.95, z], r: [0, x > 0 ? PI / 2 : -PI / 2, 0] },
  )
  return grp(
    both((s) => mesh(G.rbox(1.1, 0.3, 0.3, 0.05), wood, { p: [0, 0.15, s * 0.8] })),
    mesh(G.capsule(0.62, 2.4, 20), yel, { p: [0, 0.95, 0], r: AZ }),
    mesh(G.cone(0.4, 0.6, 16), yel, { p: [0, 0.95, -2.0], r: [-PI / 2, 0, 0] }),
    // conning tower
    mesh(G.rbox(0.5, 0.55, 1.0, 0.18), yel, { p: [0, 1.7, 0.1] }),
    mesh(G.rbox(0.52, 0.06, 1.02, 0.03), C.dark, { p: [0, 1.98, 0.1] }),
    rod([0.1, 1.95, 0.4], [0.1, 2.5, 0.4], 0.04, C.steel),
    rod([0.1, 2.48, 0.4], [0.1, 2.48, 0.62], 0.04, C.steel),
    mesh(G.cyl(0.05, 0.05, 0.03, 10), C.glass, { p: [0.1, 2.48, 0.64], r: AZ }),
    both((s) => mesh(G.rbox(0.36, 0.04, 0.18, 0.02), yel, { p: [s * 0.4, 1.72, 0.35] })),
    // portholes
    port(-0.6, 0.7), port(-0.6, 0.15), port(-0.6, -0.4), port(0.6, 0.7), port(0.6, 0.15), port(0.6, -0.4),
    // stern: fins, rudder, prop + shroud
    side([[0, 0], [0.5, 0], [0.2, 0.42], [-0.15, 0.45]], 0.05, yel, { p: [0, 1.1, -2.1] }, 0.02),
    side([[0, 0], [0.5, 0], [0.2, -0.38], [-0.15, -0.4]], 0.05, yel, { p: [0, 0.82, -2.1] }, 0.02),
    mesh(G.rbox(1.2, 0.04, 0.3, 0.02), yel, { p: [0, 0.95, -1.9] }),
    mesh(G.cyl(0.04, 0.04, 0.3, 8), C.dark, { p: [0, 0.95, -2.38], r: AZ }),
    rep(3, (i) => mesh(G.rbox(0.08, 0.42, 0.03, 0.02), M('#b88a3a', { metal: 0.85, rough: 0.3 }), { p: [0, 0.95, -2.5], r: [0, 0.4, (i * 2 * PI) / 3] })),
    mesh(G.torus(0.3, 0.03, PI * 2, 8, 20), yel, { p: [0, 0.95, -2.5] }),
    // bow light + bow planes
    mesh(G.cyl(0.12, 0.12, 0.06, 14), C.head, { p: [0, 1.05, 1.82], r: [1.3, 0, 0] }),
    both((s) => mesh(G.rbox(0.36, 0.04, 0.2, 0.02), yel, { p: [s * 0.68, 0.95, 1.1] })),
    rep(4, (i) => mesh(G.sphere(0.03, 8, 6), C.steel, { p: [0, 1.58, -0.8 - i * 0.25] })),
  )
}

function rocket() {
  const white = C.white
  const red = M('#e8322b', { rough: 0.4 })
  const body = [[0.5, 0], [0.56, 0.3], [0.62, 1.0], [0.62, 2.5], [0.56, 3.0]]
  const nose = [[0.56, 0], [0.48, 0.3], [0.32, 0.65], [0.12, 0.95], [0, 1.02]]
  const fin = [[0, 0], [0.75, -0.25], [0.8, -0.9], [0.55, -0.9], [0, -0.35], [0, 0.4]]
  return grp(
    mesh(G.lathe(body, 24), white, { p: [0, 0.5, 0] }),
    mesh(G.lathe(nose, 24), red, { p: [0, 3.5, 0] }),
    mesh(G.cyl(0.625, 0.625, 0.14, 24), red, { p: [0, 2.6, 0] }),
    mesh(G.cyl(0.625, 0.625, 0.08, 24), M('#2a2d33', { rough: 0.5 }), { p: [0, 1.2, 0] }),
    // window
    mesh(G.torus(0.2, 0.05, PI * 2, 8, 20), C.chrome, { p: [-0.3, 2.0, 0.52], r: [0, -0.52, 0] }),
    mesh(G.cyl(0.18, 0.18, 0.04, 18), M('#5ad0ff', { emissive: '#1a90c0', glow: 0.6, rough: 0.1 }), { p: [-0.31, 2.0, 0.54], r: [PI / 2, 0, 0.52] }),
    // fins
    rep(4, (i) => {
      const a = (i / 4) * PI * 2 + PI / 4
      return grp(mesh(G.extrude(fin, 0.08, 0.02), red, { p: [0.5, 1.4, 0] }), { r: [0, a, 0] })
    }),
    // nozzle + flame
    mesh(G.lathe([[0.42, 0], [0.34, 0.15], [0.26, 0.32]], 18), C.dark, { p: [0, 0.2, 0] }),
    mesh(G.cone(0.32, 0.25, 16), M('#ffb030', { emissive: '#ff8a10', glow: 2.2 }), { p: [0, 0.13, 0], r: [PI, 0, 0] }),
    // smoke puffs at the base
    rep(6, (i) => mesh(G.sphere(0.26 + (i % 3) * 0.06, 12, 8), M('#e8e8ec', { rough: 1 }), { p: [Math.sin(i * 1.05) * 0.8, 0.18, Math.cos(i * 1.05) * 0.8] })),
    rod([0, 4.5, 0], [0, 4.8, 0], 0.02, C.steel),
  )
}

export const models = {
  Yacht: yacht,
  Helicopter: helicopter,
  Tank: tank,
  'Bank Vault': bankVault,
  'Satellite Dish': satelliteDish,
  'Dino Skeleton': dinoSkeleton,
  Carousel: carousel,
  Lighthouse: lighthouse,
  'Private Jet': privateJet,
  Submarine: submarine,
  Rocket: rocket,
}
