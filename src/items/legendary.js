// Legendary Index items: grand showpieces. Each model stands on y = 0 facing +Z
// (card camera azimuth -0.55; screen right = azimuth +1.02).
import { CatmullRomCurve3, Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const H = PI / 2
const UP = new Vector3(0, 1, 0)

const B = (w, h, d, mat, p, rad = 0.03, r) => mesh(G.rbox(w, h, d, rad), mat, { p, r })
const C = (rt, rb, h, mat, p, r, seg = 20) => mesh(G.cyl(rt, rb, h, seg), mat, { p, r })
const S = (rad, mat, p, s) => mesh(G.sphere(rad, 20, 14), mat, { p, s })
const T = (pts, r, mat, seg = 32) => mesh(G.tube(pts, r, seg), mat)
const turn = (o, y) => ((o.rotation.y = y), o)
// Cylinder from a to b, radius r1 at a and r2 at b.
function rod(a, b, r1, mat, seg = 10, r2 = r1) {
  const A = new Vector3(...a)
  const d = new Vector3(...b).sub(A)
  const m = mesh(G.cyl(r2, r1, d.length(), seg), mat)
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

const WHITE = M('#f2f4f7', { rough: 0.45 })
const BLACK = M('#1d1f26', { rough: 0.5 })
const CHROME = M('#d6dbe2', { metal: 0.9, rough: 0.25 })
const DARK_METAL = M('#4a505c', { metal: 0.7, rough: 0.4 })
const GOLD = M('#f0c040', { metal: 0.9, rough: 0.25 })
const RUBBER = M('#26282e', { rough: 0.85 })
const RED = M('#e2453c', { rough: 0.45 })
const VELVET = M('#b01e32', { rough: 0.9 })
const glowM = (c, g = 1.4) => M(c, { emissive: c, glow: g, rough: 0.4 })
const gem = (c) => M(c, { emissive: c, glow: 0.35, rough: 0.1, metal: 0.2 })

// --- Grand Piano -------------------------------------------------------------------------
function grandPiano() {
  const lacquer = M('#15161a', { rough: 0.15, metal: 0.3 })
  const outline = [[-0.7, 0], [0.7, 0], [0.72, 0.35], [0.62, 0.68], [0.4, 0.92], [0.2, 1.15], [0.08, 1.45], [-0.06, 1.75], [-0.3, 1.94], [-0.56, 1.92], [-0.7, 1.75]]
  const keys = tex('item-piano-keys', 512, 64, (x, w, h) => {
    x.fillStyle = '#f8f6ef'
    x.fillRect(0, 0, w, h)
    const n = 36
    const kw = w / n
    x.fillStyle = '#9a988f'
    for (let i = 1; i < n; i++) x.fillRect(i * kw - 1, 0, 2, h)
    x.fillStyle = '#111'
    for (let i = 0; i < n - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) x.fillRect((i + 0.65) * kw, 0, kw * 0.7, h * 0.6)
  })
  const sheet = tex('item-piano-sheet', 128, 96, (x, w, h) => {
    x.fillStyle = '#fbf6e8'
    x.fillRect(0, 0, w, h)
    x.strokeStyle = '#333'
    x.lineWidth = 1
    for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) {
      x.beginPath()
      x.moveTo(8, 14 + s * 28 + l * 4)
      x.lineTo(w - 8, 14 + s * 28 + l * 4)
      x.stroke()
    }
    x.fillStyle = '#222'
    for (let i = 0; i < 18; i++) {
      x.beginPath()
      x.ellipse(14 + (i % 6) * 18, 16 + Math.floor(i / 6) * 28 + ((i * 3) % 5) * 2, 3, 2.2, -0.4, 0, PI * 2)
      x.fill()
    }
  })
  const flat = (o) => ({ ...o, r: [-H, 0, 0] })
  const y0 = 0.7
  const legGeo = G.lathe([[0.001, 0], [0.05, 0], [0.06, 0.06], [0.045, 0.12], [0.06, 0.5], [0.08, 0.62], [0.08, 0.7], [0.001, 0.7]], 14)
  const lid = grp(
    mesh(G.extrude(outline, 0.03), lacquer, flat({ p: [0.7, 0, 0] })),
    { p: [-0.7, y0 + 0.32, 0], r: [0, 0, 0.62] },
  )
  const strings = rep(10, (i) => rod([-0.62 + i * 0.12, y0 + 0.315, -0.15], [-0.62 + i * 0.1, y0 + 0.315, -1.5 + i * 0.09], 0.006, GOLD, 4))
  const bench = grp(
    B(0.9, 0.1, 0.38, lacquer, [0, 0.5, 0], 0.03),
    B(0.84, 0.06, 0.34, M('#2a2a30', { rough: 0.8 }), [0, 0.57, 0], 0.03),
    both((s) => both((t) => rod([s * 0.38, 0, t * 0.14], [s * 0.38, 0.46, t * 0.14], 0.03, lacquer, 10, 0.04))),
    { p: [0, 0, 0.75] },
  )
  return turn(
    grp(
      mesh(G.extrude(outline, 0.32, 0.015), lacquer, flat({ p: [0, y0 + 0.16, 0] })),
      mesh(G.extrude(outline, 0.01), GOLD, flat({ p: [0.02, y0 + 0.31, -0.05], s: [0.92, 0.9, 1] })),
      strings,
      lid,
      rod([0.55, y0 + 0.32, -0.55], [0.34, y0 + 0.98, -0.55], 0.012, lacquer, 6),
      B(1.46, 0.12, 0.36, lacquer, [0, y0 + 0.13, 0.16], 0.02),
      B(1.32, 0.03, 0.22, WHITE, [0, y0 + 0.2, 0.2], 0.008),
      decal(keys, 1.3, 0.21, flat({ p: [0, y0 + 0.217, 0.2] })),
      both((s) => B(0.07, 0.17, 0.36, lacquer, [s * 0.69, y0 + 0.2, 0.16], 0.02)),
      B(1.3, 0.14, 0.03, lacquer, [0, y0 + 0.28, 0.07], 0.01),
      B(0.72, 0.3, 0.02, lacquer, [0, y0 + 0.48, -0.02], 0.01, [-0.25, 0, 0]),
      decal(sheet, 0.32, 0.24, { p: [-0.1, y0 + 0.49, -0.005], r: [-0.25, 0, 0] }),
      decal(sheet, 0.32, 0.24, { p: [0.22, y0 + 0.49, -0.005], r: [-0.25, 0, 0] }),
      mesh(legGeo, lacquer, { p: [-0.6, 0, -0.08] }),
      mesh(legGeo, lacquer, { p: [0.6, 0, -0.08] }),
      mesh(legGeo, lacquer, { p: [-0.42, 0, -1.65] }),
      both((s) => rod([s * 0.12, y0, -0.05], [s * 0.1, 0.1, -0.05], 0.025, lacquer, 8)),
      B(0.3, 0.08, 0.1, lacquer, [0, 0.06, -0.05], 0.02),
      rep(3, (i) => B(0.04, 0.02, 0.12, GOLD, [-0.08 + i * 0.08, 0.05, 0.03], 0.008)),
      bench,
    ),
    -1.25,
  )
}

// --- Treadmill ---------------------------------------------------------------------------
function treadmill() {
  const body = M('#3a3f4b', { rough: 0.4, metal: 0.4 })
  const silver = M('#c3c8d0', { metal: 0.8, rough: 0.3 })
  const belt = tex(
    'item-tread-belt',
    64,
    64,
    (x, w, h) => {
      x.fillStyle = '#1b1c20'
      x.fillRect(0, 0, w, h)
      x.fillStyle = '#26282d'
      for (let i = 0; i < w; i += 8) x.fillRect(i, 0, 3, h)
    },
    { repeat: [6, 1] },
  )
  const screen = tex('item-tread-screen', 192, 96, (x, w, h) => {
    x.fillStyle = '#07131c'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#ff8a1e'
    x.font = font(30)
    x.textAlign = 'center'
    x.fillText('12.5', 50, 44)
    x.fillStyle = '#4dffb0'
    x.fillText('25:00', 140, 44)
    x.font = font(14)
    x.fillStyle = '#9ab'
    x.fillText('KM/H', 50, 64)
    x.fillText('TIME', 140, 64)
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i < 11 ? '#3dd5ff' : '#1a3a4a'
      x.fillRect(16 + i * 10, 76, 7, 12)
    }
  })
  const top = [0.62, 1.22]
  return turn(
    grp(
      B(1.7, 0.14, 0.74, body, [-0.05, 0.12, 0], 0.05),
      mesh(G.box(1.55, 0.02, 0.56), M('#ffffff', { map: belt, rough: 0.8 }), { p: [-0.08, 0.2, 0] }),
      both((s) => B(1.6, 0.05, 0.08, silver, [-0.08, 0.205, s * 0.33], 0.02)),
      C(0.06, 0.06, 0.6, silver, [-0.88, 0.14, 0], [H, 0, 0], 14),
      B(0.4, 0.26, 0.8, body, [0.75, 0.2, 0], 0.1),
      B(0.2, 0.04, 0.6, M('#e0302f', { rough: 0.4 }), [0.66, 0.335, 0], 0.015),
      both((s) => rod([0.78, 0.25, s * 0.36], [top[0], top[1] - 0.05, s * 0.36], 0.04, silver, 12)),
      grp(
        B(0.3, 0.26, 0.84, body, [0, 0, 0], 0.06),
        B(0.04, 0.22, 0.5, M('#101318', { rough: 0.3 }), [-0.14, 0.0, 0], 0.02),
        decal(screen, 0.44, 0.2, { p: [-0.162, 0.0, 0], r: [0, -H, 0], emissive: true, glow: 1.1 }),
        both((s) => rep(3, (i) => B(0.03, 0.03, 0.05, s > 0 ? M('#4dd08a', { rough: 0.4 }) : M('#ffd23f', { rough: 0.4 }), [-0.15, -0.06 + i * 0.06, s * 0.33], 0.008))),
        { p: [top[0], top[1], 0], r: [0, 0, -0.5] },
      ),
      both((s) => T([[top[0] - 0.02, top[1] - 0.12, s * 0.38], [0.4, 1.0, s * 0.4], [0.1, 1.0, s * 0.4], [0.0, 0.98, s * 0.4]], 0.028, silver, 16)),
      both((s) => C(0.04, 0.04, 0.24, BLACK, [0.18, 1.0, s * 0.4], [0, 0, H], 12)),
      C(0.03, 0.035, 0.07, BLACK, [0.64, 1.15, 0.3], null, 12),
      B(0.03, 0.04, 0.03, RED, [0.5, 1.12, -0.02], 0.01),
      both((s) => B(0.1, 0.05, 0.1, RUBBER, [-0.85, 0.025, s * 0.3], 0.02)),
    ),
    0.25,
  )
}

// --- Drum Kit ----------------------------------------------------------------------------
function drumKit() {
  const shellM = M('#c8202a', { rough: 0.25, metal: 0.45 })
  const headM = M('#f4f1ea', { rough: 0.6 })
  const cym = M('#e8b84a', { metal: 0.85, rough: 0.3, side: 2 })
  const stand = M('#c9ced6', { metal: 0.85, rough: 0.3 })
  const logo = tex('item-drum-logo', 256, 256, (x, w) => {
    const c = w / 2
    x.fillStyle = '#f4f1ea'
    x.beginPath()
    x.arc(c, c, 126, 0, PI * 2)
    x.fill()
    x.fillStyle = '#c8202a'
    x.beginPath()
    x.arc(c, c, 80, 0, PI * 2)
    x.fill()
    x.font = font(56)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillStyle = '#ffd23f'
    x.fillText('BOOM', c, c + 4)
  })
  const drum = (r, h, p, rot = [0, 0, 0], snare = false) =>
    grp(
      C(r, r, h, snare ? stand : shellM, [0, 0, 0], null, 22),
      C(r * 0.97, r * 0.97, h + 0.01, headM, [0, 0, 0], null, 22),
      mesh(G.torus(r + 0.005, 0.012, PI * 2, 6, 28), stand, { p: [0, h / 2, 0], r: [H, 0, 0] }),
      mesh(G.torus(r + 0.005, 0.012, PI * 2, 6, 28), stand, { p: [0, -h / 2, 0], r: [H, 0, 0] }),
      rep(6, (i) => B(0.02, h * 0.4, 0.03, stand, [Math.sin((i / 6) * PI * 2) * (r + 0.01), 0, Math.cos((i / 6) * PI * 2) * (r + 0.01)], 0.008, [0, (i / 6) * PI * 2, 0])),
      { p, r: rot },
    )
  const cymbal = (r, p, tilt = [0, 0, 0]) => grp(mesh(G.lathe([[0.001, 0.035], [0.035, 0.035], [0.05, 0.02], [r, 0]], 24), cym), { p, r: tilt })
  const tripod = (x, z, h, r = 0.18) =>
    grp(
      rod([x, 0.25, z], [x, h, z], 0.015, stand, 8),
      rep(3, (i) => {
        const a = (i / 3) * PI * 2 + 0.4
        return rod([x, 0.28, z], [x + Math.cos(a) * r, 0.0, z + Math.sin(a) * r], 0.012, stand, 6)
      }),
    )
  const bassR = 0.33
  return turn(
    grp(
      grp(
        C(bassR, bassR, 0.38, shellM, [0, 0, 0], [H, 0, 0], 26),
        C(bassR * 0.96, bassR * 0.96, 0.39, headM, [0, 0, 0], [H, 0, 0], 26),
        decal(logo, bassR * 1.9, bassR * 1.9, { p: [0, 0, 0.197] }),
        mesh(G.torus(bassR + 0.01, 0.02, PI * 2, 6, 32), stand, { p: [0, 0, 0.19] }),
        mesh(G.torus(bassR + 0.01, 0.02, PI * 2, 6, 32), stand, { p: [0, 0, -0.19] }),
        rep(8, (i) => B(0.03, 0.03, 0.12, stand, [Math.cos((i / 8) * PI * 2) * (bassR + 0.015), Math.sin((i / 8) * PI * 2) * (bassR + 0.015), 0.12], 0.01)),
        both((s) => rod([s * 0.25, -0.15, 0.1], [s * 0.4, -bassR, 0.18], 0.012, stand, 6)),
        { p: [0, bassR + 0.01, 0] },
      ),
      rod([0, 0.62, -0.02], [0, 0.78, -0.02], 0.02, stand, 8),
      drum(0.14, 0.16, [-0.17, 0.86, -0.02], [-0.35, 0, 0.12]),
      drum(0.15, 0.17, [0.18, 0.86, -0.02], [-0.35, 0, -0.12]),
      drum(0.2, 0.28, [0.55, 0.5, -0.32], [-0.08, 0, 0]),
      ...[0, 1, 2].map((i) => rod([0.55 + Math.cos(i * 2.1) * 0.2, 0.45, -0.32 + Math.sin(i * 2.1) * 0.2], [0.55 + Math.cos(i * 2.1) * 0.27, 0.0, -0.32 + Math.sin(i * 2.1) * 0.27], 0.012, stand, 6)),
      tripod(-0.48, -0.36, 0.55),
      drum(0.17, 0.1, [-0.48, 0.62, -0.36], [-0.15, 0, 0.1], true),
      rod([-0.5, 0.68, -0.3], [-0.28, 0.74, -0.52], 0.01, M('#e8c48a', { rough: 0.5 }), 6),
      rod([-0.44, 0.68, -0.28], [-0.2, 0.72, -0.46], 0.01, M('#e8c48a', { rough: 0.5 }), 6),
      tripod(-0.8, -0.2, 0.95),
      cymbal(0.18, [-0.8, 0.92, -0.2]),
      grp(cymbal(0.18, [0, 0, 0]), { p: [-0.8, 0.96, -0.2], r: [PI, 0, 0] }),
      B(0.08, 0.02, 0.22, stand, [-0.8, 0.02, -0.3], 0.008),
      tripod(-0.5, 0.2, 1.15),
      rod([-0.5, 1.15, 0.2], [-0.42, 1.4, 0.1], 0.012, stand, 6),
      cymbal(0.25, [-0.42, 1.42, 0.1], [-0.35, 0, 0.25]),
      tripod(0.75, 0.05, 1.05),
      rod([0.75, 1.05, 0.05], [0.66, 1.22, -0.05], 0.012, stand, 6),
      cymbal(0.28, [0.66, 1.24, -0.05], [-0.3, 0, -0.2]),
      grp(
        C(0.17, 0.15, 0.08, M('#2a2a30', { rough: 0.8 }), [0, 0.5, 0], null, 18),
        rod([0, 0.2, 0], [0, 0.46, 0], 0.02, stand, 8),
        rep(3, (i) => rod([0, 0.22, 0], [Math.cos(i * 2.1 + 0.5) * 0.2, 0, Math.sin(i * 2.1 + 0.5) * 0.2], 0.012, stand, 6)),
        { p: [0, 0, -0.65] },
      ),
      B(0.08, 0.02, 0.22, stand, [0, 0.02, -0.32], 0.008),
      rod([0, 0.05, -0.22], [0, 0.3, -0.2], 0.008, stand, 6),
      S(0.03, headM, [0, 0.3, -0.2]),
    ),
    -0.35,
  )
}

// --- Pool Table --------------------------------------------------------------------------
function poolTable() {
  const wood = M('#ffffff', { map: woodTex('item-pool-wood', '#6b3a1e', '#3e1f0e', [3, 1]), rough: 0.35 })
  const woodDark = M('#4a260f', { rough: 0.4 })
  const felt = M('#1f8a4c', { rough: 0.95 })
  const L = 2.4
  const Wd = 1.36
  const ty = 0.86
  const legGeo = G.lathe([[0.001, 0], [0.12, 0], [0.13, 0.06], [0.08, 0.12], [0.1, 0.25], [0.14, 0.4], [0.09, 0.55], [0.11, 0.64], [0.001, 0.64]], 16)
  const cols = ['#ffd23f', '#2b5fd9', '#e2453c', '#7a3fd1', '#ff8a1e', '#1f8a4c', '#8a1e2e', '#111111', '#ffd23f', '#2b5fd9', '#e2453c', '#7a3fd1', '#ff8a1e', '#1f8a4c', '#8a1e2e']
  const br = 0.045
  const balls = []
  let k = 0
  for (let row = 0; row < 5; row++)
    for (let j = 0; j <= row; j++) {
      const m = M(cols[k++], { rough: 0.15 })
      balls.push(S(br, m, [0.45 + row * br * 1.75, ty + 0.025 + br, (j - row / 2) * br * 2.02]))
    }
  const pockets = []
  for (const x of [-L / 2 + 0.07, 0, L / 2 - 0.07]) for (const z of [-Wd / 2 + 0.07, Wd / 2 - 0.07]) pockets.push(C(0.075, 0.075, 0.08, BLACK, [x, ty + 0.03, z], null, 16), C(0.09, 0.07, 0.1, GOLD, [x, ty - 0.06, z], null, 16))
  return turn(
    grp(
      B(L, 0.24, Wd, wood, [0, ty - 0.12, 0], 0.04),
      B(L - 0.2, 0.04, Wd - 0.2, felt, [0, ty + 0.01, 0], 0.01),
      both((s) => B(L, 0.08, 0.1, wood, [0, ty + 0.04, s * (Wd / 2 - 0.05)], 0.03)),
      both((s) => B(0.1, 0.08, Wd, wood, [s * (L / 2 - 0.05), ty + 0.04, 0], 0.03)),
      both((s) => B(L - 0.28, 0.05, 0.04, felt, [0, ty + 0.045, s * (Wd / 2 - 0.12)], 0.015)),
      both((s) => B(0.04, 0.05, Wd - 0.28, felt, [s * (L / 2 - 0.12), ty + 0.045, 0], 0.015)),
      ...pockets,
      rep(6, (i) => S(0.012, M('#f4f1ea', { rough: 0.3 }), [-0.9 + i * 0.36, ty + 0.085, Wd / 2 - 0.05])),
      both((s) => both((t) => mesh(legGeo, woodDark, { p: [s * (L / 2 - 0.2), 0, t * (Wd / 2 - 0.18)] }))),
      B(L - 0.3, 0.06, Wd - 0.3, woodDark, [0, ty - 0.27, 0], 0.02),
      ...balls,
      S(br, M('#fbf8f0', { rough: 0.15 }), [-0.55, ty + 0.025 + br, 0]),
      rod([-0.65, ty + 0.08, 0.02], [-1.9, ty + 0.36, 0.32], 0.012, M('#e8c48a', { rough: 0.4 }), 10, 0.025),
      rod([-1.55, ty + 0.28, 0.24], [-1.9, ty + 0.36, 0.32], 0.026, BLACK, 10, 0.027),
      C(0.012, 0.012, 0.02, M('#3b82d6', { rough: 0.6 }), [-0.64, ty + 0.08, 0.02], [0, 0, H], 8),
      mesh(G.extrude([[-0.1, 0], [0.1, 0], [0, 0.17]], 0.02, 0.005), woodDark, { p: [0.95, ty + 0.06, -0.4], r: [-H, 0, 0] }),
    ),
    -0.3,
  )
}

// --- Golden Lamp (genie lamp) ------------------------------------------------------------
function goldenLamp() {
  const gold = M('#ffcc33', { metal: 0.95, rough: 0.18 })
  const smoke = M('#c58cff', { emissive: '#a050ff', glow: 1.2, opacity: 0.65, rough: 1 })
  const body = G.lathe([[0.001, 0], [0.18, 0], [0.2, 0.03], [0.12, 0.08], [0.11, 0.11], [0.3, 0.2], [0.42, 0.31], [0.44, 0.39], [0.38, 0.47], [0.22, 0.53], [0.14, 0.57], [0.17, 0.61], [0.001, 0.61]], 28)
  const sparkle = M('#ffffff', { emissive: '#ffe680', glow: 2 })
  return turn(
    grp(
      B(1.2, 0.18, 0.8, VELVET, [0.05, 0.09, 0], 0.09),
      both((s) => both((t) => grp(S(0.035, GOLD, [0, 0, 0]), mesh(G.cone(0.03, 0.1, 10), GOLD, { p: [0, -0.07, 0], r: [PI, 0, 0] }), { p: [0.05 + s * 0.58, 0.14, t * 0.38] }))),
      grp(
        mesh(body, gold, { s: [1, 1, 0.8] }),
        mesh(G.dome(0.16, H, 20, 8), gold, { p: [0, 0.6, 0] }),
        S(0.04, gold, [0, 0.77, 0]),
        mesh(G.cone(0.025, 0.1, 10), gold, { p: [0, 0.84, 0] }),
        mesh(G.torus(0.42, 0.02, PI * 2, 6, 32), gold, { p: [0, 0.36, 0], r: [H, 0, 0], s: [1, 0.8, 1] }),
        T([[0.36, 0.33, 0], [0.55, 0.36, 0], [0.72, 0.44, 0]], 0.075, gold, 12),
        T([[0.7, 0.43, 0], [0.86, 0.54, 0], [0.98, 0.66, 0]], 0.045, gold, 12),
        mesh(G.torus(0.05, 0.015, PI * 2, 6, 14), gold, { p: [0.985, 0.665, 0], r: [H, 0.8, 0] }),
        T([[-0.36, 0.46, 0], [-0.62, 0.58, 0], [-0.72, 0.4, 0], [-0.58, 0.22, 0], [-0.4, 0.26, 0]], 0.035, gold, 24),
        S(0.05, gem('#e8203a'), [0, 0.38, 0.35], [1, 1, 0.5]),
        S(0.035, gem('#2b7bff'), [-0.18, 0.4, 0.31], [1, 1, 0.5]),
        S(0.035, gem('#22c96a'), [0.18, 0.4, 0.31], [1, 1, 0.5]),
        { p: [0, 0.18, 0] },
      ),
      T([[1.0, 0.86, 0], [1.08, 1.05, 0.02], [0.96, 1.22, 0.04], [1.06, 1.42, 0.02], [0.94, 1.6, 0], [1.02, 1.74, -0.02]], 0.05, smoke, 32),
      S(0.1, smoke, [1.02, 1.8, -0.02]),
      rep(5, (i) => mesh(G.ico(0.03, 0), sparkle, { p: [0.85 + (i % 3) * 0.15, 1.0 + i * 0.17, (i % 2) * 0.1 - 0.05] })),
    ),
    -0.35,
  )
}

// --- Fountain ----------------------------------------------------------------------------
function fountain() {
  const stone = M('#d4ccbd', { rough: 0.9 })
  const stone2 = M('#bfb6a5', { rough: 0.9 })
  const water = M('#4fb3f0', { opacity: 0.7, rough: 0.05, emissive: '#1a6aa0', glow: 0.3 })
  const fall = M('#bfe6ff', { opacity: 0.45, rough: 0.05, side: 2 })
  const bowl = (r) => G.lathe([[0.001, 0], [0.1, 0], [r * 0.8, r * 0.22], [r, r * 0.36], [r, r * 0.44], [r * 0.9, r * 0.44], [r * 0.75, r * 0.3], [0.001, r * 0.2]], 28)
  return turn(
    grp(
      mesh(G.lathe([[0.001, 0], [1.05, 0], [1.08, 0.06], [1.04, 0.34], [1.1, 0.38], [1.1, 0.46], [0.96, 0.46], [0.94, 0.14], [0.001, 0.14]], 32), stone),
      C(0.95, 0.95, 0.02, water, [0, 0.38, 0], null, 32),
      rep(6, (i) => C(0.035, 0.035, 0.01, GOLD, [Math.cos(i * 1.3) * (0.3 + (i % 3) * 0.18), 0.4, Math.sin(i * 1.3) * (0.3 + (i % 3) * 0.18)], [0.3, 0, 0.2], 12)),
      mesh(G.lathe([[0.001, 0.14], [0.26, 0.14], [0.2, 0.25], [0.13, 0.4], [0.12, 0.8], [0.18, 0.92], [0.001, 0.92]], 20), stone2),
      mesh(bowl(0.62), stone, { p: [0, 0.9, 0] }),
      C(0.56, 0.56, 0.02, water, [0, 0.9 + 0.62 * 0.38, 0], null, 28),
      mesh(G.cyl(0.63, 0.72, 0.62 * 0.44 + 0.9 - 0.39, 28, true), fall, { p: [0, (0.9 + 0.62 * 0.44 + 0.39) / 2, 0] }),
      mesh(G.lathe([[0.001, 1.1], [0.12, 1.1], [0.08, 1.25], [0.07, 1.45], [0.11, 1.52], [0.001, 1.52]], 16), stone2),
      mesh(bowl(0.32), stone, { p: [0, 1.5, 0] }),
      C(0.28, 0.28, 0.02, water, [0, 1.5 + 0.32 * 0.38, 0], null, 24),
      mesh(G.cyl(0.33, 0.4, 1.5 + 0.32 * 0.44 - (0.9 + 0.62 * 0.4), 24, true), fall, { p: [0, (1.5 + 0.32 * 0.44 + 0.9 + 0.62 * 0.4) / 2, 0] }),
      mesh(G.lathe([[0.001, 1.6], [0.06, 1.6], [0.04, 1.7], [0.09, 1.78], [0.05, 1.86], [0.001, 1.88]], 14), stone2),
      rep(5, (i) => {
        const a = (i / 5) * PI * 2
        return T([[0, 1.88, 0], [Math.cos(a) * 0.12, 2.02, Math.sin(a) * 0.12], [Math.cos(a) * 0.24, 1.95, Math.sin(a) * 0.24], [Math.cos(a) * 0.3, 1.7, Math.sin(a) * 0.3]], 0.018, fall, 12)
      }),
      rod([0, 1.86, 0], [0, 2.05, 0], 0.025, fall, 8),
    ),
    0,
  )
}

// --- Vending Machine ---------------------------------------------------------------------
function vendingMachine() {
  const red = M('#d8202a', { rough: 0.3, metal: 0.3 })
  const inner = M('#22252c', { rough: 0.6 })
  const glass = M('#d8f0ff', { opacity: 0.2, rough: 0.03 })
  const header = tex('item-vend-header', 256, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffe680')
    g.addColorStop(1, '#ff9a1e')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.font = font(44)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.lineWidth = 7
    x.strokeStyle = '#8a1010'
    x.strokeText('SNACKS', w / 2, h / 2 + 2)
    x.fillStyle = '#ffffff'
    x.fillText('SNACKS', w / 2, h / 2 + 2)
  })
  const disp = tex('item-vend-disp', 96, 32, (x, w, h) => {
    x.fillStyle = '#0a1a10'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#5dff8a'
    x.font = font(22)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('$1.00', w / 2, h / 2 + 1)
  })
  const zf = 0.4
  const items = []
  const kinds = [
    (c) => C(0.045, 0.045, 0.14, M(c, { rough: 0.3, metal: 0.4 }), [0, 0.07, 0], null, 12),
    (c) => B(0.1, 0.15, 0.05, M(c, { rough: 0.5 }), [0, 0.075, 0], 0.03),
    (c) => B(0.12, 0.05, 0.04, M(c, { rough: 0.5 }), [0, 0.025, 0], 0.015),
  ]
  const palette = ['#e2453c', '#3b82d6', '#ffd23f', '#4caf50', '#ff8a1e', '#7a3fd1']
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 4; c++) {
      const kind = kinds[(r + (r > 2 ? 1 : 0)) % 3]
      items.push(grp(kind(palette[(r * 2 + c) % 6]), { p: [-0.33 + c * 0.155, 0.5 + r * 0.26, 0.25] }))
    }
  return turn(
    grp(
      B(1.0, 1.86, 0.5, red, [0, 0.99, -0.15], 0.05),
      B(0.26, 1.86, 0.8, red, [0.37, 0.99, 0], 0.04),
      B(0.07, 1.86, 0.8, red, [-0.465, 0.99, 0], 0.03),
      B(1.0, 0.14, 0.8, red, [0, 1.85, 0], 0.03),
      B(1.0, 0.44, 0.8, red, [0, 0.28, 0], 0.04),
      B(1.06, 0.06, 0.84, M('#2a2d34', { rough: 0.5 }), [0, 0.03, 0], 0.02),
      B(0.7, 1.34, 0.02, inner, [-0.1, 1.14, 0.11], 0.01),
      rep(5, (r) => B(0.68, 0.015, 0.2, M('#8e96a3', { metal: 0.7, rough: 0.3 }), [-0.1, 0.49 + r * 0.26, 0.25], 0.004)),
      B(0.68, 0.03, 0.02, glowM('#fff6dc', 1.2), [-0.1, 1.76, 0.35], 0.01),
      ...items,
      B(0.7, 1.34, 0.015, glass, [-0.1, 1.14, zf - 0.01], 0.006),
      B(0.72, 0.04, 0.04, CHROME, [-0.1, 1.8, zf], 0.015),
      B(0.72, 0.04, 0.04, CHROME, [-0.1, 0.48, zf], 0.015),
      B(0.6, 0.2, 0.04, M('#16171c', { rough: 0.5 }), [-0.12, 0.22, zf + 0.0], 0.03),
      B(0.56, 0.08, 0.02, M('#30333b', { rough: 0.4 }), [-0.12, 0.26, zf + 0.02], 0.02),
      B(0.2, 1.3, 0.03, M('#2a2d34', { rough: 0.4 }), [0.38, 1.14, zf], 0.02),
      decal(disp, 0.14, 0.05, { p: [0.38, 1.6, zf + 0.017], emissive: true, glow: 1.2 }),
      rep(12, (i) => B(0.035, 0.03, 0.015, WHITE, [0.34 + (i % 3) * 0.04, 1.48 - Math.floor(i / 3) * 0.045, zf + 0.018], 0.006)),
      B(0.08, 0.1, 0.02, CHROME, [0.38, 1.2, zf + 0.02], 0.015),
      B(0.03, 0.06, 0.02, BLACK, [0.38, 1.2, zf + 0.032], 0.008),
      B(0.12, 0.03, 0.02, BLACK, [0.38, 1.06, zf + 0.022], 0.008),
      B(0.12, 0.08, 0.06, M('#16171c', { rough: 0.5 }), [0.38, 0.55, zf + 0.02], 0.02),
      B(1.06, 0.26, 0.86, red, [0, 1.98, 0.02], 0.06),
      decal(header, 0.92, 0.22, { p: [0, 1.98, 0.455], emissive: true, glow: 1.0 }),
      grp(
        C(0.045, 0.045, 0.14, M('#3b82d6', { rough: 0.3, metal: 0.4 }), [0, 0, 0], null, 12),
        C(0.038, 0.045, 0.012, CHROME, [0, 0.075, 0], null, 12),
        { p: [-0.2, 0.24, zf + 0.06], r: [1.2, 0, 0.3] },
      ),
      B(0.56, 0.03, 0.14, M('#16171c', { rough: 0.5 }), [-0.12, 0.17, zf + 0.07], 0.012, [0.5, 0, 0]),
      grp(
        mesh(G.lathe([[0.001, 0], [0.16, 0], [0.18, 0.04], [0.18, 0.3], [0.14, 0.4], [0.07, 0.5], [0.06, 0.62], [0.07, 0.65], [0.001, 0.66]], 22), M('#e2453c', { rough: 0.2, metal: 0.2 })),
        C(0.182, 0.182, 0.14, M('#ffffff', { rough: 0.3 }), [0, 0.17, 0], null, 22),
        C(0.075, 0.075, 0.04, M('#f4f1ea', { metal: 0.6, rough: 0.3 }), [0, 0.65, 0], null, 14),
        { p: [0.28, 2.11, 0.05] },
      ),
    ),
    -0.3,
  )
}

// --- Knight Armor ------------------------------------------------------------------------
function knightArmor() {
  const steel = M('#c9ced6', { metal: 0.85, rough: 0.28 })
  const steelDark = M('#8e96a3', { metal: 0.85, rough: 0.35 })
  const plume = M('#d8202a', { rough: 0.8 })
  const wood = M('#ffffff', { map: woodTex('item-knight-wood', '#6b3a1e', '#3e1f0e'), rough: 0.45 })
  const torso = G.lathe([[0.19, 0], [0.23, 0.08], [0.21, 0.18], [0.25, 0.36], [0.28, 0.48], [0.22, 0.56], [0.1, 0.62], [0.001, 0.62]], 22)
  const leg = (s) =>
    grp(
      B(0.14, 0.08, 0.26, steel, [0, 0.16, 0.05], 0.04),
      C(0.06, 0.07, 0.36, steel, [0, 0.39, 0], null, 14),
      S(0.08, steelDark, [0, 0.6, 0.02]),
      C(0.085, 0.07, 0.34, steel, [0, 0.8, 0], null, 14),
      { p: [s * 0.13, 0, 0] },
    )
  const arm = (s) =>
    grp(
      grp(mesh(G.dome(0.14, H, 18, 8), steel), mesh(G.torus(0.13, 0.02, PI * 2, 6, 18), steelDark, { p: [0, 0.0, 0], r: [H, 0, 0] }), mesh(G.dome(0.12, H, 18, 8), steel, { p: [0, -0.08, 0], s: [1, 0.6, 1] }), { p: [s * 0.3, 1.53, 0], r: [0, 0, -s * 0.5] }),
      rod([s * 0.32, 1.48, 0], [s * 0.3, 1.2, 0.05], 0.055, steel, 12),
      S(0.07, steelDark, [s * 0.3, 1.18, 0.05]),
      rod([s * 0.3, 1.18, 0.05], [s * 0.09, 1.1, 0.27], 0.05, steel, 12, 0.06),
      B(0.1, 0.1, 0.12, steelDark, [s * 0.07, 1.1, 0.3], 0.04),
    )
  return turn(
    grp(
      B(0.8, 0.12, 0.62, wood, [0, 0.06, 0], 0.03),
      B(0.86, 0.04, 0.68, M('#4a260f', { rough: 0.4 }), [0, 0.12, 0], 0.015),
      grp(leg(1), leg(-1), { p: [0, 0.12, 0] }),
      mesh(G.lathe([[0.2, 0], [0.25, 0.02], [0.3, -0.14], [0.27, -0.16]], 22), steel, { p: [0, 1.08, 0] }),
      mesh(torso, steel, { p: [0, 1.04, 0], s: [1, 1, 0.75] }),
      B(0.02, 0.45, 0.04, steelDark, [0, 1.3, 0.2], 0.01, [0.1, 0, 0]),
      C(0.23, 0.23, 0.05, GOLD, [0, 1.07, 0], null, 22),
      C(0.11, 0.13, 0.1, steelDark, [0, 1.68, 0], null, 16),
      arm(1),
      arm(-1),
      grp(
        B(0.05, 0.85, 0.012, M('#e8ecf2', { metal: 0.95, rough: 0.15 }), [0, -0.43, 0], 0.01),
        mesh(G.cone(0.025, 0.06, 4), M('#e8ecf2', { metal: 0.95, rough: 0.15 }), { p: [0, -0.88, 0], r: [PI, 0, 0], s: [1, 1, 0.25] }),
        B(0.32, 0.035, 0.04, GOLD, [0, 0.0, 0], 0.012),
        C(0.022, 0.022, 0.14, M('#4a260f', { rough: 0.6 }), [0, 0.08, 0], null, 10),
        S(0.035, GOLD, [0, 0.17, 0]),
        { p: [0, 1.0, 0.3] },
      ),
      grp(
        S(0.17, steel, [0, 0, 0], [0.95, 1.12, 1.05]),
        mesh(G.extrude([[-0.13, -0.12], [0.13, -0.12], [0.15, 0.05], [0.06, 0.08], [0, 0.12], [-0.06, 0.08], [-0.15, 0.05]], 0.08, 0.01), steel, { p: [0, 0, 0.13] }),
        both((s) => B(0.08, 0.012, 0.02, BLACK, [s * 0.055, 0.03, 0.19], 0.004)),
        rep(4, (i) => B(0.012, 0.04, 0.02, BLACK, [-0.045 + i * 0.03, -0.05, 0.19], 0.004)),
        B(0.025, 0.2, 0.3, steelDark, [0, 0.14, 0], 0.012),
        C(0.025, 0.035, 0.06, GOLD, [0, 0.21, -0.04], null, 10),
        T([[0, 0.22, -0.04], [0, 0.4, -0.06], [0, 0.44, -0.2], [0, 0.3, -0.34], [0, 0.12, -0.38]], 0.05, plume, 24),
        T([[0.03, 0.22, -0.04], [0.05, 0.36, -0.08], [0.06, 0.36, -0.22], [0.05, 0.2, -0.3]], 0.035, plume, 20),
        T([[-0.03, 0.22, -0.04], [-0.05, 0.36, -0.08], [-0.06, 0.36, -0.22], [-0.05, 0.2, -0.3]], 0.035, plume, 20),
        { p: [0, 1.86, 0] },
      ),
    ),
    -0.3,
  )
}

// --- Hot Tub -----------------------------------------------------------------------------
function hotTub() {
  const slats = tex(
    'item-tub-slats',
    128,
    64,
    (x, w, h) => {
      x.fillStyle = '#9a5f34'
      x.fillRect(0, 0, w, h)
      for (let i = 0; i < 8; i++) {
        x.fillStyle = i % 2 ? '#8a5229' : '#a86b3c'
        x.fillRect(i * 16 + 1, 0, 14, h)
        x.fillStyle = '#5a3216'
        x.fillRect(i * 16, 0, 2, h)
      }
    },
    { repeat: [3, 1] },
  )
  const panel = M('#ffffff', { map: slats, rough: 0.6 })
  const shell = M('#f2f4f7', { rough: 0.2 })
  const water = M('#3fd0e8', { emissive: '#1aa8c8', glow: 0.55, rough: 0.05, opacity: 0.85 })
  const cover = M('#4a505c', { rough: 0.7 })
  const steam = M('#ffffff', { opacity: 0.5, rough: 1 })
  const S2 = 1.6
  return turn(
    grp(
      B(S2, 0.74, S2, panel, [0, 0.37, 0], 0.12),
      B(S2 + 0.06, 0.08, S2 + 0.06, shell, [0, 0.78, 0], 0.04),
      B(S2 - 0.2, 0.03, S2 - 0.2, water, [0, 0.8, 0], 0.01),
      rep(9, (i) => S(0.03 + (i % 3) * 0.012, M('#ffffff', { opacity: 0.8, rough: 0.2 }), [Math.cos(i * 2.3) * (0.2 + (i % 4) * 0.12), 0.82, Math.sin(i * 2.3) * (0.2 + (i % 4) * 0.12)], [1, 0.5, 1])),
      both((s) => B(0.24, 0.08, 0.14, M('#3a3f4b', { rough: 0.5 }), [s * 0.5, 0.84, -0.7], 0.04)),
      rep(11, (i) => S(0.07 + (i % 3) * 0.025, M('#f4fbff', { rough: 0.4 }), [Math.cos(i * 1.9) * (0.1 + (i % 4) * 0.09) + 0.1, 0.84 + (i % 3) * 0.03, Math.sin(i * 1.9) * (0.1 + (i % 4) * 0.09)])),
      S(0.12, steam, [0.27, 1.55, 0.1]),
      S(0.1, steam, [-0.3, 1.42, -0.2]),
      B(0.2, 0.04, 0.12, M('#3a3f4b', { rough: 0.4 }), [0.65, 0.84, 0.72], 0.015),
      B(0.12, 0.02, 0.06, M('#3dd5ff', { emissive: '#3dd5ff', glow: 1.2 }), [0.65, 0.865, 0.72], 0.008),
      grp(
        B(S2 + 0.04, 0.1, 0.8, cover, [0, 0.05, 0.4], 0.04),
        B(S2 + 0.04, 0.1, 0.8, cover, [0, 0.15, 0.4], 0.04),
        { p: [0, 0.82, -S2 / 2 + 0.02], r: [-1.95, 0, 0] },
      ),
      T([[0.56, 0.0, S2 / 2 + 0.36], [0.56, 0.75, S2 / 2 + 0.34], [0.56, 1.05, S2 / 2 + 0.2], [0.56, 1.0, S2 / 2 - 0.02], [0.56, 0.86, S2 / 2 - 0.08]], 0.025, CHROME, 24),
      B(1.0, 0.18, 0.32, panel, [0, 0.09, S2 / 2 + 0.16], 0.04),
      B(1.0, 0.18, 0.2, panel, [0, 0.27, S2 / 2 + 0.1], 0.04),
      grp(
        S(0.1, M('#ffd23f', { rough: 0.3 }), [0, 0, 0], [1, 0.7, 1.2]),
        S(0.07, M('#ffd23f', { rough: 0.3 }), [0, 0.1, 0.06]),
        S(0.03, M('#ff8a1e', { rough: 0.4 }), [0, 0.09, 0.13], [1.2, 0.5, 1]),
        { p: [-0.3, 0.86, 0.3], r: [0, -0.6, 0] },
      ),
      T([[0.2, 0.85, 0.1], [0.28, 1.05, 0.12], [0.18, 1.25, 0.1], [0.26, 1.45, 0.1]], 0.05, steam, 16),
      T([[-0.25, 0.85, -0.2], [-0.32, 1.02, -0.18], [-0.22, 1.2, -0.2], [-0.3, 1.35, -0.2]], 0.045, steam, 16),
      rep(4, (i) => S(0.02, M('#7affd4', { emissive: '#7affd4', glow: 1.6 }), [-0.55 + i * 0.37, 0.795, S2 / 2 - 0.11])),
    ),
    -0.3,
  )
}

// --- Harp --------------------------------------------------------------------------------
function harp() {
  const gold = M('#f0c040', { metal: 0.9, rough: 0.22 })
  const woodM = M('#ffffff', { map: woodTex('item-harp-wood', '#d9a15a', '#a86b2c'), rough: 0.35 })
  const neckPts = [[-0.36, 1.78, 0], [-0.12, 1.68, 0], [0.12, 1.74, 0], [0.33, 1.62, 0], [0.46, 1.46, 0]]
  const curve = new CatmullRomCurve3(neckPts.map((p) => new Vector3(...p)))
  const samples = curve.getPoints(80)
  const neckY = (x) => {
    let best = samples[0]
    for (const p of samples) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p
    return best.y
  }
  const A = [-0.12, 0.18]
  const Bp = [0.44, 1.44]
  const strings = []
  const n = 22
  for (let i = 0; i < n; i++) {
    const t = 0.06 + (i / (n - 1)) * 0.86
    const x = A[0] + (Bp[0] - A[0]) * t
    const y = A[1] + (Bp[1] - A[1]) * t
    const col = i % 7 === 0 ? '#e2453c' : i % 7 === 3 ? '#2b5fd9' : '#f4ecd8'
    strings.push(rod([x - 0.03, y + 0.02, 0], [x - 0.03, neckY(x - 0.03) - 0.04, 0], 0.005, M(col, { rough: 0.4 }), 4))
  }
  return turn(
    grp(
      B(0.62, 0.12, 0.38, woodM, [0.0, 0.06, 0], 0.03),
      rep(4, (i) => B(0.03, 0.02, 0.1, gold, [-0.2 + i * 0.13, 0.03, 0.2], 0.008)),
      mesh(G.extrude([[-0.26, 0.12], [-0.04, 0.12], [0.5, 1.42], [0.42, 1.5]], 0.22, 0.02), woodM),
      mesh(G.extrude([[-0.18, 0.16], [-0.07, 0.16], [0.42, 1.36], [0.38, 1.42]], 0.23), M('#f0d6a0', { rough: 0.4 })),
      rep(5, (i) => C(0.018, 0.018, 0.02, M('#5a3216', { rough: 0.5 }), [-0.08 + i * 0.1, 0.3 + i * 0.24, 0.118], [H, 0, 0], 10)),
      mesh(G.lathe([[0.001, 0.12], [0.08, 0.12], [0.06, 0.22], [0.045, 0.3], [0.04, 1.55], [0.06, 1.62], [0.05, 1.7], [0.001, 1.7]], 16), gold, { p: [-0.36, 0, 0] }),
      mesh(G.lathe([[0.001, 0], [0.06, 0], [0.09, 0.06], [0.08, 0.12], [0.04, 0.16], [0.001, 0.18]], 16), gold, { p: [-0.36, 1.7, 0] }),
      mesh(G.torus(0.05, 0.02, PI * 1.5, 8, 16), gold, { p: [-0.42, 1.86, 0] }),
      mesh(G.tube(neckPts, 0.045, 40), gold),
      ...strings,
    ),
    -0.4,
  )
}

// --- Throne ------------------------------------------------------------------------------
function throne() {
  const gold = M('#f0c040', { metal: 0.9, rough: 0.22 })
  const backShape = [[-0.48, 0], [0.48, 0], [0.48, 1.0], [0.34, 1.22], [0.16, 1.34], [0, 1.58], [-0.16, 1.34], [-0.34, 1.22], [-0.48, 1.0]]
  const inner = [[-0.36, 0.06], [0.36, 0.06], [0.36, 0.95], [0.25, 1.12], [0.12, 1.2], [0, 1.38], [-0.12, 1.2], [-0.25, 1.12], [-0.36, 0.95]]
  const crown = [[-0.16, 0], [0.16, 0], [0.18, 0.14], [0.09, 0.07], [0, 0.17], [-0.09, 0.07], [-0.18, 0.14]]
  const seatY = 0.62
  const finial = (p) => grp(S(0.05, gold, [0, 0, 0]), mesh(G.cone(0.04, 0.14, 10), gold, { p: [0, 0.1, 0] }), S(0.022, gem('#e8203a'), [0, 0.18, 0]), { p })
  const legGeo = G.lathe([[0.001, 0], [0.09, 0], [0.1, 0.04], [0.06, 0.1], [0.07, 0.2], [0.05, 0.3], [0.06, 0.36], [0.001, 0.36]], 14)
  return turn(
    grp(
      B(1.7, 0.12, 1.5, M('#8e96a3', { rough: 0.8 }), [0, 0.06, -0.05], 0.03),
      B(1.4, 0.12, 1.2, M('#a8aeb8', { rough: 0.8 }), [0, 0.18, -0.1], 0.03),
      B(0.6, 0.012, 0.9, VELVET, [0, 0.245, 0.15], 0.004),
      B(0.6, 0.12, 0.012, VELVET, [0, 0.18, 0.505], 0.004),
      both((s) => both((t) => mesh(legGeo, gold, { p: [s * 0.4, 0.24, -0.1 + t * 0.32] }))),
      B(0.96, 0.14, 0.78, gold, [0, seatY, -0.1], 0.04),
      B(0.84, 0.12, 0.68, VELVET, [0, seatY + 0.12, -0.08], 0.06),
      grp(
        mesh(G.extrude(backShape, 0.12, 0.02), gold),
        mesh(G.extrude(inner, 0.02), VELVET, { p: [0, 0, 0.075] }),
        mesh(G.extrude(crown, 0.02, 0.005), gold, { p: [0, 1.0, 0.09] }),
        S(0.05, gem('#2b7bff'), [0, 1.42, 0.08]),
        rep(3, (i) => S(0.025, gem(['#22c96a', '#e8203a', '#22c96a'][i]), [-0.1 + i * 0.1, 1.04, 0.105])),
        finial([0.48, 1.04, 0]),
        finial([-0.48, 1.04, 0]),
        finial([0, 1.62, 0]),
        { p: [0, seatY + 0.06, -0.48], r: [-0.08, 0, 0] },
      ),
      both((s) =>
        grp(
          B(0.12, 0.08, 0.7, gold, [0, seatY + 0.42, -0.08], 0.03),
          B(0.1, 0.06, 0.6, VELVET, [0, seatY + 0.47, -0.1], 0.03),
          S(0.08, gold, [0, seatY + 0.42, 0.3]),
          rod([0, seatY + 0.05, 0.22], [0, seatY + 0.38, 0.27], 0.04, gold, 10, 0.05),
          rod([0, seatY + 0.05, -0.38], [0, seatY + 0.4, -0.38], 0.04, gold, 10),
          { p: [s * 0.48, 0, 0] },
        ),
      ),
    ),
    -0.3,
  )
}

export const models = {
  'Grand Piano': grandPiano,
  Treadmill: treadmill,
  'Drum Kit': drumKit,
  'Pool Table': poolTable,
  'Golden Lamp': goldenLamp,
  Fountain: fountain,
  'Vending Machine': vendingMachine,
  'Knight Armor': knightArmor,
  'Hot Tub': hotTub,
  Harp: harp,
  Throne: throne,
}
