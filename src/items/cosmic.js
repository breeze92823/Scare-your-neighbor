// Cosmic Index items: big vehicles, space hardware and odd treasures. Each model stands on y = 0 facing +Z.
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

const C = {
  tire: M('#1d1d22', { rough: 0.92 }),
  chrome: M('#dfe3e8', { metal: 0.95, rough: 0.2 }),
  steel: M('#8b919a', { metal: 0.75, rough: 0.38 }),
  dark: M('#2c2f36', { metal: 0.3, rough: 0.6 }),
  black: M('#18191d', { rough: 0.75 }),
  glass: M('#263a50', { metal: 0.6, rough: 0.1 }),
  clear: M('#bfe6ff', { metal: 0.2, rough: 0.05, opacity: 0.4 }),
  head: M('#fffbe6', { emissive: '#fff0b0', glow: 1.6 }),
  tail: M('#ff3a30', { emissive: '#ff1a1a', glow: 1.3 }),
  white: M('#f4f5f7', { rough: 0.45 }),
  gold: M('#ffc531', { metal: 0.95, rough: 0.25 }),
  wood: M('#8a5a32', { rough: 0.8 }),
}

function wheel(r, w, rim = C.chrome, o = {}) {
  const parts = [
    mesh(G.cyl(r, r, w, 22), C.tire, { r: AX }),
    mesh(G.torus(r * 0.86, r * 0.14, PI * 2, 8, 22), C.tire, { p: [w / 2 - r * 0.08, 0, 0], r: [0, PI / 2, 0] }),
    mesh(G.torus(r * 0.86, r * 0.14, PI * 2, 8, 22), C.tire, { p: [-w / 2 + r * 0.08, 0, 0], r: [0, PI / 2, 0] }),
    mesh(G.cyl(r * 0.58, r * 0.58, w + 0.02, 18), rim, { r: AX }),
    mesh(G.cyl(r * 0.2, r * 0.2, w + 0.06, 10), C.dark, { r: AX }),
  ]
  if (o.tread) {
    const n = o.tread === true ? 12 : o.tread
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2
      parts.push(mesh(G.box(w * 0.92, r * 0.14, r * 0.2), C.tire, { p: [0, Math.cos(a) * r, Math.sin(a) * r], r: [-a, 0, 0] }))
    }
  }
  return grp(...parts, { p: o.p })
}

function hummer() {
  const body = M('#e8b923', { metal: 0.3, rough: 0.4 })
  const w = (x, z) => wheel(0.44, 0.42, C.dark, { p: [x, 0.44, z], tread: 14 })
  return grp(
    w(0.82, 0.95), w(-0.82, 0.95), w(0.82, -0.95), w(-0.82, -0.95),
    mesh(G.rbox(1.5, 0.5, 2.9, 0.06), body, { p: [0, 0.82, 0] }),
    mesh(G.rbox(1.44, 0.14, 0.95, 0.04), body, { p: [0, 1.12, 0.95], r: [0.05, 0, 0] }),
    // fender flares
    both((s) => mesh(G.rbox(0.22, 0.12, 1.0, 0.04), C.black, { p: [s * 0.82, 1.0, 0.95] })),
    both((s) => mesh(G.rbox(0.22, 0.12, 1.0, 0.04), C.black, { p: [s * 0.82, 1.0, -0.95] })),
    // cabin
    mesh(G.rbox(1.42, 0.58, 1.75, 0.05), body, { p: [0, 1.36, -0.45] }),
    mesh(G.rbox(1.3, 0.38, 0.05, 0.02), C.glass, { p: [0, 1.4, 0.43], r: [-0.12, 0, 0] }),
    both((s) => rep(2, (i) => mesh(G.rbox(0.04, 0.34, 0.7, 0.02), C.glass, { p: [s * 0.715, 1.42, -0.05 - i * 0.82] }))),
    both((s) => mesh(G.box(0.02, 0.4, 0.06), C.black, { p: [s * 0.72, 0.85, -0.45] })),
    // grille + lights
    mesh(G.rbox(1.0, 0.36, 0.08, 0.03), C.black, { p: [0, 0.95, 1.46] }),
    rep(7, (i) => mesh(G.box(0.07, 0.3, 0.04), C.chrome, { p: [-0.36 + i * 0.12, 0.95, 1.5] })),
    both((s) => mesh(G.cyl(0.1, 0.1, 0.06, 16), C.head, { p: [s * 0.6, 0.98, 1.47], r: AZ })),
    // bull bar + bumpers
    mesh(G.rbox(1.6, 0.16, 0.18, 0.04), C.black, { p: [0, 0.62, 1.5] }),
    both((s) => rod([s * 0.4, 0.62, 1.58], [s * 0.4, 1.1, 1.58], 0.035, C.black)),
    rod([-0.4, 1.1, 1.58], [0.4, 1.1, 1.58], 0.035, C.black),
    mesh(G.rbox(1.6, 0.16, 0.16, 0.04), C.black, { p: [0, 0.62, -1.5] }),
    // roof light bar + rack
    mesh(G.rbox(1.2, 0.08, 0.14, 0.03), C.black, { p: [0, 1.72, 0.25] }),
    rep(4, (i) => mesh(G.cyl(0.06, 0.06, 0.05, 12), C.head, { p: [-0.42 + i * 0.28, 1.72, 0.33], r: AZ })),
    both((s) => rod([s * 0.62, 1.7, 0.2], [s * 0.62, 1.7, -1.2], 0.025, C.black)),
    // spare + mirrors
    wheel(0.32, 0.22, C.dark, { p: [0, 1.2, -1.58] }),
    both((s) => mesh(G.rbox(0.08, 0.16, 0.1, 0.02), C.black, { p: [s * 0.82, 1.3, 0.38] })),
  )
}

const policeTex = () =>
  tex('cos-police', 256, 64, (x, w, h) => {
    x.fillStyle = '#ffffff'
    x.fillRect(0, 0, w, h)
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i % 2 ? '#1f4fd8' : '#ffd21f'
      x.fillRect(i * 16, h - 26, 16, 13)
      x.fillStyle = i % 2 ? '#ffd21f' : '#1f4fd8'
      x.fillRect(i * 16, h - 13, 16, 13)
    }
    x.fillStyle = '#1f4fd8'
    x.font = 'bold 30px sans-serif'
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('POLICE', w / 2, 20)
  })

function policeVan() {
  const white = C.white
  const blue = M('#1f4fd8', { rough: 0.4 })
  const lb = M('#3060ff', { emissive: '#2050ff', glow: 2.2 })
  const lr = M('#ff3030', { emissive: '#ff1010', glow: 2.2 })
  const w = (x, z) => wheel(0.32, 0.3, C.steel, { p: [x, 0.32, z] })
  return grp(
    side([[-1.45, 0.22], [1.35, 0.22], [1.5, 0.45], [1.5, 0.85], [1.0, 1.25], [0.75, 1.85], [-1.45, 1.85]], 1.4, white, {}, 0.05),
    mesh(G.rbox(1.3, 0.52, 0.05, 0.02), C.glass, { p: [0, 1.56, 0.96], r: [-0.39, 0, 0] }),
    both((s) => side([[0.55, 1.3], [0.95, 1.3], [0.75, 1.75], [0.55, 1.75]], 0.04, C.glass, { p: [s * 0.73, 0, 0] })),
    both((s) => mesh(G.box(0.04, 0.4, 1.2), C.glass, { p: [s * 0.73, 1.55, -0.6] })),
    decal(policeTex(), 2.3, 0.58, { p: [-0.75, 0.82, -0.2], r: [0, -PI / 2, 0] }),
    decal(policeTex(), 2.3, 0.58, { p: [0.75, 0.82, -0.2], r: [0, PI / 2, 0] }),
    mesh(G.box(1.3, 0.12, 0.02), blue, { p: [0, 0.75, 1.53] }),
    // light bar
    mesh(G.rbox(1.1, 0.1, 0.3, 0.03), C.dark, { p: [0, 1.95, 0.4] }),
    mesh(G.rbox(0.44, 0.14, 0.26, 0.05), lr, { p: [-0.26, 2.06, 0.4] }),
    mesh(G.rbox(0.44, 0.14, 0.26, 0.05), lb, { p: [0.26, 2.06, 0.4] }),
    // lights, grille, bumpers
    both((s) => mesh(G.rbox(0.26, 0.14, 0.05, 0.02), C.head, { p: [s * 0.5, 0.68, 1.53] })),
    mesh(G.rbox(0.5, 0.18, 0.05, 0.02), C.black, { p: [0, 0.55, 1.53] }),
    mesh(G.rbox(1.5, 0.16, 0.14, 0.04), C.black, { p: [0, 0.3, 1.55] }),
    mesh(G.rbox(1.5, 0.16, 0.14, 0.04), C.black, { p: [0, 0.3, -1.52] }),
    both((s) => mesh(G.rbox(0.3, 0.12, 0.04, 0.02), C.tail, { p: [s * 0.5, 0.65, -1.53] })),
    mesh(G.box(0.02, 1.2, 0.02), C.black, { p: [0, 1.1, -1.52] }),
    both((s) => mesh(G.rbox(0.06, 0.2, 0.12, 0.02), C.black, { p: [s * 0.8, 1.25, 0.9] })),
    w(0.66, 0.95), w(-0.66, 0.95), w(0.66, -0.95), w(-0.66, -0.95),
  )
}

function camperVan() {
  const teal = M('#3cc0b4', { rough: 0.4 })
  const cream = M('#fbf3df', { rough: 0.45 })
  const board = M('#ff7a3c', { rough: 0.4 })
  const w = (x, z) => wheel(0.3, 0.28, C.white, { p: [x, 0.3, z] })
  const frontV = [[-0.7, 0], [0.7, 0], [0.7, 0.2], [0, 0.55], [-0.7, 0.2]]
  return grp(
    mesh(G.rbox(1.4, 0.72, 2.6, 0.22), teal, { p: [0, 0.62, 0] }),
    mesh(G.rbox(1.4, 0.62, 2.6, 0.22), cream, { p: [0, 1.22, 0] }),
    mesh(G.extrude(frontV, 0.04), teal, { p: [0, 0.82, 1.29] }),
    mesh(G.cyl(0.13, 0.13, 0.04, 18), C.chrome, { p: [0, 1.0, 1.32], r: AZ }),
    both((s) => mesh(G.rbox(0.58, 0.36, 0.05, 0.08), C.glass, { p: [s * 0.32, 1.3, 1.29] })),
    both((s) => mesh(G.cyl(0.1, 0.1, 0.06, 16), C.head, { p: [s * 0.5, 0.75, 1.3], r: AZ })),
    both((s) => rep(3, (i) => mesh(G.rbox(0.04, 0.32, 0.55, 0.06), C.glass, { p: [s * 0.7, 1.3, 0.7 - i * 0.68] }))),
    both((s) => mesh(G.box(0.02, 0.05, 2.4), C.chrome, { p: [s * 0.71, 0.98, 0] })),
    mesh(G.rbox(1.5, 0.12, 0.12, 0.04), C.chrome, { p: [0, 0.3, 1.32] }),
    mesh(G.rbox(1.5, 0.12, 0.12, 0.04), C.chrome, { p: [0, 0.3, -1.32] }),
    both((s) => mesh(G.rbox(0.16, 0.2, 0.04, 0.03), C.tail, { p: [s * 0.55, 0.72, -1.3] })),
    // pop-top roof
    side([[-1.1, 0], [0.9, 0], [0.9, 0.08], [-1.1, 0.4]], 1.2, M('#f0e6c8', { rough: 0.8 }), { p: [0, 1.5, 0] }, 0.03),
    // roof rack + surfboard
    both((s) => rod([s * 0.55, 1.62, 1.05], [s * 0.55, 1.62, 0.95], 0.03, C.black)),
    rod([-0.55, 1.65, 1.0], [0.55, 1.65, 1.0], 0.03, C.black),
    mesh(G.capsule(0.2, 2.2, 12), board, { p: [0, 1.98, -0.05], r: [PI / 2 + 0.16, 0, 0], s: [1, 1, 0.22] }),
    mesh(G.box(0.03, 0.02, 2.4), C.white, { p: [0, 2.03, -0.05], r: [0.16, 0, 0] }),
    w(0.66, 0.85), w(-0.66, 0.85), w(0.66, -0.85), w(-0.66, -0.85),
  )
}

function hotAirBalloon() {
  const gores = tex('cos-balloon', 256, 128, (x, w, h) => {
    const cols = ['#ff3b3b', '#ffd23f', '#ff3b3b', '#3f8cff']
    for (let i = 0; i < 16; i++) {
      x.fillStyle = cols[i % 4]
      x.fillRect((i * w) / 16, 0, w / 16 + 1, h)
    }
    x.fillStyle = '#ffffff'
    x.fillRect(0, h * 0.42, w, h * 0.1)
    x.fillStyle = 'rgba(0,0,0,0.15)'
    for (let i = 0; i < 16; i++) x.fillRect((i * w) / 16, 0, 2, h)
  })
  const env = M('#ffffff', { map: gores, rough: 0.55 })
  const wicker = tex('cos-wicker', 64, 64, (x, w, h) => {
    x.fillStyle = '#9a6a35'
    x.fillRect(0, 0, w, h)
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      x.fillStyle = (r + c) % 2 ? '#c08a4a' : '#7a4e24'
      x.fillRect(c * 8 + 1, r * 8 + 1, 6, 6)
    }
  }, { repeat: [3, 2] })
  const basket = M('#ffffff', { map: wicker, rough: 0.9 })
  const rope = M('#d8c8a0', { rough: 0.9 })
  const flame = M('#ffb030', { emissive: '#ff8a10', glow: 2.4 })
  const pts = [[0.22, 0], [0.4, 0.3], [0.85, 0.9], [1.22, 1.6], [1.36, 2.25], [1.3, 2.85], [1.02, 3.35], [0.58, 3.65], [0, 3.76]]
  return grp(
    mesh(G.lathe(pts, 24), env, { p: [0, 1.75, 0] }),
    mesh(G.cyl(0.24, 0.24, 0.12, 20, true), M('#7a2a1a', { rough: 0.8, side: 2 }), { p: [0, 1.75, 0] }),
    mesh(G.rbox(0.66, 0.5, 0.66, 0.06), basket, { p: [0, 0.25, 0] }),
    mesh(G.rbox(0.72, 0.08, 0.72, 0.04), M('#6a3e1a', { rough: 0.8 }), { p: [0, 0.52, 0] }),
    // ropes basket -> envelope, plus load lines on the envelope
    both((s) => rod([s * 0.32, 0.54, 0.32], [s * 0.22, 1.72, 0.22], 0.012, rope, 6)),
    both((s) => rod([s * 0.32, 0.54, -0.32], [s * 0.22, 1.72, -0.22], 0.012, rope, 6)),
    // burner frame
    both((s) => rod([s * 0.18, 0.95, 0], [s * 0.3, 0.54, 0], 0.015, C.steel, 6)),
    mesh(G.cyl(0.13, 0.11, 0.14, 14), C.steel, { p: [0, 0.98, 0] }),
    mesh(G.cone(0.1, 0.45, 12), flame, { p: [0, 1.28, 0] }),
    mesh(G.cone(0.05, 0.3, 10), C.head, { p: [0, 1.22, 0] }),
    // sandbags
    both((s) => mesh(G.sphere(0.08, 10, 8), M('#c9b48a', { rough: 0.95 }), { p: [s * 0.36, 0.3, 0.2], s: [0.8, 1.1, 0.8] })),
    mesh(G.sphere(0.08, 10, 8), M('#c9b48a', { rough: 0.95 }), { p: [-0.1, 0.3, 0.36], s: [0.8, 1.1, 0.8] }),
  )
}

function goldenBell() {
  const bell = [[0.78, 0], [0.76, 0.06], [0.64, 0.2], [0.55, 0.5], [0.52, 0.85], [0.45, 1.02], [0.24, 1.12], [0, 1.14]]
  const beam = M('#7a4a26', { rough: 0.85 })
  const ribbon = M('#d4202a', { rough: 0.6 })
  return grp(
    // frame
    both((s) => mesh(G.rbox(0.22, 0.18, 1.2, 0.04), beam, { p: [s * 1.1, 0.09, 0] })),
    both((s) => mesh(G.rbox(0.2, 2.6, 0.2, 0.04), beam, { p: [s * 1.1, 1.4, 0] })),
    both((s) => rod([s * 1.1, 0.15, 0.5], [s * 1.1, 0.9, 0.08], 0.05, beam, 8)),
    both((s) => rod([s * 1.1, 0.15, -0.5], [s * 1.1, 0.9, -0.08], 0.05, beam, 8)),
    mesh(G.rbox(2.6, 0.24, 0.26, 0.05), beam, { p: [0, 2.72, 0] }),
    both((s) => mesh(G.cone(0.12, 0.2, 12), C.gold, { p: [s * 1.1, 2.94, 0] })),
    // bell
    mesh(G.lathe(bell, 24), C.gold, { p: [0, 0.95, 0], s: 1.15 }),
    mesh(G.torus(0.88, 0.04, PI * 2, 8, 28), C.gold, { p: [0, 0.99, 0], r: [PI / 2, 0, 0] }),
    mesh(G.torus(0.62, 0.025, PI * 2, 8, 28), M('#e0a010', { metal: 0.9, rough: 0.35 }), { p: [0, 1.6, 0], r: [PI / 2, 0, 0] }),
    mesh(G.torus(0.58, 0.025, PI * 2, 8, 28), M('#e0a010', { metal: 0.9, rough: 0.35 }), { p: [0, 1.78, 0], r: [PI / 2, 0, 0] }),
    mesh(G.torus(0.16, 0.05, PI * 2, 8, 18), C.gold, { p: [0, 2.4, 0] }),
    mesh(G.cyl(0.06, 0.06, 0.12, 10), C.steel, { p: [0, 2.56, 0] }),
    // clapper
    rod([0, 1.9, 0], [0, 0.9, 0], 0.03, C.steel),
    mesh(G.sphere(0.13, 14, 10), M('#c08a10', { metal: 0.9, rough: 0.35 }), { p: [0, 0.86, 0] }),
    // ribbon bow
    both((s) => mesh(G.extrude([[0, 0], [0.26, 0.14], [0.26, -0.14]], 0.05, 0.01), ribbon, { p: [s * 0.02, 2.2, 0.48], r: [0, s > 0 ? 0 : PI, 0] })),
    mesh(G.sphere(0.06, 10, 8), ribbon, { p: [0, 2.2, 0.5] }),
    both((s) => mesh(G.box(0.06, 0.4, 0.03), ribbon, { p: [s * 0.1, 1.98, 0.52], r: [0, 0, s * 0.25] })),
  )
}

function alienBrain() {
  const brainM = M('#ff9ac8', { rough: 0.45, emissive: '#5a1030', glow: 0.5 })
  const ridge = M('#f07ab0', { rough: 0.5, emissive: '#5a1030', glow: 0.4 })
  const goo = M('#6bff6a', { emissive: '#30ff40', glow: 1.2, opacity: 0.55 })
  const neon = M('#6bff6a', { emissive: '#30ff40', glow: 2 })
  const metal = M('#6a7280', { metal: 0.85, rough: 0.3 })
  const R = [0.42, 0.5, 0.62]
  const cy = 1.25
  const wrinkles = []
  for (const s of [1, -1]) {
    wrinkles.push(mesh(G.sphere(1, 20, 14), brainM, { p: [s * 0.24, cy, 0], s: R }))
    for (let k = 0; k < 4; k++) {
      const b0 = 0.35 + k * 0.33
      const pts = []
      for (let i = 0; i <= 22; i++) {
        const t = -0.35 + (i / 22) * (PI + 0.7)
        const b = b0 + 0.13 * Math.sin(t * 7 + k * 1.7)
        pts.push([s * 0.24 + s * Math.cos(b) * R[0] * 1.0, cy + Math.sin(b) * Math.sin(t) * R[1] * 1.0, Math.sin(b) * Math.cos(t) * R[2] * 1.0])
      }
      wrinkles.push(mesh(G.tube(pts, 0.04, 40), ridge))
    }
  }
  return grp(
    mesh(G.lathe([[0.95, 0], [0.95, 0.16], [0.8, 0.26], [0.72, 0.5], [0.78, 0.56], [0, 0.56]], 24), metal, {}),
    mesh(G.torus(0.8, 0.04, PI * 2, 8, 28), neon, { p: [0, 0.32, 0], r: [PI / 2, 0, 0] }),
    rep(6, (i) => mesh(G.rbox(0.12, 0.1, 0.06, 0.02), neon, { p: [Math.sin(i * 1.05 + 0.3) * 0.9, 0.12, Math.cos(i * 1.05 + 0.3) * 0.9], r: [0, i * 1.05 + 0.3, 0] })),
    mesh(G.cyl(0.72, 0.72, 0.5, 24), goo, { p: [0, 0.82, 0] }),
    mesh(G.dome(0.74, PI / 2, 24, 12), C.clear, { p: [0, 1.06, 0], s: [1, 1.15, 1] }),
    mesh(G.cyl(0.74, 0.74, 0.52, 24, true), C.clear, { p: [0, 0.82, 0] }),
    mesh(G.torus(0.74, 0.04, PI * 2, 8, 28), metal, { p: [0, 1.08, 0], r: [PI / 2, 0, 0] }),
    mesh(G.cyl(0.12, 0.16, 0.5, 12), brainM, { p: [0, 0.82, 0] }),
    ...wrinkles,
    // cables
    both((s) => mesh(G.tube([[s * 0.5, 0.45, -0.6], [s * 0.85, 0.35, -0.85], [s * 1.05, 0.1, -0.7], [s * 1.2, 0.04, -0.3]], 0.04, 16), C.black)),
    both((s) => mesh(G.sphere(0.06, 10, 8), neon, { p: [s * 0.3, 1.02, 0.66] })),
  )
}

function robotButler() {
  const body = M('#c8ced8', { metal: 0.8, rough: 0.3 })
  const tux = M('#1c1d24', { rough: 0.6 })
  const eye = M('#7ff6ff', { emissive: '#40e8ff', glow: 2 })
  const tie = M('#d4202a', { rough: 0.5 })
  return grp(
    // wheeled base
    mesh(G.cyl(0.42, 0.5, 0.28, 22), C.dark, { p: [0, 0.2, 0] }),
    rep(3, (i) => mesh(G.cyl(0.08, 0.08, 0.1, 12), C.black, { p: [Math.sin(i * 2.1) * 0.36, 0.06, Math.cos(i * 2.1) * 0.36], r: [0, i * 2.1, PI / 2] })),
    mesh(G.cyl(0.16, 0.2, 0.3, 14), body, { p: [0, 0.48, 0] }),
    // torso (tail coat + shirt front)
    mesh(G.lathe([[0.5, 0], [0.48, 0.3], [0.44, 0.7], [0.48, 0.85], [0.3, 0.95], [0, 0.95]], 22), tux, { p: [0, 0.62, 0] }),
    side([[0.0, 0], [0.12, 0], [0.12, 0.62], [0.0, 0.62]], 0.36, M('#f4f5f7', { rough: 0.6 }), { p: [0, 0.82, 0.36] }),
    rep(3, (i) => mesh(G.sphere(0.025, 8, 6), C.gold, { p: [0, 1.05 + i * -0.13, 0.49] })),
    both((s) => mesh(G.extrude([[0, 0], [0.13, 0.08], [0.13, -0.08]], 0.05, 0.01), tie, { p: [s * 0.02, 1.48, 0.42], r: [0, s > 0 ? 0 : PI, 0] })),
    mesh(G.sphere(0.04, 8, 6), tie, { p: [0, 1.48, 0.45] }),
    // neck + head
    mesh(G.cyl(0.1, 0.12, 0.14, 12), body, { p: [0, 1.62, 0] }),
    mesh(G.rbox(0.62, 0.48, 0.5, 0.12), body, { p: [0, 1.92, 0] }),
    mesh(G.rbox(0.5, 0.24, 0.04, 0.06), C.black, { p: [0, 1.96, 0.25] }),
    both((s) => mesh(G.sphere(0.06, 12, 8), eye, { p: [s * 0.13, 1.97, 0.27] })),
    rep(4, (i) => mesh(G.box(0.03, 0.06, 0.02), C.dark, { p: [-0.09 + i * 0.06, 1.75, 0.26] })),
    both((s) => mesh(G.cyl(0.09, 0.09, 0.08, 14), C.steel, { p: [s * 0.34, 1.92, 0], r: AX })),
    rod([0, 2.16, 0], [0, 2.4, 0], 0.02, C.steel),
    mesh(G.sphere(0.06, 12, 8), M('#ff3a30', { emissive: '#ff1a1a', glow: 1.5 }), { p: [0, 2.43, 0] }),
    // bowler hat
    mesh(G.cyl(0.36, 0.36, 0.03, 20), tux, { p: [0, 2.17, 0] }),
    mesh(G.dome(0.22, PI / 2, 18, 8), tux, { p: [0, 2.18, 0], s: [1, 1.1, 1] }),
    // right arm holding a tray out
    mesh(G.sphere(0.12, 12, 8), body, { p: [0.55, 1.4, 0] }),
    rod([0.55, 1.4, 0], [0.62, 1.05, 0.12], 0.07, body),
    mesh(G.sphere(0.08, 10, 8), C.steel, { p: [0.62, 1.05, 0.12] }),
    rod([0.62, 1.05, 0.12], [0.62, 1.22, 0.5], 0.06, body),
    mesh(G.cyl(0.36, 0.36, 0.03, 22), C.chrome, { p: [0.62, 1.26, 0.55] }),
    mesh(G.torus(0.36, 0.02, PI * 2, 6, 24), C.chrome, { p: [0.62, 1.28, 0.55], r: [PI / 2, 0, 0] }),
    mesh(G.lathe([[0.0, 0], [0.07, 0], [0.09, 0.14], [0.1, 0.16]], 14), C.white, { p: [0.55, 1.28, 0.58] }),
    mesh(G.torus(0.04, 0.012, PI * 2, 6, 10), C.white, { p: [0.66, 1.36, 0.58] }),
    mesh(G.cyl(0.03, 0.04, 0.2, 10), M('#3aa05a', { rough: 0.2, opacity: 0.8 }), { p: [0.75, 1.37, 0.5] }),
    // left arm with a towel
    mesh(G.sphere(0.12, 12, 8), body, { p: [-0.55, 1.4, 0] }),
    rod([-0.55, 1.4, 0], [-0.62, 1.0, 0.05], 0.07, body),
    mesh(G.sphere(0.08, 10, 8), C.steel, { p: [-0.62, 1.0, 0.05] }),
    rod([-0.62, 1.0, 0.05], [-0.58, 0.78, 0.3], 0.06, body),
    mesh(G.rbox(0.08, 0.36, 0.22, 0.03), C.white, { p: [-0.6, 0.78, 0.28] }),
  )
}

function steamTrain() {
  const green = M('#1f7a4a', { rough: 0.4, metal: 0.3 })
  const red = M('#d42a20', { rough: 0.45 })
  const iron = M('#22252b', { metal: 0.5, rough: 0.5 })
  const steam = M('#ffffff', { rough: 1 })
  const drive = (z, r) => grp(
    mesh(G.cyl(r, r, 0.1, 20), red, { r: AX }),
    mesh(G.torus(r * 0.92, r * 0.1, PI * 2, 6, 20), iron, { r: [0, PI / 2, 0] }),
    mesh(G.cyl(r * 0.2, r * 0.2, 0.14, 10), C.steel, { r: AX }),
    rep(4, (i) => mesh(G.box(0.11, r * 1.7, 0.04), iron, { r: [(i * PI) / 4, 0, 0] })),
    { p: [0, r, z] },
  )
  return grp(
    mesh(G.rbox(1.0, 0.24, 3.2, 0.04), iron, { p: [0, 0.48, -0.1] }),
    both((s) => grp(drive(0.75, 0.32), drive(0.05, 0.42), drive(-0.75, 0.42), { p: [s * 0.52, 0, 0] })),
    both((s) => rod([s * 0.6, 0.34, 0.75], [s * 0.6, 0.38, -0.75], 0.03, C.steel)),
    both((s) => mesh(G.rbox(0.25, 0.25, 0.5, 0.04), iron, { p: [s * 0.5, 0.6, 1.1] })),
    // boiler
    mesh(G.cyl(0.48, 0.48, 2.0, 22), green, { p: [0, 1.06, 0.3], r: AZ }),
    rep(3, (i) => mesh(G.torus(0.49, 0.02, PI * 2, 6, 24), C.gold, { p: [0, 1.06, -0.4 + i * 0.6] })),
    mesh(G.cyl(0.5, 0.5, 0.3, 22), iron, { p: [0, 1.06, 1.42], r: AZ }),
    mesh(G.cyl(0.36, 0.36, 0.04, 20), iron, { p: [0, 1.06, 1.58], r: AZ }),
    mesh(G.sphere(0.05, 8, 6), C.gold, { p: [0, 1.06, 1.61] }),
    // stack, dome, headlamp, bell
    mesh(G.lathe([[0.14, 0], [0.13, 0.25], [0.2, 0.45], [0.26, 0.6], [0.26, 0.66], [0.2, 0.66]], 18), iron, { p: [0, 1.45, 1.25] }),
    mesh(G.cyl(0.16, 0.2, 0.2, 16), green, { p: [0, 1.55, 0.35] }),
    mesh(G.dome(0.16, PI / 2, 16, 8), C.gold, { p: [0, 1.65, 0.35] }),
    mesh(G.rbox(0.22, 0.22, 0.2, 0.04), iron, { p: [0, 1.62, 1.55] }),
    mesh(G.cyl(0.08, 0.08, 0.04, 14), C.head, { p: [0, 1.62, 1.66], r: AZ }),
    // cab
    mesh(G.rbox(1.1, 1.0, 0.9, 0.04), red, { p: [0, 1.1, -0.95] }),
    mesh(G.rbox(1.25, 0.08, 1.1, 0.03), iron, { p: [0, 1.64, -0.95] }),
    both((s) => mesh(G.rbox(0.04, 0.34, 0.4, 0.03), C.glass, { p: [s * 0.55, 1.3, -0.95] })),
    both((s) => mesh(G.rbox(0.3, 0.26, 0.04, 0.03), C.glass, { p: [s * 0.3, 1.32, -0.49] })),
    mesh(G.rbox(1.0, 0.28, 0.4, 0.04), iron, { p: [0, 0.75, -1.55] }),
    mesh(G.ico(0.2, 0), M('#111', { rough: 0.9, flat: true }), { p: [0, 0.95, -1.55], s: [2, 0.6, 0.9] }),
    // cowcatcher
    side([[0, 0], [0.45, 0], [0, 0.4]], 0.95, red, { p: [0, 0.1, 1.45] }),
    rep(4, (i) => rod([-0.36 + i * 0.24, 0.12, 1.88], [-0.36 + i * 0.24, 0.48, 1.47], 0.025, iron)),
    // steam puffs
    mesh(G.sphere(0.24, 14, 10), steam, { p: [0, 2.3, 1.2] }),
    mesh(G.sphere(0.3, 14, 10), steam, { p: [0.05, 2.62, 0.85] }),
    mesh(G.sphere(0.36, 14, 10), steam, { p: [-0.05, 2.88, 0.4] }),
  )
}

function ufo() {
  const hullM = M('#b9c2cf', { metal: 0.9, rough: 0.25 })
  const rim = M('#8a94a4', { metal: 0.9, rough: 0.3 })
  const cols = ['#ff4040', '#ffd23f', '#40ff80', '#40c8ff']
  const alien = M('#7be05a', { rough: 0.5 })
  return grp(
    // legs
    rep(3, (i) => {
      const a = (i / 3) * PI * 2 + 0.5
      return grp(
        rod([Math.sin(a) * 0.7, 0.75, Math.cos(a) * 0.7], [Math.sin(a) * 1.15, 0.06, Math.cos(a) * 1.15], 0.04, rim),
        mesh(G.cyl(0.16, 0.18, 0.06, 14), rim, { p: [Math.sin(a) * 1.15, 0.03, Math.cos(a) * 1.15] }),
      )
    }),
    mesh(G.lathe([[0, 0], [0.5, 0.02], [1.1, 0.16], [1.7, 0.36], [1.75, 0.44], [1.4, 0.58], [0.8, 0.7], [0, 0.72]], 28), hullM, { p: [0, 0.6, 0] }),
    mesh(G.torus(1.72, 0.05, PI * 2, 8, 36), rim, { p: [0, 1.0, 0], r: [PI / 2, 0, 0] }),
    mesh(G.cyl(0.42, 0.5, 0.1, 22), M('#9ff8ff', { emissive: '#40f0ff', glow: 2 }), { p: [0, 0.58, 0] }),
    rep(12, (i) => {
      const a = (i / 12) * PI * 2
      return mesh(G.sphere(0.07, 10, 8), M(cols[i % 4], { emissive: cols[i % 4], glow: 2 }), { p: [Math.sin(a) * 1.48, 1.12, Math.cos(a) * 1.48] })
    }),
    // dome + pilot
    mesh(G.dome(0.72, PI / 2, 24, 12), M('#bfe6ff', { metal: 0.2, rough: 0.05, opacity: 0.5 }), { p: [0, 1.3, 0] }),
    mesh(G.torus(0.72, 0.05, PI * 2, 8, 28), rim, { p: [0, 1.31, 0], r: [PI / 2, 0, 0] }),
    mesh(G.sphere(0.28, 16, 12), alien, { p: [0, 1.62, 0.05], s: [1, 1.15, 0.95] }),
    both((s) => mesh(G.sphere(0.09, 12, 8), C.black, { p: [s * 0.12, 1.66, 0.28], s: [1, 1.5, 0.6], r: [0, 0, s * 0.4] })),
    mesh(G.cyl(0.18, 0.22, 0.2, 14), alien, { p: [0, 1.35, 0] }),
    both((s) => grp(rod([s * 0.1, 1.85, 0], [s * 0.2, 2.05, 0], 0.015, alien), mesh(G.sphere(0.04, 8, 6), alien, { p: [s * 0.2, 2.06, 0] }))),
  )
}

const solarTex = () =>
  tex('cos-solar', 64, 128, (x, w, h) => {
    x.fillStyle = '#0d1a4a'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#2a4cb8'
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) x.fillRect(c * 16 + 1, r * 16 + 1, 14, 14)
  })

function satellite() {
  const foil = M('#e8b23a', { metal: 0.9, rough: 0.35 })
  const panel = M('#ffffff', { map: solarTex(), metal: 0.5, rough: 0.3 })
  const frame = M('#c8ced8', { metal: 0.8, rough: 0.3 })
  const wing = (s) => grp(
    rod([s * 0.45, 0, 0], [s * 0.85, 0, 0], 0.04, frame),
    mesh(G.box(0.12, 0.12, 0.12), frame, { p: [s * 0.85, 0, 0] }),
    rep(3, (i) => mesh(G.box(0.7, 0.03, 1.05), panel, { p: [s * (1.3 + i * 0.75), 0, 0] })),
    mesh(G.box(2.3, 0.02, 0.04), frame, { p: [s * 2.05, 0, 0.53] }),
    mesh(G.box(2.3, 0.02, 0.04), frame, { p: [s * 2.05, 0, -0.53] }),
    { p: [0, 1.0, 0], r: [0.35, 0, 0] },
  )
  return grp(
    mesh(G.rbox(0.8, 0.9, 0.8, 0.06), foil, { p: [0, 1.0, 0] }),
    mesh(G.rbox(0.82, 0.06, 0.82, 0.02), frame, { p: [0, 1.45, 0] }),
    mesh(G.rbox(0.82, 0.06, 0.82, 0.02), frame, { p: [0, 0.55, 0] }),
    both(wing),
    // dish
    rod([0, 1.48, 0], [0, 1.75, 0.1], 0.04, frame),
    mesh(G.lathe([[0.02, 0], [0.25, 0.05], [0.45, 0.16], [0.5, 0.2], [0.48, 0.21], [0.02, 0.03]], 22), C.white, { p: [0, 1.75, 0.12], r: [0.9, 0, 0] }),
    rod([0, 1.86, 0.2], [0, 2.06, 0.38], 0.02, frame),
    mesh(G.sphere(0.04, 8, 6), C.tail, { p: [0, 2.07, 0.39] }),
    // antennae + thrusters
    rod([0.3, 0.5, 0.3], [0.45, 0.05, 0.45], 0.012, frame, 6),
    rod([-0.3, 1.45, -0.3], [-0.5, 2.1, -0.5], 0.012, frame, 6),
    mesh(G.lathe([[0.1, 0], [0.06, 0.12], [0.06, 0.2]], 14), C.dark, { p: [0, 0.32, 0] }),
    mesh(G.cyl(0.08, 0.08, 0.04, 14), M('#7ff6ff', { emissive: '#40e8ff', glow: 1.8 }), { p: [0, 0.32, 0] }),
    mesh(G.rbox(0.3, 0.2, 0.04, 0.02), M('#1a1a1a', { rough: 0.4 }), { p: [0, 1.0, 0.41] }),
    mesh(G.sphere(0.03, 8, 6), C.head, { p: [0.1, 1.05, 0.43] }),
  )
}

function spaceRover() {
  const body = M('#e8e8ea', { rough: 0.5 })
  const gold = C.gold
  const strut = M('#9aa2ae', { metal: 0.8, rough: 0.3 })
  const rw = (x, z) => wheel(0.24, 0.24, M('#b8bec8', { metal: 0.8, rough: 0.35 }), { p: [x, 0.24, z], tread: 12 })
  return grp(
    both((s) => grp(
      rw(s * 0.8, 0.85), rw(s * 0.8, 0.0), rw(s * 0.8, -0.85),
      rod([s * 0.8, 0.26, 0.85], [s * 0.72, 0.62, 0.3], 0.03, strut),
      rod([s * 0.72, 0.62, 0.3], [s * 0.72, 0.5, -0.45], 0.03, strut),
      rod([s * 0.8, 0.26, 0.0], [s * 0.72, 0.5, -0.45], 0.03, strut),
      rod([s * 0.8, 0.26, -0.85], [s * 0.72, 0.5, -0.45], 0.03, strut),
      rod([s * 0.72, 0.62, 0.3], [s * 0.52, 0.72, 0.1], 0.04, strut),
    )),
    mesh(G.rbox(1.05, 0.34, 1.5, 0.05), body, { p: [0, 0.82, 0] }),
    mesh(G.rbox(1.08, 0.06, 1.54, 0.02), gold, { p: [0, 0.66, 0] }),
    mesh(G.box(1.0, 0.03, 1.3), M('#ffffff', { map: solarTex(), metal: 0.5, rough: 0.3 }), { p: [0, 1.0, -0.05] }),
    // mast + camera head
    rod([0.3, 1.0, 0.55], [0.3, 1.8, 0.55], 0.04, strut),
    mesh(G.rbox(0.42, 0.18, 0.2, 0.04), body, { p: [0.3, 1.88, 0.55] }),
    both((s) => mesh(G.cyl(0.05, 0.05, 0.06, 12), C.black, { p: [0.3 + s * 0.1, 1.9, 0.67], r: AZ })),
    // dish
    rod([-0.3, 1.0, 0.25], [-0.3, 1.2, 0.25], 0.03, strut),
    mesh(G.cyl(0.24, 0.05, 0.06, 18), C.white, { p: [-0.3, 1.24, 0.25], r: [0.4, 0, 0] }),
    // RTG
    mesh(G.cyl(0.13, 0.13, 0.5, 14), M('#3a3d44', { metal: 0.6, rough: 0.5 }), { p: [0, 1.0, -0.88], r: [-0.8, 0, 0] }),
    rep(4, (i) => mesh(G.box(0.36, 0.02, 0.02), M('#3a3d44', { metal: 0.6, rough: 0.5 }), { p: [0, 0.92 + i * 0.05, -0.8 - i * 0.05], r: [-0.8, 0, (i * PI) / 4] })),
    // arm
    rod([-0.35, 0.8, 0.75], [-0.4, 0.7, 1.15], 0.035, strut),
    rod([-0.4, 0.7, 1.15], [-0.35, 0.35, 1.3], 0.035, strut),
    mesh(G.rbox(0.16, 0.16, 0.16, 0.03), gold, { p: [-0.35, 0.3, 1.32] }),
    mesh(G.cyl(0.03, 0.03, 0.12, 8), C.dark, { p: [-0.35, 0.18, 1.32] }),
  )
}

export const models = {
  Hummer: hummer,
  'Police Van': policeVan,
  'Camper Van': camperVan,
  'Hot Air Balloon': hotAirBalloon,
  'Golden Bell': goldenBell,
  'Alien Brain': alienBrain,
  'Robot Butler': robotButler,
  'Steam Train': steamTrain,
  UFO: ufo,
  Satellite: satellite,
  'Space Rover': spaceRover,
}
