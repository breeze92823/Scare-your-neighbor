// Rare Index items: bigger gadgets and furniture. Each model stands on y = 0 facing +Z
// (card camera azimuth -0.55; screen right = azimuth +1.02).
import { Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const H = PI / 2
const UP = new Vector3(0, 1, 0)

const B = (w, h, d, mat, p, rad = 0.03, r) => mesh(G.rbox(w, h, d, rad), mat, { p, r })
const C = (rt, rb, h, mat, p, r, seg = 20) => mesh(G.cyl(rt, rb, h, seg), mat, { p, r })
const S = (rad, mat, p, s) => mesh(G.sphere(rad, 20, 14), mat, { p, s })
const T = (pts, r, mat, seg = 32) => mesh(G.tube(pts, r, seg), mat)
const turn = (o, y) => ((o.rotation.y = y), o)
function rod(a, b, r, mat, seg = 10) {
  const A = new Vector3(...a)
  const d = new Vector3(...b).sub(A)
  const m = mesh(G.cyl(r, r, d.length(), seg), mat)
  m.position.copy(A).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}
const font = (px, w = 700) => `${w} ${px}px Fredoka, "Arial Rounded MT Bold", sans-serif`
function woodTex(key, base, line, repeat = [1, 1]) {
  return tex(
    key,
    128,
    128,
    (x, w, h) => {
      x.fillStyle = base
      x.fillRect(0, 0, w, h)
      x.strokeStyle = line
      for (let i = 0; i < 18; i++) {
        x.globalAlpha = 0.25 + (i % 3) * 0.15
        x.lineWidth = 1 + (i % 2)
        x.beginPath()
        const y0 = (i / 18) * h
        for (let k = 0; k <= 16; k++) x.lineTo((k / 16) * w, y0 + Math.sin(k * 0.7 + i) * 2.5)
        x.stroke()
      }
      x.globalAlpha = 1
    },
    { repeat },
  )
}
const disc = (key, size, paint) => tex(key, size, size, paint)

const WHITE = M('#f2f4f7', { rough: 0.45 })
const BLACK = M('#1d1f26', { rough: 0.5 })
const GLOSS_BLACK = M('#202329', { rough: 0.2, metal: 0.3 })
const CHROME = M('#d6dbe2', { metal: 0.9, rough: 0.25 })
const DARK_METAL = M('#4a505c', { metal: 0.7, rough: 0.4 })
const GOLD = M('#e0b040', { metal: 0.85, rough: 0.3 })
const RUBBER = M('#26282e', { rough: 0.85 })
const RED = M('#e2453c', { rough: 0.45 })
const glowM = (c, g = 1.4) => M(c, { emissive: c, glow: g, rough: 0.4 })

// --- Gaming PC ---------------------------------------------------------------------------
function gamingPC() {
  const caseM = M('#23262e', { rough: 0.35, metal: 0.4 })
  const glass = M('#a8c8ff', { opacity: 0.18, rough: 0.05 })
  const rgb = ['#ff3df0', '#3dd5ff', '#7a5cff']
  const game = tex('item-pc-game', 256, 144, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1a1446')
    g.addColorStop(1, '#ff4fa3')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#ffd23f'
    x.beginPath()
    x.arc(w * 0.7, h * 0.45, 26, 0, PI * 2)
    x.fill()
    x.fillStyle = '#2a1650'
    x.beginPath()
    x.moveTo(0, h)
    for (let i = 0; i <= 8; i++) x.lineTo((i / 8) * w, h * 0.62 + ((i * 37) % 30))
    x.lineTo(w, h)
    x.fill()
    x.strokeStyle = '#3dd5ff'
    x.lineWidth = 2
    for (let i = 0; i < 9; i++) {
      x.beginPath()
      x.moveTo(w / 2, h * 0.75)
      x.lineTo((i / 8) * w * 2 - w / 2, h)
      x.stroke()
    }
    x.fillStyle = '#ffffff'
    x.font = font(20)
    x.fillText('SCORE 9001', 10, 22)
  })
  const fan = (p, col, r = 0.12, axis = [0, 0, 0]) =>
    grp(
      mesh(G.torus(r, 0.016, PI * 2, 8, 24), glowM(col, 1.6)),
      C(r * 0.9, r * 0.9, 0.02, M('#111318', { rough: 0.6 }), [0, 0, -0.01], [H, 0, 0], 18),
      rep(5, (i) => B(r * 0.8, 0.04, 0.012, M('#2e323b', { rough: 0.5 }), [0, 0, 0], 0.005, [0, 0, (i / 5) * PI * 2])),
      C(0.035, 0.035, 0.03, M('#2e323b', { rough: 0.5 }), [0, 0, 0], [H, 0, 0], 12),
      { p, r: axis },
    )
  const W = 0.46
  const Ht = 1.0
  const D = 0.95
  const tower = grp(
    B(0.04, Ht, D, caseM, [W / 2 - 0.02, Ht / 2 + 0.05, 0], 0.015),
    B(W, 0.04, D, caseM, [0, Ht + 0.03, 0], 0.015),
    B(W, 0.04, D, caseM, [0, 0.07, 0], 0.015),
    B(W, 0.04, D, caseM, [0, Ht / 2 + 0.05, -D / 2 + 0.02], 0.015),
    B(W, Ht, 0.05, caseM, [0, Ht / 2 + 0.05, D / 2 - 0.025], 0.015),
    fan([0, 0.82, D / 2 + 0.005], rgb[0]),
    fan([0, 0.55, D / 2 + 0.005], rgb[1]),
    fan([0, 0.28, D / 2 + 0.005], rgb[2]),
    B(0.02, Ht - 0.02, D - 0.02, glass, [-W / 2 + 0.01, Ht / 2 + 0.05, 0], 0.008),
    B(0.02, 0.8, 0.7, M('#1a2a22', { rough: 0.5 }), [W / 2 - 0.05, 0.6, -0.05], 0.01),
    B(0.36, 0.2, D - 0.08, M('#30343d', { rough: 0.4 }), [0, 0.19, 0], 0.02),
    B(0.02, 0.03, D - 0.1, glowM(rgb[1]), [-W / 2 + 0.06, 0.3, 0], 0.01),
    B(0.3, 0.1, 0.55, M('#3a3f4b', { metal: 0.5, rough: 0.3 }), [0.02, 0.48, 0.05], 0.02),
    B(0.02, 0.03, 0.5, glowM(rgb[0]), [-0.13, 0.48, 0.05], 0.01),
    fan([-0.1, 0.48, -0.1], rgb[2], 0.06, [0, -H, 0]),
    fan([-0.1, 0.48, 0.16], rgb[2], 0.06, [0, -H, 0]),
    C(0.09, 0.09, 0.12, M('#3a3f4b', { metal: 0.5, rough: 0.3 }), [0.08, 0.8, -0.05], [0, 0, H], 16),
    mesh(G.torus(0.09, 0.012, PI * 2, 6, 20), glowM(rgb[1]), { p: [0.02, 0.8, -0.05], r: [0, H, 0] }),
    rep(4, (i) => B(0.1, 0.2, 0.015, glowM(rgb[i % 2 ? 0 : 1], 1.2), [0.1, 0.8, 0.12 + i * 0.03], 0.005)),
    fan([0, 0.82, -D / 2 + 0.06], rgb[0], 0.1),
    both((s) => B(W - 0.04, 0.04, 0.08, RUBBER, [0, 0.025, s * 0.38], 0.015)),
    C(0.02, 0.02, 0.01, glowM('#ffffff'), [0.12, Ht + 0.05, D / 2 - 0.08], null, 10),
    { p: [-0.62, 0, 0] },
  )
  const monitor = grp(
    B(1.15, 0.68, 0.05, caseM, [0, 0.72, 0], 0.025),
    decal(game, 1.08, 0.6, { p: [0, 0.73, 0.027], emissive: true, glow: 1.0 }),
    B(1.15, 0.02, 0.02, glowM(rgb[0], 1.2), [0, 0.38, -0.01], 0.008),
    B(0.08, 0.45, 0.06, caseM, [0, 0.33, -0.08], 0.02, [-0.1, 0, 0]),
    mesh(G.extrude([[-0.28, -0.12], [0.28, -0.12], [0.18, 0.12], [-0.18, 0.12]], 0.03), caseM, { p: [0, 0.015, -0.05], r: [H, 0, 0] }),
    { p: [0.42, 0, -0.1] },
  )
  const keyboard = grp(
    B(0.8, 0.04, 0.26, caseM, [0, 0.02, 0], 0.015),
    rep(4, (r) => B(0.74, 0.02, 0.045, M('#30343d', { rough: 0.5 }), [0, 0.05, -0.09 + r * 0.058], 0.008)),
    B(0.78, 0.01, 0.24, glowM('#7a5cff', 0.7), [0, 0.035, 0], 0.005),
    { p: [0.42, 0, 0.35], r: [0, 0.05, 0] },
  )
  const mouse = grp(S(0.06, caseM, [0, 0.03, 0], [0.8, 0.5, 1.2]), B(0.01, 0.01, 0.04, glowM(rgb[1]), [0, 0.06, 0.02], 0.004), { p: [0.98, 0, 0.36] })
  return turn(grp(tower, monitor, keyboard, mouse), -0.15)
}

// --- Electric Guitar ---------------------------------------------------------------------
function electricGuitar() {
  const paint = M('#d32f2f', { rough: 0.18, metal: 0.3 })
  const maple = M('#e8c48a', { rough: 0.35 })
  const rose = M('#3a2016', { rough: 0.5 })
  const body = [[0, 0], [0.18, 0.02], [0.28, 0.1], [0.31, 0.24], [0.26, 0.36], [0.2, 0.42], [0.22, 0.52], [0.27, 0.66], [0.25, 0.74], [0.19, 0.72], [0.12, 0.6], [0.06, 0.55], [-0.06, 0.55], [-0.11, 0.62], [-0.19, 0.8], [-0.25, 0.83], [-0.28, 0.74], [-0.23, 0.56], [-0.21, 0.44], [-0.28, 0.34], [-0.31, 0.2], [-0.27, 0.08], [-0.17, 0.01]]
  const guard = [[0.05, 0.12], [0.2, 0.2], [0.22, 0.34], [0.17, 0.43], [0.15, 0.53], [0.06, 0.54], [-0.06, 0.54], [-0.12, 0.6], [-0.18, 0.56], [-0.14, 0.4], [-0.16, 0.28], [-0.06, 0.2]]
  const strings = rep(6, (i) => {
    const f = (i - 2.5) / 2.5
    return rod([f * 0.045, 0.16, 0.085], [f * 0.03, 1.6, 0.075], 0.004, CHROME, 4)
  })
  const guitar = grp(
    mesh(G.extrude(body, 0.1, 0.02), paint),
    mesh(G.extrude(guard, 0.012), M('#f4f1ea', { rough: 0.3 }), { p: [0, 0, 0.065] }),
    rep(3, (i) => B(0.09, 0.03, 0.02, M('#f4f1ea', { rough: 0.3 }), [0, 0.26 + i * 0.1, 0.08], 0.01)),
    B(0.13, 0.05, 0.02, CHROME, [0, 0.16, 0.08], 0.01),
    rep(3, (i) => C(0.025, 0.025, 0.03, M('#f4f1ea', { rough: 0.3 }), [0.12 + i * 0.03, 0.2 + i * 0.05, 0.085], [H, 0, 0], 12)),
    B(0.03, 0.06, 0.02, M('#f4f1ea', { rough: 0.3 }), [-0.12, 0.42, 0.08], 0.008),
    B(0.085, 1.0, 0.05, maple, [0, 1.08, 0.035], 0.02),
    B(0.08, 0.98, 0.015, rose, [0, 1.1, 0.065], 0.005),
    rep(14, (i) => B(0.08, 0.006, 0.008, CHROME, [0, 0.64 + i * 0.068, 0.074], 0.002)),
    mesh(G.extrude([[-0.045, 0], [0.045, 0], [0.07, 0.08], [0.11, 0.2], [0.09, 0.3], [0.04, 0.3], [-0.02, 0.24], [-0.05, 0.12]], 0.035, 0.008), maple, { p: [0, 1.6, 0.03] }),
    rep(6, (i) => grp(C(0.008, 0.008, 0.06, CHROME, [-0.06, 1.65 + i * 0.04, 0.04], [0, 0, H], 6), C(0.02, 0.02, 0.01, CHROME, [-0.09, 1.65 + i * 0.04, 0.04], [0, 0, H], 10))),
    strings,
    { p: [0, 0.02, 0], r: [0, 0, -0.22] },
  )
  const amp = grp(
    B(0.62, 0.58, 0.34, M('#26282e', { rough: 0.7 }), [0, 0.29, 0], 0.05),
    B(0.54, 0.38, 0.02, M('#3a3a36', { rough: 1 }), [0, 0.24, 0.17], 0.02),
    B(0.56, 0.1, 0.02, GOLD, [0, 0.5, 0.17], 0.015),
    rep(5, (i) => C(0.018, 0.018, 0.03, M('#ffffff', { rough: 0.3 }), [-0.2 + i * 0.1, 0.5, 0.19], [H, 0, 0], 10)),
    decal(
      tex('item-amp-logo', 128, 48, (x, w, h) => {
        x.fillStyle = '#f4f1ea'
        x.font = `italic ${font(32)}`
        x.textAlign = 'center'
        x.textBaseline = 'middle'
        x.fillText('Rokk', w / 2, h / 2)
      }),
      0.2,
      0.075,
      { p: [-0.15, 0.36, 0.182] },
    ),
    T([[-0.16, 0.6, 0], [-0.1, 0.68, 0], [0.1, 0.68, 0], [0.16, 0.6, 0]], 0.018, BLACK, 12),
    { p: [0.42, 0, -0.25] },
  )
  return turn(
    grp(guitar, amp, T([[0.17, 0.2, 0.06], [0.3, 0.02, 0.2], [0.55, 0.02, 0.1], [0.62, 0.15, -0.07]], 0.012, BLACK, 20)),
    -0.3,
  )
}

// --- Recliner ----------------------------------------------------------------------------
function recliner() {
  const leather = M('#7a4b2e', { rough: 0.45 })
  const leather2 = M('#8e5a38', { rough: 0.45 })
  const back = grp(
    B(0.3, 1.0, 0.78, leather, [0, 0.5, 0], 0.13),
    B(0.16, 0.34, 0.66, leather2, [0.17, 0.82, 0], 0.08),
    B(0.14, 0.4, 0.64, leather2, [0.16, 0.36, 0], 0.07),
    { p: [-0.42, 0.42, 0], r: [0, 0, 0.42] },
  )
  const foot = grp(
    B(0.5, 0.14, 0.72, leather, [0, 0, 0], 0.07),
    B(0.1, 0.24, 0.7, leather2, [0.24, -0.06, 0], 0.05),
    { p: [0.78, 0.4, 0], r: [0, 0, -0.12] },
  )
  return turn(
    grp(
      B(0.86, 0.3, 0.86, leather, [0, 0.21, 0], 0.08),
      B(0.86, 0.06, 0.8, M('#3a2416', { rough: 0.6 }), [0, 0.03, 0], 0.025),
      B(0.68, 0.18, 0.66, leather2, [0.04, 0.45, 0], 0.08),
      back,
      foot,
      both((s) => rod([0.32, 0.22, s * 0.25], [0.66, 0.36, s * 0.25], 0.018, DARK_METAL)),
      both((s) => rod([0.32, 0.34, s * 0.25], [0.66, 0.24, s * 0.25], 0.018, DARK_METAL)),
      both((s) =>
        grp(
          B(0.86, 0.34, 0.18, leather, [0, 0.54, 0], 0.08),
          C(0.13, 0.13, 0.2, leather2, [0.38, 0.62, 0], [H, 0, 0], 18),
          { p: [0.02, 0, s * 0.42] },
        ),
      ),
      B(0.06, 0.14, 0.04, DARK_METAL, [0.25, 0.4, 0.53], 0.015, [0, 0, -0.3]),
      both((s) => both((t) => C(0.04, 0.03, 0.05, M('#3a2416', { rough: 0.6 }), [s * 0.36, 0.0, t * 0.36], null, 10))),
    ),
    -0.9,
  )
}

// --- Telescope ---------------------------------------------------------------------------
function telescope() {
  const tubeM = M('#f2f4f7', { rough: 0.3, metal: 0.2 })
  const legM = M('#3a3f4b', { metal: 0.6, rough: 0.35 })
  const apex = [0, 1.0, 0]
  const feet = [0, 1, 2].map((i) => {
    const a = (i / 3) * PI * 2 + 0.5
    return [Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]
  })
  const tube = grp(
    C(0.13, 0.13, 1.3, tubeM, [0.1, 0, 0], [0, 0, H], 22),
    C(0.15, 0.15, 0.36, BLACK, [0.86, 0, 0], [0, 0, H], 22),
    C(0.135, 0.135, 0.02, M('#1a2440', { rough: 0.05, metal: 0.5, emissive: '#2040a0', glow: 0.3 }), [1.03, 0, 0], [0, 0, H], 22),
    C(0.14, 0.14, 0.08, BLACK, [-0.56, 0, 0], [0, 0, H], 22),
    both((s) => mesh(G.torus(0.145, 0.02, PI * 2, 8, 24), legM, { p: [s * 0.25, 0, 0], r: [0, H, 0] })),
    B(0.7, 0.04, 0.08, legM, [0, -0.16, 0], 0.015),
    C(0.035, 0.035, 0.35, BLACK, [0.15, 0.2, 0], [0, 0, H], 12),
    C(0.045, 0.045, 0.06, BLACK, [0.33, 0.2, 0], [0, 0, H], 12),
    both((s) => B(0.03, 0.06, 0.03, legM, [0.15 + s * 0.1, 0.15, 0], 0.01)),
    C(0.04, 0.04, 0.16, CHROME, [-0.65, 0, 0], [0, 0, H], 12),
    B(0.08, 0.08, 0.08, BLACK, [-0.75, 0, 0], 0.02),
    C(0.03, 0.03, 0.14, BLACK, [-0.75, 0.09, 0], null, 12),
    C(0.045, 0.04, 0.04, RUBBER, [-0.75, 0.18, 0], null, 12),
    { p: [0, 1.18, 0], r: [0, 0, 0.55] },
  )
  return turn(
    grp(
      ...feet.map((f) => rod(apex, f, 0.025, legM, 8)),
      ...feet.map((f) => S(0.04, RUBBER, [f[0], 0.02, f[2]])),
      ...feet.map((f) => rod([f[0] * 0.45, 0.55, f[2] * 0.45], [0, 0.55, 0], 0.012, legM, 6)),
      C(0.12, 0.12, 0.03, legM, [0, 0.55, 0], null, 3),
      C(0.06, 0.08, 0.1, legM, [0, 1.0, 0], null, 16),
      B(0.16, 0.12, 0.16, legM, [0, 1.07, 0], 0.03),
      tube,
      rod([0.05, 1.08, 0], [0.12, 0.72, 0.0], 0.015, CHROME, 6),
      C(0.07, 0.07, 0.06, DARK_METAL, [0.12, 0.7, 0], null, 16),
    ),
    -0.6,
  )
}

// --- Washing Machine ---------------------------------------------------------------------
function washingMachine() {
  const shell = M('#f1f3f6', { rough: 0.35 })
  const panel = M('#d9dee5', { rough: 0.4 })
  const ring = M('#c0c7d0', { metal: 0.8, rough: 0.25 })
  const glass = M('#9fd0f0', { opacity: 0.4, rough: 0.05 })
  const disp = tex('item-washer-display', 128, 48, (x, w, h) => {
    x.fillStyle = '#0c1820'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#5ad7ff'
    x.font = font(30)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('0:42', w / 2, h / 2 + 2)
  })
  const z = 0.43
  const cy = 0.45
  const door = grp(
    mesh(G.torus(0.3, 0.06, PI * 2, 10, 32), ring, { p: [0.3, 0, 0.04] }),
    mesh(G.dome(0.27, 1.0, 22, 8), glass, { p: [0.3, 0, 0.0], r: [H, 0, 0], s: [1, 0.5, 1] }),
    B(0.08, 0.16, 0.05, ring, [0.58, 0, 0.06], 0.02),
    { p: [-0.3, cy, z + 0.02], r: [0, -1.95, 0] },
  )
  return turn(
    grp(
      B(0.9, 1.0, 0.86, shell, [0, 0.52, 0], 0.05),
      B(0.9, 0.04, 0.86, M('#c8ced6', { rough: 0.4 }), [0, 0.02, 0], 0.015),
      B(0.86, 0.17, 0.02, panel, [0, 0.92, z], 0.02),
      B(0.2, 0.08, 0.02, M('#c8ced6', { rough: 0.4 }), [-0.28, 0.92, z + 0.012], 0.015),
      C(0.07, 0.07, 0.05, CHROME, [0.12, 0.92, z + 0.02], [H, 0, 0], 20),
      B(0.02, 0.06, 0.02, BLACK, [0.12, 0.95, z + 0.05], 0.005),
      decal(disp, 0.14, 0.06, { p: [0.3, 0.93, z + 0.012], emissive: true, glow: 1.1 }),
      rep(3, (i) => C(0.015, 0.015, 0.02, glowM(['#4dff88', '#ffd23f', '#ff5a5a'][i], 1.2), [-0.06 + i * 0.04, 0.88, z + 0.012], [H, 0, 0], 8)),
      mesh(G.torus(0.27, 0.04, PI * 2, 8, 32), M('#8c939e', { rough: 0.6 }), { p: [0, cy, z] }),
      C(0.26, 0.26, 0.02, M('#2c3038', { metal: 0.6, rough: 0.4 }), [0, cy, z - 0.01], [H, 0, 0], 28),
      S(0.11, M('#3b82d6', { rough: 0.9 }), [-0.08, cy - 0.12, z], [1, 0.7, 0.6]),
      S(0.09, M('#ff9a3a', { rough: 0.9 }), [0.1, cy - 0.14, z], [1, 0.7, 0.6]),
      S(0.08, M('#e2453c', { rough: 0.9 }), [0.02, cy - 0.04, z - 0.02], [1, 0.7, 0.6]),
      T([[-0.12, cy - 0.16, z + 0.03], [-0.16, cy - 0.28, z + 0.12], [-0.12, cy - 0.42, z + 0.13], [-0.03, cy - 0.47, z + 0.13]], 0.035, M('#f4f1ea', { rough: 0.9 }), 16),
      S(0.04, RED, [-0.02, cy - 0.47, z + 0.13], [1.4, 0.8, 1]),
      door,
      both((s) => C(0.04, 0.05, 0.04, RUBBER, [s * 0.36, -0.0, 0.36], null, 10)),
    ),
    -0.95,
  )
}

// --- Lawn Mower --------------------------------------------------------------------------
function lawnMower() {
  const red = M('#d6362f', { rough: 0.35, metal: 0.2 })
  const yellow = M('#ffd23f', { rough: 0.4 })
  const grass = M('#4caf50', { rough: 0.8 })
  const bag = M('#2f3a2c', { rough: 0.9 })
  const wheel = (x, z) => grp(C(0.17, 0.17, 0.1, RUBBER, [0, 0, 0], [H, 0, 0], 20), C(0.09, 0.09, 0.11, yellow, [0, 0, 0], [H, 0, 0], 14), { p: [x, 0.17, z] })
  const hx = -1.02
  return turn(
    grp(
      B(0.92, 0.2, 0.78, red, [0.05, 0.27, 0], 0.08),
      B(0.96, 0.06, 0.8, M('#a8261f', { rough: 0.4 }), [0.05, 0.18, 0], 0.025),
      wheel(0.38, 0.42),
      wheel(0.38, -0.42),
      wheel(-0.3, 0.42),
      wheel(-0.3, -0.42),
      C(0.19, 0.2, 0.18, BLACK, [0.1, 0.46, 0], null, 20),
      B(0.34, 0.1, 0.34, red, [0.1, 0.6, 0], 0.05),
      B(0.14, 0.12, 0.2, M('#30343c', { rough: 0.5 }), [0.32, 0.5, 0], 0.03),
      C(0.04, 0.04, 0.05, yellow, [-0.02, 0.67, 0.1], null, 12),
      T([[0.1, 0.62, -0.1], [-0.2, 0.7, -0.22], [-0.5, 0.75, -0.26]], 0.008, BLACK, 10),
      B(0.18, 0.12, 0.7, bag, [-0.58, 0.45, 0], 0.05),
      B(0.4, 0.4, 0.62, bag, [-0.72, 0.42, 0], 0.08, [0, 0, -0.25]),
      B(0.42, 0.04, 0.64, M('#555d68', { metal: 0.5, rough: 0.4 }), [-0.68, 0.64, 0], 0.015, [0, 0, -0.25]),
      both((s) => T([[-0.32, 0.32, s * 0.3], [-0.55, 0.62, s * 0.3], [hx, 1.1, s * 0.3], [hx - 0.04, 1.14, s * 0.24]], 0.025, DARK_METAL, 20)),
      rod([hx - 0.04, 1.14, 0.25], [hx - 0.04, 1.14, -0.25], 0.025, DARK_METAL),
      C(0.04, 0.04, 0.4, BLACK, [hx - 0.04, 1.14, 0], [H, 0, 0], 12),
      T([[hx + 0.02, 1.05, 0.28], [hx + 0.12, 1.12, 0.2], [hx + 0.1, 1.12, -0.2], [hx + 0.02, 1.05, -0.28]], 0.015, yellow, 16),
      rod([-0.7, 0.88, 0.3], [-0.7, 0.88, -0.3], 0.018, DARK_METAL),
      decal(
        tex('item-mower-logo', 128, 48, (x, w, h) => {
          x.fillStyle = '#ffffff'
          x.font = font(30)
          x.textAlign = 'center'
          x.textBaseline = 'middle'
          x.fillText('MOW', w / 2, h / 2 + 2)
        }),
        0.28,
        0.1,
        { p: [0.05, 0.28, 0.392] },
      ),
      rep(9, (i) => mesh(G.cone(0.025, 0.12 + (i % 3) * 0.04, 4), grass, { p: [0.55 + (i % 3) * 0.06, 0.06, -0.3 + i * 0.075], r: [0, 0, (i % 2 ? 0.2 : -0.2)] })),
    ),
    -0.85,
  )
}

// --- Grandfather Clock -------------------------------------------------------------------
function grandfatherClock() {
  const wood = M('#ffffff', { map: woodTex('item-gfc-wood', '#6b3a1e', '#3e1f0e', [1, 2]), rough: 0.4 })
  const woodDark = M('#4a260f', { rough: 0.45 })
  const glass = M('#cfe8ff', { opacity: 0.2, rough: 0.05 })
  const face = disc('item-gfc-face', 256, (x, w) => {
    const c = w / 2
    x.fillStyle = '#e0b040'
    x.beginPath()
    x.arc(c, c, 126, 0, PI * 2)
    x.fill()
    x.fillStyle = '#fbf3dd'
    x.beginPath()
    x.arc(c, c, 112, 0, PI * 2)
    x.fill()
    x.fillStyle = '#2a2a33'
    x.font = font(24, 600)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2 - H
      x.fillText(R[i], c + Math.cos(a) * 88, c + Math.sin(a) * 88)
    }
    x.strokeStyle = '#2a2a33'
    x.lineCap = 'round'
    x.lineWidth = 8
    x.beginPath()
    x.moveTo(c, c)
    x.lineTo(c + 36, c + 28)
    x.stroke()
    x.lineWidth = 5
    x.beginPath()
    x.moveTo(c, c)
    x.lineTo(c - 8, c - 74)
    x.stroke()
  })
  const pend = grp(
    B(0.02, 0.62, 0.01, GOLD, [0, -0.31, 0], 0.005),
    C(0.11, 0.11, 0.025, GOLD, [0, -0.66, 0], [H, 0, 0], 24),
    { p: [0, 1.6, 0.05], r: [0, 0, 0.12] },
  )
  return turn(
    grp(
      B(0.74, 0.36, 0.46, wood, [0, 0.22, 0], 0.03),
      B(0.8, 0.06, 0.5, woodDark, [0, 0.42, 0], 0.02),
      both((s) => both((t) => S(0.06, woodDark, [s * 0.3, 0.04, t * 0.17]))),
      B(0.56, 1.25, 0.38, wood, [0, 1.07, 0], 0.03),
      B(0.38, 0.95, 0.02, glass, [0, 1.1, 0.19], 0.02),
      B(0.44, 1.01, 0.02, woodDark, [0, 1.1, 0.185], 0.02),
      pend,
      both((s) => grp(rod([0, 1.6, 0], [0, 1.25, 0], 0.005, GOLD, 4), C(0.035, 0.035, 0.2, GOLD, [0, 1.15, 0], null, 12), { p: [s * 0.12, 0, 0.02] })),
      B(0.64, 0.06, 0.44, woodDark, [0, 1.72, 0], 0.02),
      B(0.68, 0.62, 0.44, wood, [0, 2.06, 0], 0.03),
      decal(face, 0.48, 0.48, { p: [0, 2.06, 0.222] }),
      both((s) => C(0.03, 0.03, 0.6, GOLD, [s * 0.3, 2.06, 0.2], null, 12)),
      B(0.76, 0.06, 0.5, woodDark, [0, 2.4, 0], 0.02),
      mesh(G.extrude([[-0.38, 0], [0.38, 0], [0.38, 0.12], [0.2, 0.26], [0.06, 0.3], [0.06, 0.16], [-0.06, 0.16], [-0.06, 0.3], [-0.2, 0.26], [-0.38, 0.12]], 0.46), wood, { p: [0, 2.43, 0] }),
      both((s) => grp(S(0.04, GOLD, [0, 0, 0]), mesh(G.cone(0.03, 0.1, 10), GOLD, { p: [0, 0.08, 0] }), { p: [s * 0.36, 2.6, 0.18] })),
      grp(S(0.05, GOLD, [0, 0, 0]), mesh(G.cone(0.035, 0.14, 10), GOLD, { p: [0, 0.1, 0] }), { p: [0, 2.78, 0.18] }),
    ),
    -0.3,
  )
}

// --- Drone -------------------------------------------------------------------------------
function drone() {
  const shell = M('#f2f4f7', { rough: 0.3, metal: 0.1 })
  const dark = M('#30343c', { rough: 0.45 })
  const prop = M('#a9b2bd', { rough: 0.35, opacity: 0.85 })
  const arm = (sx, sz) => {
    const end = [sx * 0.55, 0.38, sz * 0.55]
    const front = sz > 0
    return grp(
      rod([sx * 0.12, 0.36, sz * 0.15], end, 0.035, dark, 10),
      C(0.075, 0.075, 0.1, dark, [end[0], 0.42, end[2]], null, 16),
      C(0.02, 0.02, 0.05, CHROME, [end[0], 0.49, end[2]], null, 8),
      B(0.52, 0.012, 0.06, prop, [end[0], 0.51, end[2]], 0.005, [0, sx * sz * 0.6, 0]),
      mesh(G.torus(0.3, 0.016, PI * 2, 6, 32), dark, { p: [end[0], 0.5, end[2]], r: [H, 0, 0] }),
      C(0.02, 0.02, 0.02, glowM(front ? '#ff4040' : '#40ff70', 2), [end[0], 0.36, end[2]], null, 8),
    )
  }
  return turn(
    grp(
      grp(
        B(0.42, 0.14, 0.6, shell, [0, 0.4, 0], 0.07),
        B(0.36, 0.06, 0.52, dark, [0, 0.31, 0], 0.03),
        B(0.18, 0.03, 0.28, M('#3dd5ff', { emissive: '#1a90c0', glow: 0.6, rough: 0.3 }), [0, 0.475, -0.02], 0.012),
        arm(1, 1),
        arm(-1, 1),
        arm(1, -1),
        arm(-1, -1),
        C(0.03, 0.03, 0.06, dark, [0, 0.26, 0.22], null, 8),
        S(0.08, dark, [0, 0.19, 0.24]),
        C(0.04, 0.04, 0.03, M('#101828', { rough: 0.05, metal: 0.6, emissive: '#2050ff', glow: 0.4 }), [0, 0.19, 0.31], [H, 0, 0], 14),
        both((s) => rod([s * 0.12, 0.3, 0.12], [s * 0.2, 0.04, 0.16], 0.015, dark, 6)),
        both((s) => rod([s * 0.12, 0.3, -0.12], [s * 0.2, 0.04, -0.16], 0.015, dark, 6)),
        both((s) => C(0.022, 0.022, 0.5, dark, [s * 0.2, 0.03, 0], [H, 0, 0], 8)),
        { r: [0.3, 0, 0] },
      ),
    ),
    -0.75,
  )
}

// --- Espresso Machine --------------------------------------------------------------------
function espressoMachine() {
  const steel = M('#d6dbe2', { metal: 0.9, rough: 0.22 })
  const red = M('#c8302a', { rough: 0.25, metal: 0.4 })
  const cupM = M('#f6f6f2', { rough: 0.25 })
  const gauge = disc('item-espresso-gauge', 128, (x, w) => {
    const c = w / 2
    x.fillStyle = '#fbf6e8'
    x.beginPath()
    x.arc(c, c, 60, 0, PI * 2)
    x.fill()
    x.strokeStyle = '#2a2a33'
    for (let i = 0; i <= 10; i++) {
      const a = PI * 0.75 + (i / 10) * PI * 1.5
      x.lineWidth = 3
      x.beginPath()
      x.moveTo(c + Math.cos(a) * 44, c + Math.sin(a) * 44)
      x.lineTo(c + Math.cos(a) * 54, c + Math.sin(a) * 54)
      x.stroke()
    }
    x.strokeStyle = '#e2453c'
    x.lineWidth = 8
    x.beginPath()
    x.arc(c, c, 49, PI * 1.85, PI * 2.25)
    x.stroke()
    x.strokeStyle = '#2a2a33'
    x.lineWidth = 4
    x.beginPath()
    x.moveTo(c, c)
    x.lineTo(c + 34, c - 26)
    x.stroke()
  })
  const cup = (p, s = 1) =>
    grp(
      mesh(G.lathe([[0.001, 0], [0.05, 0], [0.07, 0.03], [0.075, 0.1], [0.07, 0.1], [0.065, 0.03], [0.001, 0.02]], 18), cupM),
      C(0.065, 0.065, 0.01, M('#b07a46', { rough: 0.4 }), [0, 0.08, 0], null, 16),
      mesh(G.torus(0.03, 0.012, PI, 6, 10), cupM, { p: [-0.075, 0.06, 0], r: [0, 0, H] }),
      C(0.11, 0.11, 0.01, cupM, [0, 0.0, 0], null, 18),
      { p, s },
    )
  const z = 0.31
  return turn(
    grp(
      B(1.0, 0.1, 0.66, BLACK, [0, 0.05, 0], 0.03),
      B(0.98, 0.7, 0.6, steel, [0, 0.55, -0.03], 0.06),
      B(1.0, 0.24, 0.62, red, [0, 0.95, -0.03], 0.05),
      B(0.6, 0.04, 0.4, M('#2a2d34', { rough: 0.4, metal: 0.5 }), [0, 0.11, 0.1], 0.01),
      C(0.1, 0.12, 0.12, steel, [0, 0.62, z + 0.04], null, 20),
      grp(
        C(0.085, 0.07, 0.06, steel, [0, 0, 0], null, 18),
        rod([0, -0.01, 0.05], [0, 0.02, 0.32], 0.028, BLACK, 10),
        S(0.035, BLACK, [0, 0.02, 0.33]),
        { p: [0, 0.53, z + 0.04], r: [0, -0.5, 0] },
      ),
      cup([0, 0.13, z + 0.04]),
      T([[-0.38, 0.62, z], [-0.38, 0.58, z + 0.08], [-0.38, 0.36, z + 0.12], [-0.36, 0.26, z + 0.1]], 0.014, steel, 16),
      C(0.035, 0.035, 0.06, BLACK, [-0.38, 0.66, z + 0.0], null, 10),
      T([[0.38, 0.62, z], [0.38, 0.55, z + 0.06], [0.38, 0.42, z + 0.06]], 0.014, steel, 12),
      C(0.1, 0.1, 0.04, steel, [0.22, 0.82, z], [H, 0, 0], 22),
      decal(gauge, 0.17, 0.17, { p: [0.22, 0.82, z + 0.022] }),
      rep(3, (i) => C(0.03, 0.03, 0.03, i === 1 ? glowM('#4dff88', 1) : BLACK, [-0.3 + i * 0.1, 0.82, z + 0.01], [H, 0, 0], 12)),
      rep(4, (i) => rod([-0.45, 1.11, -0.3 + i * 0.18], [0.45, 1.11, -0.3 + i * 0.18], 0.01, steel, 6)),
      both((s) => rod([s * 0.45, 1.08, -0.3], [s * 0.45, 1.16, -0.3], 0.012, steel, 6)),
      cup([-0.2, 1.1, -0.05], 0.9),
      cup([0.05, 1.1, -0.15], 0.9),
      mesh(G.lathe([[0.001, 0], [0.06, 0], [0.09, 0.08], [0.09, 0.2], [0.05, 0.24], [0.001, 0.24]], 16), steel, { p: [0.62, 0.0, 0.15] }),
      T([[0.68, 0.18, 0.15], [0.74, 0.14, 0.15], [0.72, 0.06, 0.15]], 0.015, steel, 8),
    ),
    -0.3,
  )
}

// --- Globe -------------------------------------------------------------------------------
const LANDS = [
  [[-165, 65], [-140, 70], [-100, 72], [-80, 65], [-60, 55], [-65, 45], [-80, 30], [-82, 25], [-97, 18], [-90, 15], [-83, 9], [-105, 22], [-115, 30], [-125, 40], [-125, 50], [-140, 60], [-165, 60]],
  [[-80, 10], [-60, 8], [-35, -5], [-40, -22], [-55, -35], [-68, -55], [-75, -45], [-72, -20], [-81, -5]],
  [[-50, 60], [-20, 70], [-30, 82], [-60, 80]],
  [[-10, 36], [0, 44], [-5, 48], [10, 55], [5, 62], [25, 70], [60, 70], [100, 78], [140, 72], [180, 68], [170, 60], [140, 50], [120, 30], [110, 20], [105, 10], [95, 15], [80, 8], [75, 20], [60, 25], [50, 30], [35, 35], [25, 40], [10, 38]],
  [[-17, 15], [-15, 28], [-5, 36], [10, 37], [32, 31], [43, 12], [51, 12], [40, -15], [32, -28], [20, -35], [12, -18], [9, 4], [-8, 5]],
  [[114, -22], [130, -12], [143, -11], [153, -27], [146, -39], [135, -35], [115, -34]],
  [[-5, 50], [2, 52], [-3, 58], [-6, 56]],
  [[130, 32], [142, 40], [145, 44], [138, 36]],
]
function globe() {
  const earth = tex('item-globe-earth', 512, 256, (x, w, h) => {
    x.fillStyle = '#3b82c4'
    x.fillRect(0, 0, w, h)
    const P = ([lon, lat]) => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h]
    x.fillStyle = '#5cb85c'
    x.strokeStyle = '#3f8f3f'
    x.lineWidth = 2
    for (const land of LANDS) {
      x.beginPath()
      for (const pt of land) x.lineTo(...P(pt))
      x.closePath()
      x.fill()
      x.stroke()
    }
    x.fillStyle = '#d8c07a'
    for (const [lon, lat, r] of [[20, 22, 18], [-110, 38, 8], [135, -25, 10], [65, 45, 12]]) {
      const [px, py] = P([lon, lat])
      x.beginPath()
      x.ellipse(px, py, r * 1.6, r, 0, 0, PI * 2)
      x.fill()
    }
    x.fillStyle = '#f4f8fb'
    x.fillRect(0, h - 18, w, 18)
    x.fillRect(0, 0, w, 8)
    x.strokeStyle = 'rgba(255,255,255,0.25)'
    x.lineWidth = 1
    for (let i = 1; i < 12; i++) {
      x.beginPath()
      x.moveTo((i / 12) * w, 0)
      x.lineTo((i / 12) * w, h)
      x.stroke()
    }
    for (let i = 1; i < 6; i++) {
      x.beginPath()
      x.moveTo(0, (i / 6) * h)
      x.lineTo(w, (i / 6) * h)
      x.stroke()
    }
  })
  const woodM = M('#ffffff', { map: woodTex('item-globe-wood', '#7a4a2a', '#4e2c16'), rough: 0.4 })
  const R = 0.5
  const cy = 0.98
  const tilt = 0.41
  return turn(
    grp(
      mesh(G.lathe([[0.001, 0], [0.34, 0], [0.36, 0.03], [0.34, 0.07], [0.2, 0.1], [0.12, 0.16], [0.08, 0.22], [0.001, 0.22]], 24), woodM),
      mesh(G.lathe([[0.05, 0.2], [0.07, 0.24], [0.05, 0.3], [0.04, 0.38], [0.001, 0.38]], 16), GOLD),
      grp(
        mesh(G.sphere(R, 32, 22), M('#ffffff', { map: earth, rough: 0.35 })),
        mesh(G.torus(R + 0.05, 0.022, PI * 1.15, 8, 40), GOLD, { r: [0, 0, PI * 0.425] }),
        C(0.02, 0.02, 2 * R + 0.14, GOLD, [0, 0, 0], null, 8),
        S(0.035, GOLD, [0, R + 0.07, 0]),
        S(0.035, GOLD, [0, -R - 0.07, 0]),
        { p: [0, cy, 0], r: [0, 0, tilt] },
      ),
      rod([0, 0.36, 0], [Math.sin(tilt) * (R + 0.06), cy - Math.cos(tilt) * (R + 0.06), 0], 0.03, GOLD, 10),
    ),
    -0.2,
  )
}

// --- Synth Keyboard ----------------------------------------------------------------------
function synthKeyboard() {
  const caseM = M('#2a2d34', { rough: 0.35, metal: 0.3 })
  const keyW = M('#f6f6f2', { rough: 0.3 })
  const keyB = M('#16181d', { rough: 0.3 })
  const n = 22
  const kw = 0.064
  const L = n * kw
  const x0 = -L / 2 + kw / 2 + 0.12
  const blacks = []
  for (let i = 0; i < n - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) blacks.push(B(0.038, 0.04, 0.17, keyB, [x0 + (i + 0.5) * kw, 0.085, 0.0], 0.008))
  const screen = tex('item-synth-screen', 128, 48, (x, w, h) => {
    x.fillStyle = '#05141c'
    x.fillRect(0, 0, w, h)
    x.strokeStyle = '#3dd5ff'
    x.lineWidth = 3
    x.beginPath()
    for (let i = 0; i <= w; i += 2) x.lineTo(i, h / 2 + Math.sin(i * 0.15) * 12 * Math.sin(i * 0.02 + 1))
    x.stroke()
  })
  const kb = grp(
    B(L + 0.36, 0.1, 0.5, caseM, [0.03, 0.03, -0.03], 0.03),
    rep(n, (i) => B(kw - 0.006, 0.04, 0.27, keyW, [x0 + i * kw, 0.07, 0.07], 0.008)),
    ...blacks,
    B(L + 0.36, 0.06, 0.16, caseM, [0.03, 0.09, -0.21], 0.03),
    decal(screen, 0.24, 0.09, { p: [-0.2, 0.121, -0.21], r: [-H, 0, 0], emissive: true, glow: 1.2 }),
    rep(8, (i) => C(0.022, 0.022, 0.04, i % 4 === 0 ? RED : M('#c9ced6', { metal: 0.6, rough: 0.3 }), [0.08 + (i % 4) * 0.08, 0.13, -0.24 + Math.floor(i / 4) * 0.07], null, 12)),
    rep(5, (i) => B(0.04, 0.02, 0.04, glowM(['#ff3df0', '#3dd5ff', '#ffd23f', '#4dff88', '#ff8a1e'][i], 1.2), [0.45 + i * 0.07, 0.125, -0.22], 0.008)),
    both((s) => C(0.035, 0.035, 0.03, M('#c9ced6', { metal: 0.6, rough: 0.3 }), [-0.58 + s * 0.04 + 0.04, 0.09, 0.05], [0, 0, H], 14)),
    { p: [0, 0.82, 0], r: [0.22, 0, 0] },
  )
  const xstand = (z) =>
    grp(
      rod([-0.35, 0.0, z], [0.35, 0.75, z], 0.025, DARK_METAL, 8),
      rod([0.35, 0.0, z], [-0.35, 0.75, z], 0.025, DARK_METAL, 8),
      C(0.04, 0.04, 0.04, DARK_METAL, [0, 0.375, z], [H, 0, 0], 12),
    )
  return turn(
    grp(
      kb,
      grp(
        xstand(0.0),
        rod([-0.35, 0.75, 0], [-0.35, 0.75, 0.0], 0.02, DARK_METAL),
        both((s) => grp(rod([s * 0.35, 0.76, -0.22], [s * 0.35, 0.76, 0.22], 0.022, DARK_METAL, 8), C(0.03, 0.03, 0.04, RUBBER, [s * 0.35, 0.76, 0.23], [H, 0, 0], 8))),
        both((s) => grp(rod([s * 0.35, 0.02, -0.25], [s * 0.35, 0.02, 0.25], 0.025, DARK_METAL, 8), C(0.035, 0.035, 0.05, RUBBER, [s * 0.35, 0.02, 0.26], [H, 0, 0], 8), C(0.035, 0.035, 0.05, RUBBER, [s * 0.35, 0.02, -0.26], [H, 0, 0], 8))),
      ),
    ),
    -0.3,
  )
}

export const models = {
  'Gaming PC': gamingPC,
  'Electric Guitar': electricGuitar,
  Recliner: recliner,
  Telescope: telescope,
  'Washing Machine': washingMachine,
  'Lawn Mower': lawnMower,
  'Grandfather Clock': grandfatherClock,
  Drone: drone,
  'Espresso Machine': espressoMachine,
  Globe: globe,
  'Synth Keyboard': synthKeyboard,
}
