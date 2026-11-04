// Horror Index items: spooky props with glowing magic. Each model stands on y = 0 facing +Z.
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
  black: M('#16161b', { rough: 0.8 }),
  iron: M('#2a2b31', { metal: 0.7, rough: 0.45 }),
  gold: M('#e8b030', { metal: 0.9, rough: 0.3 }),
  bone: M('#ece0c0', { rough: 0.7 }),
  boneD: M('#cdbb92', { rough: 0.75 }),
  socket: M('#1a120c', { rough: 0.9 }),
  stone: M('#7a7c84', { rough: 0.95 }),
  stoneD: M('#5a5c64', { rough: 0.95 }),
  wood: M('#5a3820', { rough: 0.85 }),
  woodL: M('#7a4e2a', { rough: 0.8 }),
  wax: M('#f2e6c8', { rough: 0.6 }),
  flame: M('#ffb030', { emissive: '#ff8a10', glow: 2.4 }),
  flameCore: M('#fff2b0', { emissive: '#ffe080', glow: 2.6 }),
  redEye: M('#ff3030', { emissive: '#ff1010', glow: 2.4 }),
  green: M('#7dff6a', { emissive: '#40ff50', glow: 1.8 }),
  purple: M('#c58aff', { emissive: '#9a40ff', glow: 2 }),
  ghost: M('#a8f0ff', { emissive: '#60d8ff', glow: 1.8 }),
  dirt: M('#4a3424', { rough: 1 }),
}

// A cartoon skull facing +Z (about 0.6 tall at s = 1), base at y = 0.
function skull(s = 1, o = {}, eyes = C.socket) {
  return grp(
    mesh(G.sphere(0.3, 18, 14), C.bone, { p: [0, 0.38, -0.02], s: [1, 0.95, 1.08] }),
    mesh(G.rbox(0.36, 0.22, 0.34, 0.08), C.bone, { p: [0, 0.16, 0.06] }),
    both((k) => mesh(G.sphere(0.085, 12, 10), eyes, { p: [k * 0.11, 0.33, 0.23], s: [1, 0.9, 0.6] })),
    mesh(G.cone(0.04, 0.08, 3), C.socket, { p: [0, 0.22, 0.29], r: [PI, 0, 0] }),
    rep(5, (i) => mesh(G.box(0.045, 0.06, 0.03), C.wax, { p: [-0.1 + i * 0.05, 0.1, 0.22] })),
    mesh(G.box(0.3, 0.012, 0.02), C.socket, { p: [0, 0.07, 0.23] }),
    { p: o.p, r: o.r, s },
  )
}

// Bone from a to b with knobbly ends.
function bone(a, b, r, mat = C.bone) {
  const va = new Vector3(...a)
  const vb = new Vector3(...b)
  const d = vb.clone().sub(va).normalize()
  const side = new Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? new Vector3(1, 0, 0) : UP).normalize().multiplyScalar(r * 0.9)
  const knob = (v) => grp(
    mesh(G.sphere(r * 1.5, 10, 8), mat, { p: v.clone().add(side).toArray() }),
    mesh(G.sphere(r * 1.5, 10, 8), mat, { p: v.clone().sub(side).toArray() }),
  )
  return grp(rod(a, b, r, mat), knob(va), knob(vb))
}

function flameAt(p, s = 1) {
  return grp(
    mesh(G.sphere(0.06, 10, 8), C.flame, { p: [0, 0.06, 0], s: [1, 1.1, 1] }),
    mesh(G.cone(0.06, 0.18, 10), C.flame, { p: [0, 0.18, 0] }),
    mesh(G.sphere(0.03, 8, 6), C.flameCore, { p: [0, 0.07, 0.02] }),
    { p, s },
  )
}

function candle(h, r, p) {
  return grp(
    mesh(G.cyl(r, r * 1.05, h, 14), C.wax, { p: [0, h / 2, 0] }),
    mesh(G.cyl(r * 1.08, r * 1.08, 0.03, 14), C.wax, { p: [0, h - 0.02, 0] }),
    mesh(G.capsule(r * 0.22, h * 0.3, 6), C.wax, { p: [r * 0.95, h * 0.78, 0] }),
    mesh(G.capsule(r * 0.18, h * 0.18, 6), C.wax, { p: [-r * 0.7, h * 0.84, r * 0.65] }),
    rod([0, h, 0], [0, h + 0.05, 0], 0.008, C.black, 5),
    flameAt([0, h + 0.03, 0], r * 5),
    { p },
  )
}

function jackOLantern() {
  const orange = M('#ff7a1a', { rough: 0.55 })
  const orangeD = M('#e05a0a', { rough: 0.6 })
  const glow = M('#ffd040', { emissive: '#ffa010', glow: 2.6 })
  const stemM = M('#5a6a2a', { rough: 0.8 })
  const cy = 0.68
  const R = [1.0, 0.68, 0.95]
  // Places a carved shape (outline in face-local x/y) on the pumpkin's front.
  const carve = (pts, x, y) => {
    const ny = (y - cy) / R[1]
    const nx = x / R[0]
    const z = R[2] * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny))
    return mesh(G.extrude(pts, 0.36), glow, { p: [x, y, z - 0.1], r: [-ny * 0.7, Math.atan2(nx, z / R[2]) * 0.9, 0] })
  }
  const lobes = rep(10, (i) => {
    const a = (i / 10) * PI * 2 + PI / 10
    return mesh(G.sphere(0.6, 18, 14), i % 2 ? orange : orangeD, { p: [Math.sin(a) * 0.42, cy, Math.cos(a) * 0.4], s: [0.95, 1.1, 0.95], r: [0, a, 0] })
  })
  const eye = [[-0.15, -0.09], [0.15, -0.09], [0, 0.14]]
  const nose = [[-0.07, -0.05], [0.07, -0.05], [0, 0.07]]
  const mouth = [[-0.42, 0.06], [-0.28, 0.0], [-0.2, 0.07], [-0.1, -0.01], [0.0, 0.07], [0.1, -0.01], [0.2, 0.07], [0.28, 0.0], [0.42, 0.06], [0.3, -0.12], [0.15, -0.18], [0.08, -0.1], [-0.02, -0.19], [-0.15, -0.18], [-0.3, -0.12]]
  return grp(
    lobes,
    mesh(G.sphere(0.82, 20, 14), orange, { p: [0, cy, 0], s: [1.15, 0.78, 1.08] }),
    carve(eye, -0.3, 0.88), carve(eye, 0.3, 0.88),
    carve(nose, 0, 0.72),
    carve(mouth, 0, 0.48),
    // stem + leaf + curly vine
    mesh(G.tube([[0, 1.05, 0], [0.02, 1.3, 0], [0.1, 1.5, 0.05], [0.24, 1.58, 0.08]], 0.09, 12), stemM),
    mesh(G.extrude([[0, 0], [0.18, 0.1], [0.32, 0.02], [0.2, -0.1]], 0.02, 0.01), M('#4a9a2a', { rough: 0.7 }), { p: [-0.05, 1.25, 0.05], r: [0.3, 2.4, 0.3] }),
    mesh(G.tube([[0.02, 1.2, 0.06], [-0.1, 1.28, 0.2], [-0.22, 1.24, 0.14], [-0.2, 1.16, 0.04], [-0.12, 1.2, 0.08]], 0.015, 20), M('#4a9a2a', { rough: 0.7 })),
    { r: [0, -0.4, 0] },
  )
}

function coffin() {
  const wood = M('#4a2c1c', { rough: 0.7 })
  const lidM = M('#5e3a24', { rough: 0.65 })
  const outline = [[-0.3, 0], [0.3, 0], [0.5, 1.5], [0.34, 2.1], [-0.34, 2.1], [-0.5, 1.5]]
  const inner = outline.map(([x, y]) => [x * 0.84, 0.16 + y * 0.86])
  const lid = grp(
    mesh(G.extrude(outline.map(([x, y]) => [x - 0.52, y]), 0.1, 0.02), lidM, { p: [0, 0, 0.05] }),
    mesh(G.box(0.08, 0.7, 0.04), C.gold, { p: [-0.52, 1.35, 0.13] }),
    mesh(G.box(0.4, 0.08, 0.04), C.gold, { p: [-0.52, 1.5, 0.13] }),
    rep(6, (i) => mesh(G.sphere(0.025, 8, 6), C.gold, { p: [-0.52 + (i < 3 ? -0.3 : 0.3) * (0.8 + (i % 3) * 0.2), 0.3 + (i % 3) * 0.6, 0.12] })),
    { p: [0.52, 0, 0.22], r: [0, 0.45, 0] },
  )
  return grp(
    mesh(G.cyl(0.9, 1.0, 0.16, 18), C.dirt, { p: [0, 0.08, 0], s: [1, 1, 0.7] }),
    grp(
      mesh(G.extrude(outline, 0.45, 0.02), wood, { p: [0, 0, 0] }),
      mesh(G.extrude(inner, 0.02), M('#5a0a1a', { rough: 0.9 }), { p: [0, 0.02, 0.225] }),
      mesh(G.rbox(0.3, 0.14, 0.1, 0.05), M('#7a1a2a', { rough: 0.9 }), { p: [0, 1.85, 0.26] }),
      both((k) => mesh(G.sphere(0.05, 10, 8), C.green, { p: [k * 0.09, 1.55, 0.27], s: [1.2, 0.7, 0.5] })),
      both((k) => rep(2, (i) => mesh(G.torus(0.07, 0.015, PI, 6, 10), C.gold, { p: [k * (0.4 + i * 0.04), 0.7 + i * 0.6, 0], r: [0, PI / 2, k > 0 ? -PI / 2 : PI / 2] }))),
      lid,
      { p: [0, 0.16, -0.1], r: [-0.12, 0, 0] },
    ),
    rep(4, (i) => mesh(G.cone(0.04, 0.18, 5), M('#3a5a2a', { rough: 0.9 }), { p: [-0.7 + i * 0.45, 0.2, 0.45 - (i % 2) * 0.2], r: [0, 0, (i - 1.5) * 0.3] })),
    { r: [0, -0.5, 0] },
  )
}

function cauldron() {
  const pot = M('#22232a', { metal: 0.6, rough: 0.45, side: 2 })
  const brew = M('#6bff4a', { emissive: '#30e020', glow: 1.4 })
  const bubble = M('#9aff80', { emissive: '#50ff30', glow: 1.6 })
  const steam = M('#9aff80', { emissive: '#40c020', glow: 0.8, opacity: 0.45 })
  return grp(
    // fire
    rep(3, (i) => mesh(G.cyl(0.08, 0.08, 1.0, 10), C.woodL, { p: [0, 0.08, 0], r: [PI / 2, (i * PI) / 3, 0] })),
    mesh(G.cone(0.28, 0.5, 10), C.flame, { p: [0, 0.3, 0] }),
    rep(4, (i) => mesh(G.cone(0.12, 0.34, 8), C.flame, { p: [Math.sin(i * 1.6) * 0.25, 0.22, Math.cos(i * 1.6) * 0.25], r: [Math.cos(i * 1.6) * 0.3, 0, -Math.sin(i * 1.6) * 0.3] })),
    mesh(G.cone(0.12, 0.28, 8), C.flameCore, { p: [0, 0.22, 0] }),
    // legs + pot
    rep(3, (i) => {
      const a = (i / 3) * PI * 2 + 0.4
      return rod([Math.sin(a) * 0.55, 0.0, Math.cos(a) * 0.55], [Math.sin(a) * 0.45, 0.5, Math.cos(a) * 0.45], 0.06, C.iron)
    }),
    mesh(G.lathe([[0.01, 0], [0.45, 0.04], [0.78, 0.25], [0.92, 0.55], [0.86, 0.85], [0.72, 0.98], [0.78, 1.04], [0.8, 1.08]], 24), pot, { p: [0, 0.42, 0] }),
    mesh(G.torus(0.8, 0.06, PI * 2, 8, 28), pot, { p: [0, 1.5, 0], r: [PI / 2, 0, 0] }),
    both((s) => mesh(G.torus(0.14, 0.035, PI * 2, 8, 14), C.iron, { p: [s * 0.92, 1.1, 0], r: [0, PI / 2, 0] })),
    mesh(G.cyl(0.74, 0.74, 0.04, 24), brew, { p: [0, 1.36, 0] }),
    // bubbles + steam
    rep(5, (i) => mesh(G.sphere(0.06 + (i % 3) * 0.04, 12, 8), bubble, { p: [Math.sin(i * 2.3) * 0.45, 1.4, Math.cos(i * 2.3) * 0.4] })),
    mesh(G.sphere(0.2, 12, 10), steam, { p: [0.1, 1.75, 0] }),
    mesh(G.sphere(0.26, 12, 10), steam, { p: [-0.15, 2.05, -0.05] }),
    mesh(G.sphere(0.18, 12, 10), steam, { p: [0.15, 2.35, 0.05] }),
    // ladle
    rod([0.25, 1.3, -0.1], [0.75, 2.1, -0.35], 0.035, C.woodL),
    mesh(G.sphere(0.06, 8, 6), C.woodL, { p: [0.76, 2.12, -0.36] }),
    // floating eyeball
    mesh(G.sphere(0.09, 12, 10), M('#f4f0e8', { rough: 0.4 }), { p: [-0.3, 1.42, 0.3] }),
    mesh(G.sphere(0.04, 8, 6), M('#d02020', { rough: 0.4 }), { p: [-0.3, 1.47, 0.36] }),
  )
}

const ofudaTex = () =>
  tex('hor-ofuda', 32, 96, (x, w, h) => {
    x.fillStyle = '#f4ecd2'
    x.fillRect(0, 0, w, h)
    x.strokeStyle = '#c01818'
    x.lineWidth = 3
    x.beginPath()
    x.moveTo(16, 8); x.lineTo(16, 30); x.moveTo(8, 18); x.lineTo(24, 18)
    x.moveTo(8, 40); x.lineTo(24, 52); x.moveTo(24, 40); x.lineTo(8, 52)
    x.moveTo(16, 62); x.lineTo(16, 88); x.moveTo(8, 74); x.lineTo(24, 70)
    x.stroke()
  })

function hauntedShrine() {
  const wood = M('#6a2a1e', { rough: 0.75 })
  const roofM = M('#2a2a32', { rough: 0.6 })
  const rope = M('#d8c08a', { rough: 0.9 })
  const roof = [[-1.15, 0], [-0.95, 0.06], [-0.6, 0.3], [-0.2, 0.62], [0, 0.7], [0.2, 0.62], [0.6, 0.3], [0.95, 0.06], [1.15, 0], [1.15, 0.1], [0.95, 0.18], [0.6, 0.44], [0, 0.86], [-0.6, 0.44], [-0.95, 0.18], [-1.15, 0.1]]
  const lantern = (x) => grp(
    mesh(G.rbox(0.3, 0.12, 0.3, 0.03), C.stone, { p: [0, 0.06, 0] }),
    mesh(G.cyl(0.07, 0.09, 0.45, 8), C.stone, { p: [0, 0.34, 0] }),
    mesh(G.rbox(0.3, 0.26, 0.3, 0.03), C.stone, { p: [0, 0.7, 0] }),
    mesh(G.box(0.16, 0.14, 0.32), C.ghost, { p: [0, 0.7, 0] }),
    mesh(G.cone(0.28, 0.2, 4), C.stoneD, { p: [0, 0.93, 0], r: [0, PI / 4, 0] }),
    mesh(G.sphere(0.04, 8, 6), C.stoneD, { p: [0, 1.05, 0] }),
    { p: [x, 0.2, 0.75] },
  )
  const wisp = (p, s) => grp(
    mesh(G.sphere(0.1, 12, 10), C.ghost, {}),
    mesh(G.cone(0.09, 0.3, 10), C.ghost, { p: [0.08, 0.15, -0.04], r: [0.3, 0, -0.6] }),
    { p, s },
  )
  return grp(
    // stone base + steps
    mesh(G.rbox(2.0, 0.2, 1.8, 0.04), C.stone, { p: [0, 0.1, 0] }),
    mesh(G.rbox(1.5, 0.16, 1.3, 0.04), C.stoneD, { p: [0, 0.28, -0.15] }),
    mesh(G.rbox(0.6, 0.08, 0.3, 0.02), C.stoneD, { p: [0, 0.24, 0.6] }),
    // shrine box on legs
    rep(4, (i) => mesh(G.box(0.09, 0.55, 0.09), wood, { p: [i % 2 ? 0.5 : -0.5, 0.63, i < 2 ? 0.25 : -0.5] })),
    mesh(G.rbox(1.15, 0.08, 0.95, 0.02), wood, { p: [0, 0.92, -0.12] }),
    mesh(G.rbox(1.0, 0.8, 0.8, 0.03), wood, { p: [0, 1.36, -0.15] }),
    mesh(G.box(0.7, 0.62, 0.02), M('#140a1e', { rough: 0.9 }), { p: [0, 1.34, 0.26] }),
    mesh(G.sphere(0.13, 12, 10), C.purple, { p: [0, 1.32, 0.18] }),
    mesh(G.cone(0.1, 0.28, 10), C.purple, { p: [0, 1.5, 0.18] }),
    both((s) => mesh(G.box(0.05, 0.66, 0.04), M('#3a1a10', { rough: 0.8 }), { p: [s * 0.36, 1.34, 0.27] })),
    // roof + ridge
    mesh(G.extrude(roof, 1.35, 0.02), roofM, { p: [0, 1.76, -0.12] }),
    mesh(G.rbox(0.18, 0.1, 1.45, 0.03), C.gold, { p: [0, 2.64, -0.12] }),
    both((s) => mesh(G.cyl(0.05, 0.05, 0.3, 8), C.gold, { p: [s * 0.25, 2.75, -0.12], r: [0, 0, s * 0.5] })),
    // shimenawa rope + paper streamers + talismans
    mesh(G.tube([[-0.55, 1.75, 0.3], [-0.25, 1.66, 0.33], [0, 1.64, 0.34], [0.25, 1.66, 0.33], [0.55, 1.75, 0.3]], 0.04, 16), rope),
    rep(3, (i) => mesh(G.extrude([[0, 0], [0.06, 0], [0.06, -0.08], [0.1, -0.08], [0.1, -0.18], [0.04, -0.18]], 0.01), M('#ffffff', { rough: 0.8 }), { p: [-0.32 + i * 0.3, 1.64, 0.36] })),
    decal(ofudaTex(), 0.12, 0.36, { p: [-0.46, 1.3, 0.27] }),
    decal(ofudaTex(), 0.12, 0.36, { p: [0.46, 1.25, 0.27], r: [0, 0, 0.15] }),
    decal(ofudaTex(), 0.12, 0.36, { p: [-0.501, 1.2, -0.05], r: [0, -PI / 2, 0.1] }),
    lantern(-0.72), lantern(0.72),
    wisp([-0.85, 1.6, 0.5], 1), wisp([0.9, 1.9, 0.2], 0.8), wisp([0.2, 2.15, 0.6], 0.6),
  )
}

const ripTex = () =>
  tex('hor-rip', 128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    x.fillStyle = '#3a3c44'
    x.font = 'bold 42px serif'
    x.textAlign = 'center'
    x.fillText('R.I.P', w / 2, 52)
    x.fillRect(24, 66, 80, 4)
    x.font = 'bold 18px serif'
    x.fillText('1666', w / 2, 96)
  })

function tombstone() {
  const arch = [[-0.55, 0]]
  for (let i = 0; i <= 12; i++) {
    const a = PI - (i / 12) * PI
    arch.push([Math.cos(a) * 0.55, 1.05 + Math.sin(a) * 0.5])
  }
  arch.push([0.55, 0])
  const moss = M('#4a7a3a', { rough: 0.9 })
  return grp(
    mesh(G.rbox(1.5, 0.12, 1.5, 0.04), C.stoneD, { p: [0, 0.06, -0.15] }),
    grp(
      mesh(G.extrude(arch, 0.24, 0.03), C.stone, {}),
      decal(ripTex(), 0.8, 0.8, { p: [0, 0.95, 0.16] }),
      mesh(G.box(0.03, 0.4, 0.02), C.socket, { p: [0.3, 1.2, 0.15], r: [0, 0, 0.5] }),
      mesh(G.box(0.03, 0.25, 0.02), C.socket, { p: [0.4, 0.95, 0.15], r: [0, 0, -0.3] }),
      mesh(G.sphere(0.12, 10, 8), moss, { p: [-0.48, 0.2, 0.1], s: [1, 0.6, 1] }),
      mesh(G.sphere(0.1, 10, 8), moss, { p: [-0.3, 1.52, 0.02], s: [1.5, 0.5, 1.4] }),
      { p: [0, 0.12, -0.4], r: [-0.06, 0, 0.06] },
    ),
    // grave mound + skeletal hand
    mesh(G.sphere(0.6, 16, 10), C.dirt, { p: [0, 0.1, 0.25], s: [1, 0.35, 1.2] }),
    grp(
      bone([0, -0.1, 0], [0.02, 0.32, 0.02], 0.035),
      mesh(G.rbox(0.16, 0.12, 0.06, 0.03), C.bone, { p: [0.02, 0.4, 0.02] }),
      rep(4, (i) => grp(
        rod([-0.06 + i * 0.04, 0.44, 0.02], [-0.07 + i * 0.045, 0.56, 0.04], 0.014, C.bone, 6),
        rod([-0.07 + i * 0.045, 0.56, 0.04], [-0.07 + i * 0.045, 0.62, 0.1], 0.012, C.bone, 6),
      )),
      rod([0.08, 0.38, 0.02], [0.14, 0.46, 0.06], 0.014, C.bone, 6),
      { p: [0.3, 0.2, 0.45], r: [0.2, 0, -0.2] },
    ),
    rep(5, (i) => mesh(G.cone(0.035, 0.2, 5), moss, { p: [-0.6 + i * 0.3, 0.18, 0.75 - (i % 2) * 0.15], r: [0, 0, (i - 2) * 0.25] })),
    candle(0.3, 0.05, [-0.45, 0.12, 0.55]),
  )
}

function gargoyle() {
  const st = M('#8a8c94', { rough: 0.9, flat: true })
  const stD = M('#6a6c74', { rough: 0.9, flat: true })
  const wing = [[0, 0], [0.25, 0.55], [0.6, 1.0], [1.05, 1.25], [0.98, 0.85], [0.82, 0.88], [0.72, 0.52], [0.52, 0.58], [0.42, 0.24], [0.2, 0.28]]
  const claws = (p) => rep(3, (i) => mesh(G.cone(0.03, 0.1, 5), stD, { p: [p[0] - 0.06 + i * 0.06, p[1], p[2] + 0.06], r: [PI / 2, 0, 0] }))
  return grp(
    // pedestal
    mesh(G.rbox(1.0, 0.2, 1.0, 0.03), stD, { p: [0, 0.1, 0] }),
    mesh(G.rbox(0.76, 0.75, 0.76, 0.03), st, { p: [0, 0.57, 0] }),
    mesh(G.rbox(1.0, 0.16, 1.0, 0.03), stD, { p: [0, 1.02, 0] }),
    // haunches + feet
    both((s) => mesh(G.sphere(0.22, 12, 10), st, { p: [s * 0.24, 1.3, -0.08], s: [0.9, 1, 1.25] })),
    both((s) => mesh(G.rbox(0.16, 0.12, 0.3, 0.04), st, { p: [s * 0.24, 1.16, 0.22] })),
    both((s) => claws([s * 0.24, 1.15, 0.36])),
    // hunched body
    mesh(G.sphere(0.32, 14, 12), st, { p: [0, 1.52, 0.0], s: [1, 1.2, 0.9], r: [0.4, 0, 0] }),
    // arms gripping the ledge
    both((s) => rod([s * 0.28, 1.68, 0.12], [s * 0.2, 1.2, 0.36], 0.07, st)),
    both((s) => claws([s * 0.2, 1.14, 0.42])),
    // head
    mesh(G.sphere(0.22, 14, 12), st, { p: [0, 1.88, 0.24] }),
    mesh(G.rbox(0.22, 0.14, 0.2, 0.05), st, { p: [0, 1.82, 0.42] }),
    rep(4, (i) => mesh(G.cone(0.018, 0.06, 4), C.bone, { p: [-0.07 + i * 0.047, 1.74, 0.5], r: [PI, 0, 0] })),
    both((s) => mesh(G.sphere(0.04, 8, 6), C.redEye, { p: [s * 0.08, 1.93, 0.42] })),
    both((s) => mesh(G.cone(0.05, 0.3, 8), stD, { p: [s * 0.13, 2.1, 0.18], r: [-0.5, 0, -s * 0.5] })),
    both((s) => mesh(G.cone(0.04, 0.14, 4), st, { p: [s * 0.2, 1.95, 0.2], r: [0, 0, -s * 1.2] })),
    // wings
    both((s) => mesh(G.extrude(wing, 0.04, 0.01), stD, { p: [s * 0.12, 1.6, -0.22], r: [0, s > 0 ? 0.5 : PI - 0.5, 0] })),
    // tail
    mesh(G.tube([[0, 1.3, -0.3], [0.1, 1.15, -0.5], [0.3, 1.1, -0.42], [0.38, 1.1, -0.2]], 0.04, 16), st),
    mesh(G.cone(0.07, 0.14, 4), stD, { p: [0.4, 1.1, -0.12], r: [PI / 2, 0, 0] }),
  )
}

const pageTex = () =>
  tex('hor-page', 64, 96, (x, w, h) => {
    x.fillStyle = '#efe0b8'
    x.fillRect(0, 0, w, h)
    x.strokeStyle = '#6a3a1a'
    x.lineWidth = 2
    for (let r = 0; r < 9; r++) {
      x.beginPath()
      for (let c = 0; c < 6; c++) {
        const y = 10 + r * 9 + ((c * 7 + r * 3) % 4)
        x.moveTo(6 + c * 9, y)
        x.lineTo(11 + c * 9, y - 3)
      }
      x.stroke()
    }
    x.strokeStyle = '#9a1a1a'
    x.lineWidth = 3
    x.beginPath()
    x.arc(32, 70, 14, 0, PI * 2)
    x.stroke()
  })
const runeTex = (k) =>
  tex(`hor-rune-${k}`, 64, 64, (x, w) => {
    x.clearRect(0, 0, w, w)
    x.strokeStyle = '#d8a0ff'
    x.lineWidth = 7
    x.lineCap = 'round'
    x.beginPath()
    const shapes = [
      () => { x.moveTo(32, 6); x.lineTo(32, 58); x.moveTo(32, 20); x.lineTo(50, 8); x.moveTo(32, 34); x.lineTo(50, 22) },
      () => { x.moveTo(14, 58); x.lineTo(32, 6); x.lineTo(50, 58); x.moveTo(20, 38); x.lineTo(44, 38) },
      () => { x.arc(32, 32, 20, 0, PI * 2); x.moveTo(32, 12); x.lineTo(32, 52); x.moveTo(12, 32); x.lineTo(52, 32) },
    ]
    shapes[k % 3]()
    x.stroke()
  })

function spellbook() {
  const leather = M('#5a1a4a', { rough: 0.7 })
  const pageM = M('#ffffff', { map: pageTex(), rough: 0.9 })
  const pageEdge = M('#e6d6ae', { rough: 0.9 })
  const runeMat = (k) => ({ map: runeTex(k) })
  const half = (s) => grp(
    mesh(G.rbox(0.82, 0.05, 1.1, 0.02), leather, { p: [s * 0.42, 0, 0] }),
    mesh(G.rbox(0.74, 0.12, 1.0, 0.02), pageEdge, { p: [s * 0.4, 0.08, 0] }),
    mesh(G.plane(0.72, 0.98), pageM, { p: [s * 0.4, 0.145, 0], r: [-PI / 2, 0, 0] }),
    mesh(G.box(0.08, 0.06, 0.08), C.gold, { p: [s * 0.8, 0.02, 0.52] }),
    mesh(G.box(0.08, 0.06, 0.08), C.gold, { p: [s * 0.8, 0.02, -0.52] }),
    { r: [0, 0, s * 0.16] },
  )
  return grp(
    // book stand
    mesh(G.rbox(0.9, 0.08, 0.7, 0.03), C.wood, { p: [0, 0.04, 0] }),
    mesh(G.cyl(0.08, 0.1, 0.9, 10), C.wood, { p: [0, 0.5, -0.05] }),
    mesh(G.rbox(1.5, 0.08, 1.05, 0.03), C.woodL, { p: [0, 0.98, 0], r: [0.35, 0, 0] }),
    mesh(G.rbox(1.5, 0.12, 0.05, 0.02), C.woodL, { p: [0, 0.88, 0.5], r: [0.35, 0, 0] }),
    // open book
    grp(
      half(1), half(-1),
      mesh(G.cyl(0.06, 0.06, 1.1, 12), leather, { p: [0, -0.01, 0], r: AZ }),
      mesh(G.box(0.04, 0.01, 0.7), M('#c01818', { rough: 0.6 }), { p: [0.02, 0.2, 0.75], r: [0.5, 0, 0] }),
      { p: [0, 1.08, 0.02], r: [0.35, 0, 0] },
    ),
    // floating runes + sparkles
    decal(runeTex(0), 0.42, 0.42, { p: [-0.4, 1.75, 0.1], emissive: true, glow: 2 }),
    decal(runeTex(1), 0.36, 0.36, { p: [0.35, 1.95, 0.0], emissive: true, glow: 2 }),
    decal(runeTex(2), 0.32, 0.32, { p: [0.0, 2.25, -0.05], emissive: true, glow: 2 }),
    rep(6, (i) => mesh(G.ico(0.035, 0), C.purple, { p: [Math.sin(i * 1.7) * 0.5, 1.4 + i * 0.12, Math.cos(i * 1.7) * 0.25] })),
  )
}

function giantSpider() {
  const body = M('#2a1f30', { rough: 0.7 })
  const band = M('#ff6a1a', { rough: 0.6 })
  const cx = 0
  const legs = []
  for (const s of [1, -1]) {
    for (let i = 0; i < 4; i++) {
      const a = 0.45 + i * 0.62
      const d = [s * Math.sin(a), Math.cos(a)]
      const root = [cx + d[0] * 0.28, 0.85, 0.3 + d[1] * 0.2]
      const knee = [root[0] + d[0] * 0.7, 1.55 - i * 0.05, root[2] + d[1] * 0.7]
      const ankle = [root[0] + d[0] * 1.35, 0.6, root[2] + d[1] * 1.35]
      const tip = [root[0] + d[0] * 1.6, 0.02, root[2] + d[1] * 1.6]
      legs.push(
        rod(root, knee, 0.07, body),
        mesh(G.sphere(0.085, 10, 8), band, { p: knee }),
        rod(knee, ankle, 0.055, body),
        mesh(G.sphere(0.065, 10, 8), band, { p: ankle }),
        rod(ankle, tip, 0.04, body),
      )
    }
  }
  return grp(
    ...legs,
    // abdomen with hourglass
    mesh(G.sphere(0.7, 20, 16), body, { p: [0, 1.05, -0.65], s: [1, 0.85, 1.15] }),
    mesh(G.extrude([[-0.16, 0.2], [0.16, 0.2], [0.03, 0], [0.16, -0.2], [-0.16, -0.2], [-0.03, 0]], 0.05), M('#ff2a2a', { emissive: '#c00000', glow: 0.8 }), { p: [0, 1.6, -0.7], r: [-PI / 2 + 0.2, 0, 0] }),
    rep(4, (i) => mesh(G.cone(0.03, 0.12, 4), body, { p: [Math.sin(i * 1.5) * 0.4, 1.55 - (i % 2) * 0.1, -0.4 - i * 0.12], r: [0.3, 0, Math.sin(i) * 0.6] })),
    // cephalothorax + head
    mesh(G.sphere(0.42, 18, 14), body, { p: [0, 0.9, 0.3], s: [1, 0.8, 1.1] }),
    mesh(G.sphere(0.25, 16, 12), body, { p: [0, 0.95, 0.72] }),
    // 8 eyes
    both((s) => mesh(G.sphere(0.065, 10, 8), C.redEye, { p: [s * 0.08, 1.05, 0.93] })),
    both((s) => mesh(G.sphere(0.04, 8, 6), C.redEye, { p: [s * 0.19, 1.07, 0.86] })),
    both((s) => mesh(G.sphere(0.035, 8, 6), C.redEye, { p: [s * 0.06, 1.17, 0.88] })),
    both((s) => mesh(G.sphere(0.03, 8, 6), C.redEye, { p: [s * 0.15, 1.15, 0.82] })),
    // fangs + pedipalps
    both((s) => mesh(G.cone(0.05, 0.22, 8), C.bone, { p: [s * 0.08, 0.78, 0.92], r: [PI - 0.3, 0, 0] })),
    both((s) => grp(rod([s * 0.14, 0.85, 0.85], [s * 0.24, 0.7, 1.15], 0.035, body), rod([s * 0.24, 0.7, 1.15], [s * 0.2, 0.45, 1.25], 0.03, body))),
    // silk thread up from the abdomen
    rod([0, 1.7, -0.75], [0, 2.4, -0.75], 0.008, M('#e8e8f0', { rough: 0.6 }), 4),
  )
}

function hauntedDoll() {
  const porcelain = M('#f6e6dc', { rough: 0.35 })
  const dress = M('#8a5a9a', { rough: 0.75 })
  const lace = M('#f0ece4', { rough: 0.8 })
  const hair = M('#2a1a12', { rough: 0.7 })
  const crack = M('#3a2420', { rough: 0.8 })
  return grp(
    // shoes + legs
    both((s) => mesh(G.rbox(0.14, 0.1, 0.22, 0.05), C.black, { p: [s * 0.12, 0.05, 0.04] })),
    both((s) => mesh(G.cyl(0.05, 0.05, 0.35, 10), lace, { p: [s * 0.12, 0.25, 0] })),
    // dress
    mesh(G.lathe([[0.48, 0], [0.5, 0.04], [0.44, 0.3], [0.32, 0.6], [0.24, 0.78], [0.0, 0.8]], 22), dress, { p: [0, 0.35, 0] }),
    mesh(G.torus(0.49, 0.04, PI * 2, 8, 24), lace, { p: [0, 0.37, 0], r: [PI / 2, 0, 0] }),
    mesh(G.lathe([[0.3, 0], [0.24, 0.42], [0.16, 0.6], [0, 0.6]], 16), lace, { p: [0, 0.42, 0.16], s: [1, 1, 0.6] }),
    mesh(G.rbox(0.38, 0.3, 0.26, 0.1), dress, { p: [0, 1.2, 0] }),
    mesh(G.torus(0.14, 0.04, PI * 2, 8, 18), lace, { p: [0, 1.36, 0], r: [PI / 2, 0, 0] }),
    // arms holding a little teddy
    both((s) => rod([s * 0.2, 1.3, 0], [s * 0.26, 1.05, 0.12], 0.06, dress)),
    both((s) => rod([s * 0.26, 1.05, 0.12], [s * 0.12, 0.98, 0.26], 0.04, porcelain)),
    grp(
      mesh(G.sphere(0.1, 12, 10), M('#8a5a32', { rough: 0.95 }), { p: [0, 0, 0], s: [1, 1.15, 0.9] }),
      mesh(G.sphere(0.08, 12, 10), M('#8a5a32', { rough: 0.95 }), { p: [0, 0.15, 0.02] }),
      both((s) => mesh(G.sphere(0.035, 8, 6), M('#8a5a32', { rough: 0.95 }), { p: [s * 0.06, 0.22, 0] })),
      mesh(G.box(0.02, 0.1, 0.02), M('#c01818'), { p: [0.02, 0.03, 0.09], r: [0, 0, 0.6] }),
      { p: [0, 0.98, 0.3] },
    ),
    // head
    mesh(G.cyl(0.06, 0.07, 0.1, 10), porcelain, { p: [0, 1.42, 0] }),
    mesh(G.sphere(0.3, 20, 16), porcelain, { p: [0, 1.72, 0.02] }),
    both((s) => mesh(G.sphere(0.075, 12, 10), C.black, { p: [s * 0.11, 1.75, 0.27], s: [1, 1, 0.5] })),
    both((s) => mesh(G.sphere(0.025, 8, 6), C.redEye, { p: [s * 0.11, 1.75, 0.31] })),
    both((s) => mesh(G.sphere(0.045, 8, 6), M('#f0a0a8', { rough: 0.5 }), { p: [s * 0.18, 1.64, 0.24], s: [1, 0.7, 0.4] })),
    mesh(G.torus(0.05, 0.012, PI, 6, 10), M('#a01818', { rough: 0.5 }), { p: [0, 1.6, 0.29], r: [0, 0, PI] }),
    mesh(G.box(0.012, 0.18, 0.01), crack, { p: [-0.12, 1.88, 0.27], r: [-0.3, 0, 0.5] }),
    mesh(G.box(0.012, 0.1, 0.01), crack, { p: [-0.07, 1.82, 0.29], r: [-0.2, 0, -0.4] }),
    // hair + ringlets + bow
    mesh(G.dome(0.32, PI * 0.58, 20, 10), hair, { p: [0, 1.74, -0.02], r: [-0.35, 0, 0] }),
    both((s) => rep(3, (i) => mesh(G.capsule(0.05, 0.22, 8), hair, { p: [s * (0.24 + i * 0.02), 1.52 - i * 0.03, -0.05 - i * 0.08] }))),
    both((s) => mesh(G.extrude([[0, 0], [0.18, 0.1], [0.18, -0.1]], 0.05, 0.01), M('#1a1a2a', { rough: 0.6 }), { p: [s * 0.03, 2.02, -0.02], r: [0, s > 0 ? 0 : PI, 0.3 * s] })),
    mesh(G.sphere(0.05, 8, 6), M('#1a1a2a', { rough: 0.6 }), { p: [0, 2.02, 0] }),
  )
}

function skullCandles() {
  const dish = M('#6a5030', { metal: 0.85, rough: 0.35 })
  return grp(
    mesh(G.lathe([[0.01, 0], [0.5, 0.0], [0.62, 0.08], [0.66, 0.14], [0.6, 0.12], [0.01, 0.06]], 22), dish),
    mesh(G.cyl(0.4, 0.45, 0.04, 20), C.wax, { p: [0, 0.08, 0] }),
    skull(1.25, { p: [0, 0.06, 0] }, M('#ff8a20', { emissive: '#ff6a00', glow: 1.4 })),
    // wax puddle on the crown + drips
    mesh(G.sphere(0.24, 16, 10), C.wax, { p: [0, 0.78, -0.03], s: [1, 0.28, 1] }),
    rep(5, (i) => mesh(G.capsule(0.025, 0.08 + (i % 3) * 0.05, 6), C.wax, { p: [Math.sin(i * 1.3 - 0.6) * 0.28, 0.68 - (i % 3) * 0.04, Math.cos(i * 1.3 - 0.6) * 0.3] })),
    candle(0.42, 0.07, [0, 0.8, -0.05]),
    candle(0.26, 0.06, [0.16, 0.78, 0.08]),
    candle(0.18, 0.055, [-0.17, 0.77, 0.05]),
    candle(0.32, 0.06, [0.46, 0.08, 0.25]),
    candle(0.2, 0.05, [-0.45, 0.08, 0.3]),
  )
}

function crystalBall() {
  const bronze = M('#7a5a2a', { metal: 0.85, rough: 0.35 })
  const glass = M('#c8a8ff', { metal: 0.1, rough: 0.05, opacity: 0.45, emissive: '#5a20a0', glow: 0.5 })
  const swirl = M('#e0b8ff', { emissive: '#b060ff', glow: 2 })
  const core = M('#ffffff', { emissive: '#d0a0ff', glow: 2.5 })
  const spiral = (k) => {
    const pts = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const a = t * PI * 3 + k * 2.1
      const r = 0.12 + t * 0.32
      pts.push([Math.sin(a) * r, 1.05 + (t - 0.5) * 0.55 * (k % 2 ? 1 : -1), Math.cos(a) * r])
    }
    return mesh(G.tube(pts, 0.018, 30), swirl)
  }
  return grp(
    mesh(G.lathe([[0.01, 0], [0.55, 0], [0.6, 0.06], [0.55, 0.14], [0.35, 0.22], [0.26, 0.38], [0.32, 0.46], [0.3, 0.5], [0.01, 0.5]], 22), bronze),
    rep(3, (i) => {
      const a = (i / 3) * PI * 2 + 0.6
      return grp(
        mesh(G.tube([[0, 0.45, 0.25], [0, 0.6, 0.48], [0, 0.85, 0.6], [0, 1.0, 0.56]], 0.04, 12), bronze),
        mesh(G.cone(0.04, 0.12, 6), bronze, { p: [0, 1.04, 0.5], r: [-0.6, 0, 0] }),
        { r: [0, a, 0] },
      )
    }),
    mesh(G.sphere(0.58, 24, 18), glass, { p: [0, 1.05, 0] }),
    mesh(G.sphere(0.14, 14, 10), core, { p: [0, 1.05, 0] }),
    spiral(0), spiral(1), spiral(2),
    rep(5, (i) => mesh(G.ico(0.035, 0), swirl, { p: [Math.sin(i * 1.4) * 0.8, 1.0 + Math.cos(i * 2.1) * 0.5, Math.cos(i * 1.4) * 0.5] })),
  )
}

const bandTex = () =>
  tex('hor-bands', 16, 64, (x, w, h) => {
    const cols = ['#e8b030', '#1f3a8a', '#e8b030', '#2aa0a0']
    for (let i = 0; i < 8; i++) {
      x.fillStyle = cols[i % 4]
      x.fillRect(0, (i * h) / 8, w, h / 8 + 1)
    }
  }, { repeat: [1, 1.5] })

function sarcophagus() {
  const goldM = M('#e8b030', { metal: 0.85, rough: 0.3 })
  const bands = M('#ffffff', { map: bandTex(), metal: 0.5, rough: 0.4 })
  const blue = M('#1f3a8a', { rough: 0.45 })
  const face = M('#d8a050', { metal: 0.5, rough: 0.35 })
  const body = [[-0.3, 0], [0.3, 0], [0.38, 0.7], [0.48, 1.4], [0.55, 1.75], [0.5, 2.05], [0.38, 2.35], [0.0, 2.48], [-0.38, 2.35], [-0.5, 2.05], [-0.55, 1.75], [-0.48, 1.4], [-0.38, 0.7]]
  const nemes = [[-0.5, 1.55], [-0.36, 1.58], [-0.32, 2.05], [0.32, 2.05], [0.36, 1.58], [0.5, 1.55], [0.42, 2.2], [0.25, 2.38], [0, 2.43], [-0.25, 2.38], [-0.42, 2.2]]
  return grp(
    mesh(G.rbox(1.4, 0.2, 0.9, 0.04), C.stoneD, { p: [0, 0.1, 0] }),
    grp(
      mesh(G.extrude(body, 0.55, 0.03), goldM, {}),
      mesh(G.extrude([[-0.29, 0.05], [0.29, 0.05], [0.37, 0.7], [0.44, 1.25], [-0.44, 1.25], [-0.37, 0.7]], 0.04), bands, { p: [0, 0, 0.3] }),
      mesh(G.extrude(nemes, 0.12, 0.02), bands, { p: [0, 0, 0.27] }),
      // face mask
      mesh(G.sphere(0.24, 16, 12), face, { p: [0, 2.08, 0.32], s: [0.9, 1.1, 0.45] }),
      both((s) => mesh(G.sphere(0.045, 10, 8), C.black, { p: [s * 0.09, 2.13, 0.42], s: [1.5, 0.7, 0.4] })),
      both((s) => mesh(G.box(0.12, 0.02, 0.02), C.black, { p: [s * 0.1, 2.19, 0.42] })),
      mesh(G.rbox(0.05, 0.08, 0.05, 0.02), face, { p: [0, 2.05, 0.43] }),
      mesh(G.rbox(0.08, 0.2, 0.06, 0.02), blue, { p: [0, 1.86, 0.38] }),
      // collar
      rep(3, (i) => mesh(G.torus(0.32 + i * 0.07, 0.035, PI, 6, 18), i % 2 ? blue : M('#c03020', { rough: 0.5 }), { p: [0, 1.82, 0.31], r: [0, 0, PI], s: [1, 0.75, 0.5] })),
      // crossed arms with crook and flail
      both((s) => mesh(G.rbox(0.62, 0.12, 0.1, 0.04), face, { p: [0, 1.38 + (s > 0 ? 0.08 : -0.06), 0.36], r: [0, 0, s * 0.42] })),
      rod([-0.18, 1.05, 0.44], [0.12, 1.75, 0.44], 0.025, goldM),
      mesh(G.torus(0.07, 0.02, PI * 1.3, 6, 12), goldM, { p: [0.17, 1.8, 0.44], r: [0, 0, -0.4] }),
      rod([0.18, 1.05, 0.46], [-0.12, 1.72, 0.46], 0.025, blue),
      rep(3, (i) => rod([-0.12, 1.72, 0.46], [-0.24 + i * 0.05, 1.5, 0.48], 0.012, goldM, 5)),
      { p: [0, 0.2, -0.05], r: [-0.05, 0, 0] },
    ),
  )
}

const ghostTex = () =>
  tex('hor-ghost', 128, 160, (x, w, h) => {
    x.beginPath()
    x.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, PI * 2)
    x.clip()
    const g = x.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, w * 0.6)
    g.addColorStop(0, '#4a3a7a')
    g.addColorStop(1, '#120c24')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.fillStyle = 'rgba(200,240,255,0.85)'
    x.beginPath()
    x.ellipse(w / 2, h * 0.45, 34, 44, 0, 0, PI * 2)
    x.fill()
    x.fillStyle = '#0e0a1a'
    x.beginPath(); x.ellipse(w / 2 - 14, h * 0.4, 8, 12, 0, 0, PI * 2); x.fill()
    x.beginPath(); x.ellipse(w / 2 + 14, h * 0.4, 8, 12, 0, 0, PI * 2); x.fill()
    x.beginPath(); x.ellipse(w / 2, h * 0.6, 9, 13, 0, 0, PI * 2); x.fill()
    x.strokeStyle = 'rgba(255,255,255,0.6)'
    x.lineWidth = 2
    x.beginPath(); x.moveTo(20, 20); x.lineTo(44, 52); x.lineTo(36, 80); x.moveTo(44, 52); x.lineTo(62, 58); x.stroke()
  })

function hauntedMirror() {
  const frame = M('#c8962a', { metal: 0.9, rough: 0.3 })
  const wood = M('#3a2018', { rough: 0.7 })
  const glassM = M('#1a1430', { metal: 0.8, rough: 0.15 })
  const curl = [[0, 0], [0.15, 0.1], [0.25, 0.28], [0.2, 0.42], [0.08, 0.42], [0.05, 0.32], [0.12, 0.3], [0.13, 0.2], [0.05, 0.1]]
  return grp(
    // feet + posts
    both((s) => mesh(G.rbox(0.14, 0.1, 0.8, 0.04), wood, { p: [s * 0.7, 0.05, 0] })),
    both((s) => mesh(G.cyl(0.05, 0.06, 1.6, 10), wood, { p: [s * 0.7, 0.85, 0] })),
    both((s) => mesh(G.sphere(0.08, 10, 8), frame, { p: [s * 0.7, 1.7, 0] })),
    both((s) => mesh(G.cyl(0.05, 0.05, 0.12, 10), frame, { p: [s * 0.62, 1.15, 0], r: AX })),
    rod([-0.7, 0.3, 0], [0.7, 0.3, 0], 0.035, wood),
    // mirror
    grp(
      mesh(G.cyl(0.5, 0.5, 0.04, 28), glassM, { r: AZ, s: [1, 1, 1.45] }),
      decal(ghostTex(), 0.98, 1.42, { p: [0, 0, 0.025], emissive: true, glow: 0.9 }),
      mesh(G.cyl(0.54, 0.54, 0.05, 28), wood, { p: [0, 0, -0.03], r: AZ, s: [1, 1, 1.45] }),
      mesh(G.torus(0.52, 0.05, PI * 2, 8, 32), frame, { s: [1, 1.45, 1] }),
      rep(10, (i) => {
        const a = (i / 10) * PI * 2
        return mesh(G.sphere(0.04, 8, 6), frame, { p: [Math.cos(a) * 0.58, Math.sin(a) * 0.58 * 1.45, 0.02] })
      }),
      both((s) => mesh(G.extrude(curl, 0.05, 0.01), frame, { p: [s * 0.02, 0.76, 0], s: [s, 1, 1] })),
      mesh(G.sphere(0.07, 10, 8), C.redEye, { p: [0, 0.84, 0.02] }),
      { p: [0, 1.15, 0], r: [-0.08, 0, 0] },
    ),
    // ghost wisps escaping the glass
    mesh(G.sphere(0.08, 10, 8), C.ghost, { p: [-0.4, 1.6, 0.25] }),
    mesh(G.cone(0.07, 0.25, 8), M('#a8f0ff', { emissive: '#60d8ff', glow: 1.4, opacity: 0.6 }), { p: [-0.32, 1.7, 0.2], r: [0, 0, -0.8] }),
  )
}

function raven() {
  const feather = M('#1a1c26', { rough: 0.45, metal: 0.25 })
  const featherB = M('#22283a', { rough: 0.4, metal: 0.3 })
  const beak = M('#3a3a40', { rough: 0.4, metal: 0.3 })
  const bark = M('#4a3424', { rough: 0.95 })
  const bird = grp(
    mesh(G.sphere(0.32, 18, 14), feather, { p: [0, 1.35, 0], s: [0.85, 0.95, 1.35], r: [-0.45, 0, 0] }),
    mesh(G.sphere(0.2, 16, 12), feather, { p: [0, 1.72, 0.32] }),
    mesh(G.sphere(0.13, 12, 10), featherB, { p: [0, 1.56, 0.36], s: [1, 1.2, 0.9] }),
    mesh(G.cone(0.075, 0.34, 10), beak, { p: [0, 1.7, 0.62], r: [PI / 2 + 0.25, 0, 0], s: [1, 1, 0.8] }),
    both((s) => mesh(G.sphere(0.035, 8, 6), C.redEye, { p: [s * 0.12, 1.77, 0.42] })),
    // folded wings
    both((s) => mesh(G.extrude([[0, 0], [0.25, 0.08], [0.6, -0.05], [0.95, -0.35], [0.55, -0.22], [0.2, -0.2]], 0.05, 0.02), featherB, { p: [s * 0.24, 1.55, 0.15], r: [0, PI / 2 + s * 0.12, -0.6], s: [1, 1, s] })),
    // tail fan
    rep(5, (i) => mesh(G.rbox(0.08, 0.02, 0.45, 0.01), feather, { p: [-0.12 + i * 0.06, 1.0, -0.55], r: [0.55, (i - 2) * 0.12, 0] })),
    // legs gripping the branch
    both((s) => grp(
      rod([s * 0.08, 1.12, 0.0], [s * 0.08, 0.92, 0.03], 0.022, beak, 6),
      rep(3, (i) => rod([s * 0.08, 0.92, 0.03], [s * 0.08 + (i - 1) * 0.05, 0.88, 0.13], 0.014, beak, 5)),
      rod([s * 0.08, 0.92, 0.03], [s * 0.08, 0.88, -0.08], 0.014, beak, 5),
    )),
  )
  return grp(
    mesh(G.cyl(0.35, 0.45, 0.25, 14), bark, { p: [0, 0.12, 0] }),
    rod([0, 0.2, 0], [0, 0.85, 0], 0.11, bark),
    rod([-0.6, 0.85, 0], [0.7, 0.88, 0], 0.07, bark),
    rod([0.4, 0.87, 0], [0.75, 1.1, 0.1], 0.04, bark),
    rod([-0.4, 0.86, 0], [-0.72, 1.05, -0.05], 0.035, bark),
    mesh(G.extrude([[0, 0], [0.1, 0.06], [0.16, 0], [0.1, -0.05]], 0.01), M('#7a3a1a', { rough: 0.8, side: 2 }), { p: [0.74, 1.1, 0.12], r: [0, 0, 0.3] }),
    grp(bird, { p: [0, 0, 0], r: [0, PI / 2, 0] }),
    { r: [0, -0.55, 0] },
  )
}

function boneThrone() {
  const velvet = M('#8a1020', { rough: 0.9 })
  const stoneM = M('#3a3640', { rough: 0.9 })
  return grp(
    // dais
    mesh(G.rbox(2.2, 0.2, 1.9, 0.04), stoneM, { p: [0, 0.1, 0] }),
    mesh(G.rbox(1.8, 0.18, 1.5, 0.04), M('#4a4550', { rough: 0.9 }), { p: [0, 0.29, -0.1] }),
    // seat
    mesh(G.rbox(1.2, 0.3, 0.95, 0.06), C.boneD, { p: [0, 0.62, -0.1] }),
    mesh(G.rbox(1.05, 0.14, 0.85, 0.07), velvet, { p: [0, 0.83, -0.08] }),
    rep(4, (i) => bone([i % 2 ? 0.55 : -0.55, 0.38, i < 2 ? 0.32 : -0.52], [i % 2 ? 0.55 : -0.55, 0.78, i < 2 ? 0.32 : -0.52], 0.05)),
    // back: fan of bones
    rep(7, (i) => {
      const t = (i - 3) / 3
      const top = 2.6 - Math.abs(t) * 0.45
      return bone([t * 0.5, 0.8, -0.55], [t * 0.62, top, -0.62 - Math.abs(t) * 0.05], 0.05)
    }),
    mesh(G.rbox(1.15, 0.9, 0.1, 0.04), velvet, { p: [0, 1.4, -0.52] }),
    bone([-0.65, 1.95, -0.6], [0.65, 1.95, -0.6], 0.045),
    // armrests
    both((s) => grp(
      bone([s * 0.62, 1.15, 0.38], [s * 0.62, 1.15, -0.5], 0.06),
      bone([s * 0.62, 0.78, 0.32], [s * 0.62, 1.12, 0.32], 0.05),
      skull(0.45, { p: [s * 0.62, 1.15, 0.36] }),
    )),
    // skulls crowning the back + horns
    skull(0.85, { p: [0, 2.55, -0.62] }, C.redEye),
    both((s) => mesh(G.cone(0.07, 0.45, 10), C.bone, { p: [s * 0.25, 3.1, -0.62], r: [0, 0, -s * 0.5] })),
    both((s) => skull(0.5, { p: [s * 0.62, 2.12, -0.66], r: [0, s * -0.2, 0] })),
    // ribcage decoration under the seat front
    rep(4, (i) => mesh(G.torus(0.14, 0.02, PI, 6, 10), C.bone, { p: [-0.33 + i * 0.22, 0.62, 0.38], r: [0, 0, PI] })),
    both((s) => mesh(G.cyl(0.03, 0.03, 0.35, 8), C.wax, { p: [s * 0.95, 0.55, 0.65] })),
    both((s) => flameAt([s * 0.95, 0.72, 0.65], 0.8)),
  )
}

export const models = {
  'Jack-o-Lantern': jackOLantern,
  Coffin: coffin,
  Cauldron: cauldron,
  'Haunted Shrine': hauntedShrine,
  Tombstone: tombstone,
  Gargoyle: gargoyle,
  Spellbook: spellbook,
  'Giant Spider': giantSpider,
  'Haunted Doll': hauntedDoll,
  'Skull Candles': skullCandles,
  'Crystal Ball': crystalBall,
  Sarcophagus: sarcophagus,
  'Haunted Mirror': hauntedMirror,
  Raven: raven,
  'Bone Throne': boneThrone,
}
