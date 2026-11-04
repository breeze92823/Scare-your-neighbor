// Mythical Index items: vehicles and fantasy props. Each model stands on y = 0 facing +Z.
import { Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const AX = [0, 0, PI / 2] // cylinder axis -> X
const AZ = [PI / 2, 0, 0] // cylinder axis -> Z
const UP = new Vector3(0, 1, 0)

// Rod (unit cylinder stretched) from point a to point b.
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
  clear: M('#bfe6ff', { metal: 0.2, rough: 0.05, opacity: 0.45 }),
  head: M('#fffbe6', { emissive: '#fff0b0', glow: 1.6 }),
  tail: M('#ff3a30', { emissive: '#ff1a1a', glow: 1.3 }),
  white: M('#f4f5f7', { rough: 0.45 }),
}

// Wheel with its axle along X.
function wheel(r, w, rim = C.chrome, o = {}) {
  const parts = [
    mesh(G.cyl(r, r, w, 22), C.tire, { r: AX }),
    mesh(G.torus(r * 0.86, r * 0.14, PI * 2, 8, 22), C.tire, { p: [w / 2 - r * 0.08, 0, 0], r: [0, PI / 2, 0] }),
    mesh(G.torus(r * 0.86, r * 0.14, PI * 2, 8, 22), C.tire, { p: [-w / 2 + r * 0.08, 0, 0], r: [0, PI / 2, 0] }),
    mesh(G.cyl(r * 0.58, r * 0.58, w + 0.02, 18), rim, { r: AX }),
    mesh(G.cyl(r * 0.2, r * 0.2, w + 0.06, 10), C.dark, { r: AX }),
  ]
  if (o.tread) {
    const n = 12
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2
      parts.push(mesh(G.box(w * 0.9, r * 0.16, r * 0.22), C.tire, { p: [0, Math.cos(a) * r, Math.sin(a) * r], r: [-a, 0, 0] }))
    }
  }
  return grp(...parts, { p: o.p })
}

// Number roundel for the kart.
const numTex = (n, bg = '#ffffff', fg = '#111') =>
  tex(`myth-num-${n}-${bg}`, 64, 64, (x, w, h) => {
    x.fillStyle = bg
    x.beginPath()
    x.roundRect(2, 2, w - 4, h - 4, 12)
    x.fill()
    x.fillStyle = fg
    x.font = 'bold 46px sans-serif'
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText(n, w / 2, h / 2 + 3)
  })

const stoneTex = () =>
  tex('myth-stone', 128, 128, (x, w, h) => {
    x.fillStyle = '#7c7f86'
    x.fillRect(0, 0, w, h)
    const rows = 8
    const bh = h / rows
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 16 : 0
      for (let c = -1; c < 4; c++) {
        const v = 150 + ((r * 7 + c * 13) % 5) * 9
        x.fillStyle = `rgb(${v},${v + 2},${v + 8})`
        x.fillRect(c * 32 + off + 2, r * bh + 2, 28, bh - 4)
      }
    }
  }, { repeat: [5, 3] })

function goKart() {
  const red = M('#e8322b', { rough: 0.4 })
  const yel = M('#ffd23f', { rough: 0.5 })
  const fw = (s) => wheel(0.24, 0.26, M('#ffd23f', { metal: 0.4, rough: 0.35 }), { p: [s * 0.74, 0.24, 0.95] })
  const rw = (s) => wheel(0.3, 0.36, M('#ffd23f', { metal: 0.4, rough: 0.35 }), { p: [s * 0.78, 0.3, -0.8] })
  return grp(
    mesh(G.rbox(1.0, 0.08, 2.3, 0.03), C.dark, { p: [0, 0.2, 0] }),
    both((s) => rod([s * 0.52, 0.25, -1.1], [s * 0.52, 0.25, 1.15], 0.035, C.steel)),
    both((s) => mesh(G.rbox(0.26, 0.24, 1.0, 0.08), red, { p: [s * 0.62, 0.32, 0.02] })),
    both((s) => mesh(G.box(0.27, 0.05, 1.01), yel, { p: [s * 0.62, 0.36, 0.02] })),
    side([[0, 0], [0.72, 0], [0.78, 0.08], [0.22, 0.3], [0, 0.3]], 0.86, red, { p: [0, 0.17, 0.62] }, 0.03),
    decal(numTex('7'), 0.3, 0.24, { p: [0, 0.41, 1.07], r: [-1.2, 0, 0] }),
    // bumpers
    rod([-0.55, 0.26, 1.55], [0.55, 0.26, 1.55], 0.04, C.steel),
    both((s) => rod([s * 0.55, 0.26, 1.55], [s * 0.4, 0.26, 1.25], 0.035, C.steel)),
    rod([-0.6, 0.32, -1.28], [0.6, 0.32, -1.28], 0.045, C.steel),
    both((s) => rod([s * 0.6, 0.32, -1.28], [s * 0.45, 0.26, -1.05], 0.035, C.steel)),
    // seat
    mesh(G.rbox(0.56, 0.12, 0.5, 0.05), C.black, { p: [0, 0.32, -0.2] }),
    mesh(G.rbox(0.56, 0.62, 0.12, 0.05), C.black, { p: [0, 0.6, -0.48], r: [-0.22, 0, 0] }),
    both((s) => mesh(G.rbox(0.1, 0.45, 0.32, 0.04), C.black, { p: [s * 0.3, 0.5, -0.3] })),
    // steering
    rod([0, 0.3, 0.7], [0, 0.64, 0.33], 0.03, C.steel),
    mesh(G.torus(0.16, 0.03, PI * 2, 8, 20), C.black, { p: [0, 0.66, 0.31], r: [0.74, 0, 0] }),
    mesh(G.box(0.3, 0.035, 0.03), C.black, { p: [0, 0.66, 0.31], r: [0.74, 0, 0] }),
    // engine + exhaust
    mesh(G.rbox(0.36, 0.3, 0.38, 0.04), C.steel, { p: [0.26, 0.42, -0.9] }),
    rep(4, (i) => mesh(G.box(0.4, 0.025, 0.42), C.dark, { p: [0.26, 0.6 + i * 0.05, -0.9] })),
    mesh(G.cyl(0.07, 0.07, 0.1, 12), C.black, { p: [0.26, 0.8, -0.9] }),
    rod([0.08, 0.45, -0.95], [-0.25, 0.5, -1.2], 0.045, C.chrome),
    mesh(G.cyl(0.07, 0.06, 0.14, 12), C.chrome, { p: [-0.29, 0.51, -1.26], r: AZ }),
    both(fw),
    both(rw),
  )
}

function speedboat() {
  const hull = [[-0.62, -1.6], [0.62, -1.6], [0.68, 0.1], [0.55, 1.0], [0.28, 1.6], [0, 1.85], [-0.28, 1.6], [-0.55, 1.0], [-0.68, 0.1]]
  const white = C.white
  const blue = M('#1f6fd6', { rough: 0.35 })
  const teak = M('#b77a45', { rough: 0.7 })
  const rail = []
  for (let i = 1; i < hull.length; i++) if (hull[i][1] > -0.2) rail.push([hull[i][0] * 0.92, 0.66, hull[i][1] * 0.95 - 0.04])
  return grp(
    plan(hull, 0.18, white, { p: [0, 0.09, 0], s: [0.62, 0.9, 1] }),
    plan(hull, 0.18, white, { p: [0, 0.26, 0], s: [0.88, 0.97, 1] }),
    plan(hull, 0.12, blue, { p: [0, 0.41, 0], s: [0.99, 1, 1] }),
    plan(hull, 0.12, white, { p: [0, 0.53, 0], s: [1.02, 1.01, 1] }, 0.02),
    mesh(G.rbox(0.98, 0.05, 1.5, 0.02), teak, { p: [0, 0.6, -0.72] }),
    mesh(G.rbox(1.0, 0.03, 0.06, 0.01), blue, { p: [0, 0.63, -1.48] }),
    // windshield
    mesh(G.rbox(1.12, 0.36, 0.05, 0.02), C.clear, { p: [0, 0.78, 0.18], r: [-0.55, 0, 0] }),
    mesh(G.rbox(1.16, 0.05, 0.07, 0.02), C.chrome, { p: [0, 0.94, 0.08], r: [-0.55, 0, 0] }),
    both((s) => rod([s * 0.58, 0.6, 0.3], [s * 0.56, 0.95, 0.07], 0.02, C.chrome)),
    // seats + wheel
    both((s) => grp(
      mesh(G.rbox(0.36, 0.14, 0.36, 0.05), white, { p: [0, 0.7, 0] }),
      mesh(G.rbox(0.36, 0.38, 0.1, 0.05), white, { p: [0, 0.88, -0.17], r: [-0.15, 0, 0] }),
      { p: [s * 0.24, 0, -0.35] },
    )),
    mesh(G.rbox(0.3, 0.2, 0.18, 0.04), C.dark, { p: [0.24, 0.72, -0.02] }),
    mesh(G.torus(0.11, 0.022, PI * 2, 8, 18), C.black, { p: [0.24, 0.86, -0.08], r: [-0.4, 0, 0] }),
    mesh(G.rbox(0.76, 0.2, 0.32, 0.06), white, { p: [0, 0.68, -1.25] }),
    // bow rail + cleat
    mesh(G.tube(rail, 0.02, 24), C.chrome),
    rep(3, (i) => rod([0.38 - i * 0.0, 0.58, 0.9 + i * 0.25], [0.38 - i * 0.0, 0.66, 0.9 + i * 0.25], 0.015, C.chrome)),
    rep(3, (i) => rod([-0.38, 0.58, 0.9 + i * 0.25], [-0.38, 0.66, 0.9 + i * 0.25], 0.015, C.chrome)),
    // outboard motor
    mesh(G.rbox(0.36, 0.48, 0.36, 0.1), C.black, { p: [0, 0.82, -1.78] }),
    mesh(G.rbox(0.37, 0.08, 0.37, 0.03), blue, { p: [0, 0.74, -1.78] }),
    mesh(G.rbox(0.14, 0.62, 0.18, 0.05), C.dark, { p: [0, 0.32, -1.82] }),
    mesh(G.cyl(0.05, 0.05, 0.24, 10), C.dark, { p: [0, 0.06, -1.82], r: AZ }),
    rep(3, (i) => mesh(G.rbox(0.05, 0.2, 0.02, 0.01), C.steel, { p: [0, 0.06, -1.95], r: [0, 0, (i * 2 * PI) / 3] })),
  )
}

function quadBike() {
  const red = M('#ff6a1a', { rough: 0.4 })
  const w = (x, z) => wheel(0.32, 0.32, C.steel, { p: [x, 0.32, z], tread: true })
  return grp(
    w(0.56, 0.58), w(-0.56, 0.58), w(0.58, -0.58), w(-0.58, -0.58),
    mesh(G.rbox(0.62, 0.24, 1.3, 0.06), C.dark, { p: [0, 0.48, 0] }),
    // fenders
    side([[-0.4, 0], [0.42, 0], [0.32, 0.16], [-0.3, 0.16]], 1.2, red, { p: [0, 0.68, 0.58] }, 0.03),
    side([[-0.42, 0], [0.4, 0], [0.3, 0.16], [-0.32, 0.16]], 1.24, red, { p: [0, 0.68, -0.58] }, 0.03),
    mesh(G.rbox(0.55, 0.32, 0.6, 0.1), red, { p: [0, 0.82, 0.12] }),
    mesh(G.rbox(0.44, 0.16, 0.8, 0.07), C.black, { p: [0, 0.94, -0.36] }),
    // headlights
    both((s) => mesh(G.cyl(0.08, 0.08, 0.05, 14), C.head, { p: [s * 0.22, 0.8, 0.98], r: AZ })),
    mesh(G.rbox(0.7, 0.14, 0.12, 0.04), red, { p: [0, 0.8, 0.94] }),
    // racks
    both((s) => rod([s * 0.42, 0.92, 0.55], [s * 0.42, 0.92, 0.98], 0.025, C.black)),
    rep(3, (i) => rod([-0.42, 0.92, 0.6 + i * 0.17], [0.42, 0.92, 0.6 + i * 0.17], 0.02, C.black)),
    both((s) => rod([s * 0.44, 0.92, -0.58], [s * 0.44, 0.92, -1.0], 0.025, C.black)),
    rep(3, (i) => rod([-0.44, 0.92, -0.62 - i * 0.17], [0.44, 0.92, -0.62 - i * 0.17], 0.02, C.black)),
    // bull bar
    rod([-0.3, 0.45, 1.12], [0.3, 0.45, 1.12], 0.03, C.black),
    both((s) => rod([s * 0.3, 0.45, 1.12], [s * 0.3, 0.72, 0.98], 0.03, C.black)),
    // handlebars
    rod([0, 0.86, 0.36], [0, 1.15, 0.3], 0.035, C.steel),
    rod([-0.4, 1.17, 0.26], [0.4, 1.17, 0.26], 0.025, C.steel),
    both((s) => mesh(G.cyl(0.035, 0.035, 0.14, 10), C.black, { p: [s * 0.36, 1.17, 0.26], r: AX })),
    mesh(G.rbox(0.18, 0.08, 0.1, 0.03), C.dark, { p: [0, 1.17, 0.3] }),
    // exhaust
    rod([-0.25, 0.55, 0.1], [-0.3, 0.7, -0.95], 0.04, C.chrome),
  )
}

function jetpack() {
  const red = M('#e83a2c', { metal: 0.35, rough: 0.35 })
  const flameO = M('#ff7a1a', { emissive: '#ff5a00', glow: 2, opacity: 0.85 })
  const flameY = M('#ffe680', { emissive: '#ffd040', glow: 2.4 })
  const strap = M('#3a2a1e', { rough: 0.85 })
  const tank = (s) => grp(
    mesh(G.capsule(0.21, 0.7, 16), red, { p: [0, 1.17, 0] }),
    mesh(G.torus(0.215, 0.03, PI * 2, 8, 20), C.chrome, { p: [0, 1.4, 0], r: [PI / 2, 0, 0] }),
    mesh(G.torus(0.215, 0.03, PI * 2, 8, 20), C.chrome, { p: [0, 0.94, 0], r: [PI / 2, 0, 0] }),
    mesh(G.cyl(0.05, 0.05, 0.1, 10), C.chrome, { p: [0, 1.76, 0] }),
    mesh(G.lathe([[0.15, 0], [0.13, 0.06], [0.09, 0.16], [0.08, 0.24]], 18), C.dark, { p: [0, 0.4, 0] }),
    mesh(G.cone(0.13, 0.42, 14), flameO, { p: [0, 0.2, 0], r: [PI, 0, 0] }),
    mesh(G.cone(0.07, 0.28, 12), flameY, { p: [0, 0.26, 0], r: [PI, 0, 0] }),
    { p: [s * 0.25, 0, -0.18] },
  )
  return grp(
    both(tank),
    mesh(G.rbox(0.42, 0.85, 0.16, 0.06), C.steel, { p: [0, 1.2, 0.0] }),
    mesh(G.rbox(0.3, 0.3, 0.06, 0.04), C.dark, { p: [0, 1.32, 0.09] }),
    mesh(G.cyl(0.08, 0.08, 0.04, 16), C.head, { p: [0, 1.36, 0.12], r: AZ }),
    // shoulder straps
    both((s) => mesh(G.tube([[s * 0.15, 1.6, 0.05], [s * 0.17, 1.72, 0.25], [s * 0.18, 1.5, 0.45], [s * 0.18, 1.05, 0.42], [s * 0.15, 0.85, 0.15]], 0.035, 20), strap)),
    rod([-0.2, 0.86, 0.2], [0.2, 0.86, 0.2], 0.04, strap),
    // control arms
    both((s) => grp(
      rod([s * 0.45, 1.0, -0.12], [s * 0.5, 0.9, 0.42], 0.03, C.steel),
      mesh(G.rbox(0.1, 0.18, 0.1, 0.03), C.black, { p: [s * 0.5, 0.94, 0.46] }),
      mesh(G.sphere(0.03, 10, 8), C.tail, { p: [s * 0.5, 1.04, 0.48] }),
    )),
    both((s) => mesh(G.extrude([[0, 0], [0.22, -0.05], [0.22, -0.2], [0, -0.3]], 0.04, 0.01), red, { p: [s * 0.43, 1.45, -0.18], r: [0, s > 0 ? 0 : PI, 0] })),
  )
}

function castleTower() {
  const stone = M('#ffffff', { map: stoneTex(), rough: 0.9 })
  const slate = M('#3d5fa8', { rough: 0.6 })
  const dark = M('#1c1a22', { rough: 0.9 })
  const wood = M('#7a4a26', { rough: 0.8 })
  const arch = [[-0.1, 0], [0.1, 0], [0.1, 0.18], [0.07, 0.25], [0, 0.28], [-0.07, 0.25], [-0.1, 0.18]]
  const win = (a, y) => grp(mesh(G.extrude(arch, 0.12), dark, { p: [0, 0, 0] }), { p: [Math.sin(a) * 0.86, y, Math.cos(a) * 0.86], r: [0, a, 0] })
  const flag = M('#e8322b', { rough: 0.6, side: 2 })
  return grp(
    mesh(G.cyl(1.12, 1.2, 0.3, 20), M('#6a6d74', { rough: 0.9 }), { p: [0, 0.15, 0] }),
    mesh(G.cyl(0.86, 0.94, 2.7, 20), stone, { p: [0, 1.65, 0] }),
    mesh(G.cyl(1.04, 0.86, 0.24, 20), M('#8a8d94', { rough: 0.9 }), { p: [0, 3.1, 0] }),
    mesh(G.cyl(1.04, 1.04, 0.3, 20), stone, { p: [0, 3.37, 0] }),
    rep(10, (i) => {
      const a = (i / 10) * PI * 2
      return mesh(G.rbox(0.34, 0.34, 0.22, 0.03), M('#9a9da4', { rough: 0.9 }), { p: [Math.sin(a) * 0.93, 3.68, Math.cos(a) * 0.93], r: [0, a, 0] })
    }),
    mesh(G.cyl(0.62, 0.62, 0.8, 18), stone, { p: [0, 3.8, 0] }),
    mesh(G.cone(0.82, 1.5, 18), slate, { p: [0, 4.95, 0] }),
    mesh(G.cyl(0.84, 0.84, 0.06, 18), M('#2c4680', { rough: 0.6 }), { p: [0, 4.22, 0] }),
    rod([0, 5.6, 0], [0, 6.3, 0], 0.025, C.steel),
    mesh(G.extrude([[0, 0], [0.55, -0.12], [0, -0.26]], 0.02), flag, { p: [0, 6.28, 0], r: [0, -0.6, 0] }),
    mesh(G.sphere(0.05, 10, 8), M('#ffd23f', { metal: 0.8, rough: 0.3 }), { p: [0, 6.32, 0] }),
    // windows
    grp(win(-0.5, 1.6), win(0.35, 2.3), win(-1.4, 2.5), win(0.9, 1.2), mesh(G.extrude(arch, 0.12), dark, { p: [Math.sin(-0.4) * 0.6, 3.7, Math.cos(-0.4) * 0.6], r: [0, -0.4, 0] })),
    // door
    grp(
      mesh(G.extrude([[-0.3, 0], [0.3, 0], [0.3, 0.5], [0.2, 0.68], [0, 0.75], [-0.2, 0.68], [-0.3, 0.5]], 0.14, 0.02), M('#5b5e66', { rough: 0.9 }), { s: [1.25, 1.18, 1] }),
      mesh(G.extrude([[-0.26, 0], [0.26, 0], [0.26, 0.48], [0.17, 0.62], [0, 0.68], [-0.17, 0.62], [-0.26, 0.48]], 0.14), wood, { p: [0, 0, 0.04] }),
      rep(3, (i) => mesh(G.box(0.53, 0.03, 0.03), C.black, { p: [0, 0.15 + i * 0.18, 0.12] })),
      mesh(G.torus(0.04, 0.01, PI * 2, 6, 12), C.steel, { p: [0.15, 0.32, 0.12] }),
      { p: [Math.sin(-0.25) * 0.9, 0.3, Math.cos(-0.25) * 0.9], r: [0, -0.25, 0] },
    ),
  )
}

function hoverCouch() {
  const fab = M('#7a3ad6', { rough: 0.85 })
  const cush = M('#9a5cf0', { rough: 0.9 })
  const glow = M('#7ff6ff', { emissive: '#40e8ff', glow: 2.2 })
  const beam = M('#7ff6ff', { emissive: '#40e8ff', glow: 1, opacity: 0.28 })
  const pad = (x, z) => grp(
    mesh(G.cyl(0.2, 0.24, 0.12, 18), C.dark, { p: [0, 0, 0] }),
    mesh(G.torus(0.2, 0.03, PI * 2, 8, 20), glow, { p: [0, -0.06, 0], r: [PI / 2, 0, 0] }),
    mesh(G.cyl(0.13, 0.13, 0.02, 16), glow, { p: [0, -0.07, 0] }),
    mesh(G.cyl(0.14, 0.3, 0.5, 16, true), beam, { p: [0, -0.33, 0] }),
    { p: [x, 0.62, z] },
  )
  return grp(
    mesh(G.rbox(2.0, 0.34, 0.9, 0.1), fab, { p: [0, 0.86, 0] }),
    mesh(G.box(2.02, 0.05, 0.92), glow, { p: [0, 0.74, 0] }),
    both((s) => mesh(G.rbox(0.9, 0.18, 0.72, 0.08), cush, { p: [s * 0.47, 1.1, 0.08] })),
    mesh(G.rbox(2.0, 0.72, 0.26, 0.1), fab, { p: [0, 1.3, -0.33], r: [-0.1, 0, 0] }),
    both((s) => mesh(G.rbox(0.88, 0.5, 0.18, 0.08), cush, { p: [s * 0.47, 1.36, -0.16], r: [-0.14, 0, 0] })),
    both((s) => mesh(G.rbox(0.26, 0.56, 0.96, 0.1), fab, { p: [s * 1.06, 1.08, 0.0] })),
    both((s) => mesh(G.rbox(0.28, 0.06, 0.98, 0.03), glow, { p: [s * 1.06, 1.38, 0.0] })),
    // throw pillow
    mesh(G.rbox(0.36, 0.34, 0.12, 0.08), M('#ffd23f', { rough: 0.9 }), { p: [-0.72, 1.32, 0.05], r: [-0.2, 0.3, 0.1] }),
    pad(-0.75, 0.25), pad(0.75, 0.25), pad(-0.75, -0.25), pad(0.75, -0.25),
    // rear thrusters
    both((s) => grp(
      mesh(G.cyl(0.12, 0.16, 0.3, 14), C.steel, { r: AZ }),
      mesh(G.cyl(0.1, 0.1, 0.02, 14), glow, { p: [0, 0, -0.16], r: AZ }),
      { p: [s * 0.6, 0.9, -0.55] },
    )),
  )
}

function giantCrystal() {
  const c1 = M('#b77bff', { emissive: '#7a2bd6', glow: 0.7, rough: 0.12, metal: 0.1, flat: true })
  const c2 = M('#e0b8ff', { emissive: '#a060ff', glow: 0.8, rough: 0.12, metal: 0.1, flat: true })
  const rock = M('#5d5866', { rough: 0.95, flat: true })
  const shard = (h, r, mat, p, rot) => grp(
    mesh(G.cyl(r, r * 0.85, h, 6), mat, { p: [0, h / 2, 0] }),
    mesh(G.cone(r, r * 2.2, 6), mat, { p: [0, h + r * 1.1, 0] }),
    { p, r: rot },
  )
  return grp(
    mesh(G.ico(0.9, 1), rock, { p: [0, 0.2, 0], s: [1.3, 0.45, 1.1] }),
    mesh(G.ico(0.5, 0), rock, { p: [0.95, 0.15, 0.3], s: [1, 0.6, 1] }),
    mesh(G.ico(0.45, 0), rock, { p: [-0.9, 0.12, -0.2], s: [1, 0.5, 1] }),
    shard(1.9, 0.36, c1, [0, 0.3, 0], [0.05, 0, -0.06]),
    shard(1.2, 0.26, c2, [0.45, 0.25, 0.25], [0.3, 0, -0.5]),
    shard(1.05, 0.24, c1, [-0.5, 0.25, 0.2], [0.25, 0.4, 0.55]),
    shard(0.9, 0.2, c2, [0.1, 0.25, -0.45], [-0.55, 0, 0.1]),
    shard(0.7, 0.17, c1, [-0.3, 0.2, 0.55], [0.7, 0, 0.3]),
    shard(0.6, 0.15, c2, [0.75, 0.2, -0.25], [-0.2, 0, -0.9]),
    shard(0.5, 0.13, c2, [-0.85, 0.2, -0.3], [-0.2, 0, 0.9]),
    rep(6, (i) => mesh(G.ico(0.05, 0), c2, { p: [Math.sin(i * 1.1) * 1.3, 0.9 + (i % 3) * 0.5, Math.cos(i * 1.1) * 1.0] })),
  )
}

function robotArm() {
  const yel = M('#ffb81c', { rough: 0.4, metal: 0.2 })
  const hz = tex('myth-hazard', 64, 16, (x, w, h) => {
    x.fillStyle = '#ffb81c'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#1a1a1a'
    for (let i = -2; i < 8; i++) {
      x.beginPath()
      x.moveTo(i * 12, h)
      x.lineTo(i * 12 + 6, h)
      x.lineTo(i * 12 + 6 + h, 0)
      x.lineTo(i * 12 + h, 0)
      x.fill()
    }
  }, { repeat: [4, 1] })
  const joint = (r, w) => grp(
    mesh(G.cyl(r, r, w, 20), C.dark, { r: AX }),
    mesh(G.cyl(r * 0.6, r * 0.6, w + 0.04, 16), C.steel, { r: AX }),
  )
  const finger = (s) => grp(
    mesh(G.rbox(0.08, 0.32, 0.12, 0.03), C.steel, { p: [0, 0.16, 0] }),
    mesh(G.rbox(0.08, 0.14, 0.12, 0.03), C.dark, { p: [-s * 0.04, 0.36, 0], r: [0, 0, s * 0.5] }),
    { p: [s * 0.13, 0.08, 0], r: [0, 0, -s * 0.15] },
  )
  const gripper = grp(
    mesh(G.cyl(0.12, 0.12, 0.12, 16), C.steel, { p: [0, 0, 0] }),
    mesh(G.rbox(0.36, 0.1, 0.18, 0.03), C.dark, { p: [0, 0.08, 0] }),
    finger(1), finger(-1),
    { p: [0, 0.98, 0], r: [0, 0, 0] },
  )
  const fore = grp(
    joint(0.18, 0.42),
    mesh(G.rbox(0.24, 1.05, 0.26, 0.06), yel, { p: [0, 0.52, 0] }),
    mesh(G.tube([[0.14, 0.1, -0.08], [0.16, 0.5, -0.1], [0.14, 0.95, -0.06]], 0.025, 12), C.black),
    gripper,
    { p: [0, 1.35, 0], r: [1.9, 0, 0] },
  )
  const upper = grp(
    joint(0.24, 0.5),
    mesh(G.rbox(0.3, 1.35, 0.32, 0.07), yel, { p: [0, 0.68, 0] }),
    both((s) => mesh(G.box(0.02, 0.9, 0.18), C.dark, { p: [s * 0.16, 0.68, 0] })),
    fore,
    { p: [0, 0.82, 0], r: [-0.45, 0, 0] },
  )
  return grp(
    mesh(G.cyl(0.72, 0.8, 0.14, 22), C.dark, { p: [0, 0.07, 0] }),
    rep(6, (i) => mesh(G.cyl(0.04, 0.04, 0.04, 8), C.steel, { p: [Math.sin(i) * 0.66, 0.15, Math.cos(i) * 0.66] })),
    mesh(G.cyl(0.5, 0.56, 0.36, 22), M('#ffffff', { map: hz, rough: 0.5 }), { p: [0, 0.32, 0] }),
    mesh(G.cyl(0.42, 0.48, 0.2, 22), yel, { p: [0, 0.6, 0] }),
    both((s) => mesh(G.rbox(0.1, 0.42, 0.42, 0.04), yel, { p: [s * 0.3, 0.82, 0] })),
    upper,
  )
}

function jetSki() {
  const outline = [[-0.38, -1.0], [0.38, -1.0], [0.44, 0.0], [0.34, 0.7], [0.14, 1.1], [0, 1.2], [-0.14, 1.1], [-0.34, 0.7], [-0.44, 0.0]]
  const body = M('#18c0c8', { rough: 0.35 })
  const accent = M('#ff3fa0', { rough: 0.35 })
  return grp(
    plan(outline, 0.14, C.white, { p: [0, 0.07, 0], s: [0.7, 0.9, 1] }),
    plan(outline, 0.2, C.white, { p: [0, 0.24, 0], s: [0.95, 0.98, 1] }),
    plan(outline, 0.07, accent, { p: [0, 0.37, 0], s: [1.0, 1, 1] }),
    // nose cowl sloping up to the bars
    side([[0.0, 0], [1.05, 0], [0.7, 0.18], [0.12, 0.36], [0.0, 0.36]], 0.62, body, { p: [0, 0.38, 0.1] }, 0.05),
    side([[0, 0], [0.42, 0], [0.32, 0.1], [0, 0.1]], 0.64, C.black, { p: [0, 0.74, 0.12] }, 0.02),
    mesh(G.rbox(0.5, 0.22, 0.04, 0.02), C.clear, { p: [0, 0.82, 0.42], r: [-0.8, 0, 0] }),
    // saddle
    mesh(G.rbox(0.36, 0.2, 1.0, 0.09), C.black, { p: [0, 0.52, -0.42] }),
    mesh(G.rbox(0.56, 0.06, 0.35, 0.02), body, { p: [0, 0.42, -0.86] }),
    both((s) => mesh(G.rbox(0.18, 0.06, 0.8, 0.02), body, { p: [s * 0.32, 0.42, -0.4] })),
    // handlebars
    rod([0, 0.78, 0.18], [0, 0.96, 0.06], 0.04, C.dark),
    rod([-0.42, 0.98, 0.04], [0.42, 0.98, 0.04], 0.025, C.steel),
    both((s) => mesh(G.cyl(0.035, 0.035, 0.14, 10), C.black, { p: [s * 0.38, 0.98, 0.04], r: AX })),
    mesh(G.rbox(0.14, 0.06, 0.1, 0.02), C.head, { p: [0, 0.72, 0.62], r: [-0.4, 0, 0] }),
    // jet nozzle
    mesh(G.cyl(0.08, 0.1, 0.16, 14), C.dark, { p: [0, 0.14, -1.02], r: AZ }),
    // side sponsons
    both((s) => mesh(G.rbox(0.06, 0.08, 0.5, 0.03), accent, { p: [s * 0.44, 0.22, -0.5] })),
  )
}

function motorcycle() {
  const red = M('#d41f2a', { metal: 0.4, rough: 0.3 })
  const spokeWheel = (z) => grp(
    mesh(G.torus(0.33, 0.07, PI * 2, 10, 24), C.tire, { r: [0, PI / 2, 0] }),
    mesh(G.torus(0.27, 0.025, PI * 2, 8, 24), C.chrome, { r: [0, PI / 2, 0] }),
    mesh(G.cyl(0.07, 0.07, 0.16, 12), C.chrome, { r: AX }),
    rep(6, (i) => mesh(G.box(0.02, 0.54, 0.02), C.steel, { r: [(i * PI) / 6, 0, 0] })),
    mesh(G.cyl(0.18, 0.18, 0.02, 18), C.steel, { p: [0.06, 0, 0], r: AX }),
    { p: [0, 0.4, z] },
  )
  return grp(
    spokeWheel(0.82), spokeWheel(-0.78),
    // frame
    rod([0, 0.42, -0.78], [0, 0.75, 0.05], 0.04, C.dark),
    rod([0, 0.95, -0.55], [0, 1.0, 0.45], 0.04, C.dark),
    // engine
    mesh(G.rbox(0.34, 0.36, 0.44, 0.06), C.steel, { p: [0, 0.6, 0.08] }),
    rep(4, (i) => mesh(G.box(0.4, 0.025, 0.36), C.dark, { p: [0, 0.82 + i * 0.05, 0.16], r: [0.3, 0, 0] })),
    mesh(G.cyl(0.12, 0.12, 0.4, 16), C.chrome, { p: [0, 0.55, 0.0], r: AX }),
    // tank + seat + tail
    mesh(G.capsule(0.17, 0.36, 14), red, { p: [0, 1.04, 0.2], r: [PI / 2 + 0.15, 0, 0], s: [1.15, 1, 0.9] }),
    mesh(G.rbox(0.3, 0.12, 0.55, 0.06), C.black, { p: [0, 1.04, -0.3], r: [-0.08, 0, 0] }),
    side([[-0.3, 0], [0.12, 0], [0.12, 0.14], [-0.4, 0.24]], 0.26, red, { p: [0, 0.98, -0.5] }, 0.03),
    mesh(G.rbox(0.12, 0.05, 0.04, 0.02), C.tail, { p: [0, 1.15, -0.92] }),
    mesh(G.torus(0.4, 0.045, PI * 0.55, 6, 14), red, { p: [0, 0.4, -0.78], r: [0, -PI / 2, PI * 0.42] }),
    mesh(G.torus(0.4, 0.04, PI * 0.5, 6, 14), red, { p: [0, 0.4, 0.82], r: [0, -PI / 2, PI * 0.3] }),
    // front fork + bars + headlight
    both((s) => rod([s * 0.1, 0.42, 0.82], [s * 0.1, 1.2, 0.5], 0.03, C.chrome)),
    mesh(G.rbox(0.28, 0.1, 0.12, 0.03), C.dark, { p: [0, 1.18, 0.52] }),
    rod([-0.38, 1.3, 0.42], [0.38, 1.3, 0.42], 0.022, C.chrome),
    both((s) => rod([s * 0.1, 1.18, 0.52], [s * 0.2, 1.3, 0.44], 0.022, C.chrome)),
    both((s) => mesh(G.cyl(0.03, 0.03, 0.14, 10), C.black, { p: [s * 0.36, 1.3, 0.42], r: AX })),
    mesh(G.cyl(0.12, 0.1, 0.14, 16), C.chrome, { p: [0, 1.06, 0.66], r: AZ }),
    mesh(G.cyl(0.1, 0.1, 0.02, 16), C.head, { p: [0, 1.06, 0.74], r: AZ }),
    both((s) => mesh(G.sphere(0.03, 8, 6), C.chrome, { p: [s * 0.3, 1.42, 0.42] })),
    // exhaust
    rod([0.16, 0.5, 0.15], [0.2, 0.48, -0.4], 0.04, C.chrome),
    mesh(G.cyl(0.06, 0.07, 0.4, 14), C.chrome, { p: [0.21, 0.54, -0.62], r: [PI / 2 - 0.15, 0, 0] }),
  )
}

function sportsCar() {
  const red = M('#ff2a2a', { metal: 0.45, rough: 0.25 })
  const w = (x, z) => wheel(0.25, 0.24, M('#2c2f36', { metal: 0.8, rough: 0.3 }), { p: [x, 0.25, z] })
  return grp(
    side([[-1.15, 0.12], [1.18, 0.12], [1.24, 0.24], [1.15, 0.36], [0.45, 0.48], [-0.9, 0.56], [-1.16, 0.52]], 1.12, red, { p: [0, 0, 0] }, 0.06),
    side([[-0.62, 0.48], [0.42, 0.48], [0.02, 0.8], [-0.44, 0.8], [-0.82, 0.56]], 0.94, C.glass, {}, 0.02),
    mesh(G.rbox(0.9, 0.04, 0.42, 0.02), red, { p: [0, 0.82, -0.2] }),
    // hood vents
    both((s) => mesh(G.rbox(0.22, 0.03, 0.3, 0.01), C.black, { p: [s * 0.22, 0.52, 0.72], r: [0.15, 0, 0] })),
    // wheel arches
    both((s) => mesh(G.cyl(0.32, 0.32, 0.06, 18, false), C.black, { p: [s * 0.55, 0.27, 0.78], r: AX })),
    both((s) => mesh(G.cyl(0.32, 0.32, 0.06, 18, false), C.black, { p: [s * 0.55, 0.27, -0.72], r: AX })),
    w(0.57, 0.78), w(-0.57, 0.78), w(0.57, -0.72), w(-0.57, -0.72),
    // lights
    both((s) => mesh(G.rbox(0.28, 0.06, 0.1, 0.02), C.head, { p: [s * 0.38, 0.36, 1.18], r: [0.3, s * 0.25, 0] })),
    both((s) => mesh(G.rbox(0.3, 0.07, 0.04, 0.02), C.tail, { p: [s * 0.36, 0.46, -1.22] })),
    mesh(G.rbox(0.6, 0.08, 0.04, 0.02), C.black, { p: [0, 0.2, 1.25] }),
    both((s) => mesh(G.rbox(0.04, 0.12, 0.36, 0.02), C.black, { p: [s * 0.62, 0.34, -0.28] })),
    // spoiler
    mesh(G.rbox(1.12, 0.04, 0.22, 0.02), C.black, { p: [0, 0.8, -1.02], r: [0.12, 0, 0] }),
    both((s) => mesh(G.rbox(0.04, 0.2, 0.1, 0.01), C.black, { p: [s * 0.4, 0.66, -1.0] })),
    both((s) => mesh(G.box(0.03, 0.14, 0.28), C.black, { p: [s * 0.56, 0.78, -1.02] })),
    // exhausts + mirrors
    both((s) => mesh(G.cyl(0.04, 0.04, 0.1, 12), C.chrome, { p: [s * 0.2, 0.2, -1.22], r: AZ })),
    both((s) => mesh(G.rbox(0.12, 0.06, 0.08, 0.02), red, { p: [s * 0.52, 0.6, 0.3] })),
  )
}

export const models = {
  'Go-Kart': goKart,
  Speedboat: speedboat,
  'Quad Bike': quadBike,
  Jetpack: jetpack,
  'Castle Tower': castleTower,
  'Hover Couch': hoverCouch,
  'Giant Crystal': giantCrystal,
  'Robot Arm': robotArm,
  'Jet Ski': jetSki,
  Motorcycle: motorcycle,
  'Sports Car': sportsCar,
}
