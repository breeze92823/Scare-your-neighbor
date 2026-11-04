// Uncommon Index items: gadgets and hobby gear. Each model stands on y = 0 facing +Z
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

const WHITE = M('#f2f4f7', { rough: 0.45 })
const BLACK = M('#1d1f26', { rough: 0.5 })
const GLOSS_BLACK = M('#202329', { rough: 0.2, metal: 0.3 })
const CHROME = M('#d6dbe2', { metal: 0.9, rough: 0.25 })
const DARK_METAL = M('#4a505c', { metal: 0.7, rough: 0.4 })
const RUBBER = M('#26282e', { rough: 0.85 })
const RED = M('#e2453c', { rough: 0.45 })

// --- Skateboard --------------------------------------------------------------------------
function skateboard() {
  const grip = M('#2a2b31', { rough: 0.95 })
  const art = M('#ff7a2f', { rough: 0.45 })
  const ply = M('#e9c48c', { rough: 0.7 })
  const wheel = M('#7fe0d0', { rough: 0.4 })
  const D = []
  for (let i = 0; i <= 10; i++) {
    const a = -H + (i / 10) * PI
    D.push([0.16 + Math.cos(a) * 0.25, Math.sin(a) * 0.25])
  }
  const dShape = [[0, -0.25], ...D, [0, 0.25]]
  const layer = (mat, t, y) =>
    grp(
      B(1.2, t, 0.5, mat, [0, y, 0], 0.008),
      both((s) => grp(mesh(G.extrude(dShape, t), mat, { r: [-H, 0, 0] }), { p: [s * 0.6, y, 0], r: [0, s > 0 ? 0 : PI, 0.38] })),
    )
  const truck = (x) =>
    grp(
      B(0.16, 0.03, 0.12, DARK_METAL, [0, 0.265, 0], 0.01),
      C(0.05, 0.06, 0.07, M('#f2c23a', { rough: 0.5 }), [0, 0.22, 0], null, 12),
      B(0.1, 0.06, 0.3, CHROME, [0, 0.16, 0], 0.025),
      C(0.018, 0.018, 0.56, CHROME, [0, 0.13, 0], [H, 0, 0], 8),
      both((s) => C(0.085, 0.085, 0.08, wheel, [0, 0.12, s * 0.25], [H, 0, 0], 18)),
      both((s) => C(0.04, 0.04, 0.085, WHITE, [0, 0.12, s * 0.25], [H, 0, 0], 10)),
      { p: [x, 0, 0] },
    )
  const flame = tex('item-skate-art', 256, 128, (x, w, h) => {
    x.fillStyle = '#ffd23f'
    x.beginPath()
    x.moveTo(20, h / 2)
    for (let i = 0; i < 7; i++) {
      x.quadraticCurveTo(40 + i * 30, 10 + (i % 2) * 20, 60 + i * 30, h / 2 - 10)
    }
    x.lineTo(240, h / 2)
    for (let i = 6; i >= 0; i--) x.quadraticCurveTo(40 + i * 30, h - 10 - (i % 2) * 20, 20 + i * 30, h / 2 + 10)
    x.fill()
    x.fillStyle = '#ffffff'
    x.font = font(40)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('SK8', w / 2, h / 2 + 2)
  })
  return turn(
    grp(
      grp(
        layer(ply, 0.02, 0.3),
        layer(art, 0.02, 0.285),
        layer(grip, 0.012, 0.316),
        decal(flame, 1.1, 0.42, { p: [0, 0.274, 0], r: [H, 0, 0] }),
        truck(0.48),
        truck(-0.48),
        { r: [0.32, 0, 0] },
      ),
    ),
    -0.6,
  )
}

// --- Acoustic Guitar ---------------------------------------------------------------------
function guitarOutline(r1, c1, r2, c2, top, k = 5, n = 28) {
  const w = (y) => {
    const a = Math.sqrt(Math.max(0, r1 * r1 - (y - c1) ** 2))
    const b = Math.sqrt(Math.max(0, r2 * r2 - (y - c2) ** 2))
    return (a ** k + b ** k) ** (1 / k)
  }
  const right = []
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * top
    right.push([Math.max(0.02, w(y)), y])
  }
  const left = right.map(([x, y]) => [-x, y]).reverse()
  return [...right, ...left]
}
function acousticGuitar() {
  const sides = M('#7a4320', { rough: 0.35 })
  const top = M('#ffffff', { map: woodTex('item-spruce', '#eab66a', '#c58d45', [2, 2]), rough: 0.3 })
  const neckM = M('#8a5128', { rough: 0.4 })
  const board = M('#2d1d14', { rough: 0.5 })
  const outline = guitarOutline(0.44, 0.44, 0.33, 1.06, 1.38)
  const strings = []
  for (let i = 0; i < 6; i++) {
    const f = (i - 2.5) / 2.5
    strings.push(rod([f * 0.07, 0.36, 0.13], [f * 0.045, 2.14, 0.115], 0.005, M('#e8e2d0', { metal: 0.8, rough: 0.3 }), 4))
  }
  return turn(
    grp(
      grp(
        mesh(G.extrude(outline, 0.22, 0.015), sides),
        mesh(G.extrude(outline, 0.226), top, { p: [0, 0.025, 0], s: [0.96, 0.965, 1] }),
        C(0.135, 0.135, 0.02, M('#140c08', { rough: 0.9 }), [0, 0.86, 0.11], [H, 0, 0], 24),
        mesh(G.torus(0.16, 0.014, PI * 2, 6, 28), M('#3a2416', { rough: 0.4 }), { p: [0, 0.86, 0.115] }),
        B(0.3, 0.06, 0.03, board, [0, 0.36, 0.125], 0.012),
        B(0.18, 0.012, 0.012, WHITE, [0, 0.37, 0.142], 0.004),
        mesh(G.extrude([[0.05, 0.6], [0.24, 0.58], [0.3, 0.72], [0.2, 0.8], [0.1, 0.76]], 0.01), M('#3a1a0c', { rough: 0.25 }), { p: [0, 0, 0.12] }),
        B(0.14, 0.92, 0.07, neckM, [0, 1.66, 0.06], 0.03),
        B(0.125, 0.9, 0.025, board, [0, 1.68, 0.1], 0.008),
        rep(11, (i) => B(0.125, 0.008, 0.01, CHROME, [0, 1.36 + i * 0.075, 0.115], 0.003)),
        rep(3, (i) => S(0.012, WHITE, [0, 1.47 + i * 0.15, 0.115])),
        B(0.125, 0.014, 0.012, WHITE, [0, 2.14, 0.11], 0.004),
        grp(
          mesh(G.extrude([[-0.09, 0], [0.09, 0], [0.11, 0.3], [0.06, 0.34], [-0.06, 0.34], [-0.11, 0.3]], 0.045, 0.01), neckM),
          both((s) => rep(3, (i) => grp(C(0.012, 0.012, 0.12, CHROME, [s * 0.13, 0.07 + i * 0.09, 0], [0, 0, H], 8), B(0.035, 0.05, 0.02, M('#f4ecd8', { rough: 0.3 }), [s * 0.19, 0.07 + i * 0.09, 0], 0.008)))),
          { p: [0, 2.15, 0.07], r: [-0.25, 0, 0] },
        ),
        ...strings,
      ),
      { r: [0, 0, 0.12] },
    ),
    -0.3,
  )
}

// --- Microwave ---------------------------------------------------------------------------
function microwave() {
  const shell = M('#e4e7ec', { rough: 0.35, metal: 0.4 })
  const window = tex('item-microwave-window', 128, 96, (x, w, h) => {
    x.fillStyle = 'rgba(40,50,60,0.55)'
    x.fillRect(0, 0, w, h)
    x.fillStyle = 'rgba(0,0,0,0.6)'
    for (let i = 2; i < w; i += 6) for (let j = 2; j < h; j += 6) x.fillRect(i, j, 3, 3)
    x.fillStyle = 'rgba(255,255,255,0.25)'
    x.beginPath()
    x.moveTo(10, h - 10)
    x.lineTo(40, 10)
    x.lineTo(58, 10)
    x.lineTo(28, h - 10)
    x.fill()
  })
  const disp = tex('item-microwave-display', 128, 48, (x, w, h) => {
    x.fillStyle = '#0d1a12'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#5dff8a'
    x.font = font(34)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('12:00', w / 2, h / 2 + 2)
  })
  const btn = M('#d0d5dd', { rough: 0.4 })
  const inside = M('#f3efe6', { rough: 0.5 })
  const z = 0.39
  const door = grp(
    B(0.96, 0.7, 0.05, shell, [0.48, 0, 0.025], 0.03),
    B(0.72, 0.5, 0.012, GLOSS_BLACK, [0.44, 0, 0.052], 0.01),
    decal(window, 0.68, 0.46, { p: [0.44, 0, 0.06], rough: 0.2 }),
    B(0.05, 0.5, 0.06, CHROME, [0.88, 0, 0.08], 0.022),
    { p: [-0.65, 0.41, z], r: [0, -1.75, 0] },
  )
  return turn(
    grp(
      B(0.32, 0.74, 0.78, shell, [0.49, 0.41, 0], 0.05),
      B(0.98, 0.06, 0.78, shell, [-0.16, 0.75, 0], 0.025),
      B(0.98, 0.06, 0.78, shell, [-0.16, 0.07, 0], 0.025),
      B(0.06, 0.74, 0.78, shell, [-0.62, 0.41, 0], 0.025),
      B(0.98, 0.74, 0.06, shell, [-0.16, 0.41, -0.36], 0.025),
      B(0.86, 0.6, 0.02, inside, [-0.16, 0.41, -0.32], 0.01),
      B(0.02, 0.6, 0.7, inside, [0.32, 0.41, 0], 0.005),
      B(0.02, 0.6, 0.7, inside, [-0.585, 0.41, 0], 0.005),
      B(0.2, 0.02, 0.2, M('#ffffff', { emissive: '#ffe9a8', glow: 1.3 }), [0.1, 0.715, -0.1], 0.005),
      C(0.3, 0.3, 0.02, M('#dfeef5', { rough: 0.1, opacity: 0.7 }), [-0.16, 0.115, 0], null, 24),
      mesh(G.lathe([[0.001, 0], [0.1, 0], [0.17, 0.06], [0.2, 0.15], [0.19, 0.15], [0.001, 0.02]], 20), M('#e2453c', { rough: 0.3 }), { p: [-0.16, 0.125, 0] }),
      rep(9, (i) => mesh(G.ico(0.045, 0), M(i % 3 ? '#fff6dc' : '#ffd86b', { rough: 0.9, flat: true }), { p: [-0.16 + Math.cos(i * 2.4) * 0.1 * (i % 2 ? 1 : 0.5), 0.29 + (i % 3) * 0.03, Math.sin(i * 2.4) * 0.1] })),
      door,
      both((s) => both((t) => B(0.1, 0.04, 0.1, RUBBER, [s * 0.52, 0.02, t * 0.28], 0.015))),
      B(0.28, 0.64, 0.02, M('#2b2f38', { rough: 0.4 }), [0.49, 0.41, z], 0.015),
      decal(disp, 0.22, 0.08, { p: [0.49, 0.65, z + 0.012], emissive: true, glow: 1.2 }),
      rep(9, (i) => B(0.055, 0.04, 0.02, btn, [0.43 + (i % 3) * 0.06, 0.53 - Math.floor(i / 3) * 0.06, z + 0.012], 0.01)),
      B(0.18, 0.06, 0.025, M('#4cc36a', { rough: 0.4, emissive: '#1a6b2c', glow: 0.4 }), [0.49, 0.3, z + 0.012], 0.015),
      C(0.06, 0.06, 0.04, CHROME, [0.49, 0.18, z + 0.02], [H, 0, 0], 16),
      rep(5, (i) => B(0.3, 0.02, 0.01, M('#9aa1ad', { rough: 0.5 }), [0.49, 0.3 + i * 0.05, -0.395], 0.004)),
    ),
    -1.1,
  )
}

// --- Desk Chair --------------------------------------------------------------------------
function deskChair() {
  const fabric = M('#3567c9', { rough: 0.85 })
  const plastic = M('#2b2e36', { rough: 0.45 })
  const caster = (a) =>
    grp(
      B(0.5, 0.06, 0.09, plastic, [0.25, 0.13, 0], 0.03, [0, 0, -0.1]),
      C(0.02, 0.02, 0.06, CHROME, [0.48, 0.1, 0], null, 8),
      C(0.055, 0.055, 0.07, RUBBER, [0.5, 0.055, 0], [H, 0, 0], 14),
      { r: [0, a, 0] },
    )
  return turn(
    grp(
      rep(5, (i) => caster((i / 5) * PI * 2 + 0.3)),
      C(0.08, 0.1, 0.1, plastic, [0, 0.16, 0], null, 16),
      C(0.05, 0.05, 0.25, M('#3a3e48', { rough: 0.4 }), [0, 0.32, 0], null, 12),
      C(0.035, 0.035, 0.18, CHROME, [0, 0.5, 0], null, 12),
      B(0.32, 0.08, 0.3, plastic, [0, 0.6, 0], 0.03),
      B(0.04, 0.03, 0.2, plastic, [-0.18, 0.57, 0.12], 0.012),
      B(0.76, 0.14, 0.72, fabric, [0, 0.7, 0.02], 0.07),
      B(0.7, 0.02, 0.66, M('#2c58ad', { rough: 0.85 }), [0, 0.775, 0.03], 0.01),
      rod([0, 0.62, -0.2], [0, 0.72, -0.42], 0.04, plastic),
      rod([0, 0.72, -0.42], [0, 0.98, -0.46], 0.04, plastic),
      B(0.68, 0.8, 0.12, fabric, [0, 1.26, -0.44], 0.1, [-0.1, 0, 0]),
      B(0.56, 0.62, 0.02, M('#2c58ad', { rough: 0.85 }), [0, 1.27, -0.375], 0.01, [-0.1, 0, 0]),
      B(0.4, 0.14, 0.08, M('#2c58ad', { rough: 0.85 }), [0, 1.04, -0.36], 0.05, [-0.1, 0, 0]),
      both((s) =>
        grp(
          B(0.05, 0.24, 0.06, plastic, [0, 0.86, -0.02], 0.02),
          B(0.2, 0.04, 0.06, plastic, [-s * 0.07, 0.75, -0.02], 0.02),
          B(0.1, 0.05, 0.36, plastic, [0, 0.99, 0.02], 0.025),
          { p: [s * 0.41, 0, 0] },
        ),
      ),
    ),
    -0.35,
  )
}

// --- Boombox -----------------------------------------------------------------------------
function boombox() {
  const body = M('#b7bec9', { rough: 0.35, metal: 0.55 })
  const panel = M('#2a2d34', { rough: 0.5 })
  const cone = M('#16181d', { rough: 0.8 })
  const cassette = tex('item-boombox-cassette', 128, 80, (x, w, h) => {
    x.fillStyle = '#1b1d22'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#f2c23a'
    x.fillRect(10, 10, w - 20, h - 20)
    x.fillStyle = '#ffffff'
    x.fillRect(16, 16, w - 32, 18)
    x.fillStyle = '#1b1d22'
    for (const cx of [42, 86]) {
      x.beginPath()
      x.arc(cx, 52, 10, 0, PI * 2)
      x.fill()
    }
    x.fillRect(42, 46, 44, 12)
  })
  const eq = tex('item-boombox-eq', 128, 48, (x, w, h) => {
    x.fillStyle = '#081018'
    x.fillRect(0, 0, w, h)
    for (let i = 0; i < 12; i++) {
      const n = 2 + ((i * 7) % 6)
      for (let j = 0; j < n; j++) {
        x.fillStyle = j > 5 ? '#ff4d4d' : j > 3 ? '#ffd23f' : '#4dffb0'
        x.fillRect(6 + i * 10, h - 6 - j * 6, 7, 4)
      }
    }
  })
  const speaker = (x) =>
    grp(
      mesh(G.torus(0.25, 0.035, PI * 2, 8, 28), CHROME),
      mesh(G.lathe([[0.001, -0.06], [0.06, -0.06], [0.24, 0.02]], 24), cone, { r: [H, 0, 0] }),
      mesh(G.dome(0.07, H, 16, 6), panel, { r: [H, 0, 0], p: [0, 0, -0.04] }),
      mesh(G.torus(0.13, 0.01, PI * 2, 6, 24), DARK_METAL, { p: [0, 0, -0.01] }),
      { p: [x, 0.42, 0.205] },
    )
  return turn(
    grp(
      B(1.7, 0.82, 0.42, body, [0, 0.45, 0], 0.09),
      B(1.6, 0.7, 0.02, panel, [0, 0.43, 0.205], 0.02),
      speaker(-0.55),
      speaker(0.55),
      B(0.42, 0.28, 0.03, GLOSS_BLACK, [0, 0.33, 0.215], 0.02),
      decal(cassette, 0.36, 0.22, { p: [0, 0.33, 0.232] }),
      decal(eq, 0.36, 0.13, { p: [0, 0.63, 0.218], emissive: true, glow: 1.1 }),
      rep(6, (i) => B(0.09, 0.05, 0.1, i === 2 ? RED : M('#5a606c', { rough: 0.4 }), [-0.28 + i * 0.11, 0.88, 0.08], 0.015)),
      both((s) => C(0.035, 0.035, 0.06, DARK_METAL, [s * 0.15, 0.89, -0.08], null, 10)),
      both((s) => B(0.08, 0.1, 0.1, DARK_METAL, [s * 0.6, 0.88, 0], 0.03)),
      T([[-0.6, 0.92, 0], [-0.56, 1.18, 0], [-0.3, 1.24, 0], [0.3, 1.24, 0], [0.56, 1.18, 0], [0.6, 0.92, 0]], 0.04, panel, 32),
      rod([0.72, 0.86, -0.12], [1.05, 1.62, -0.12], 0.012, CHROME, 6),
      S(0.025, CHROME, [1.05, 1.62, -0.12]),
      both((s) => B(0.16, 0.05, 0.34, RUBBER, [s * 0.65, 0.025, 0], 0.02)),
    ),
    -0.2,
  )
}

// --- Vacuum Cleaner ----------------------------------------------------------------------
function vacuumCleaner() {
  const purple = M('#8b4fd8', { rough: 0.35, metal: 0.1 })
  const grey = M('#9aa1ad', { rough: 0.4 })
  const bin = M('#cfe8ff', { opacity: 0.45, rough: 0.1 })
  const upper = grp(
    B(0.34, 0.66, 0.3, purple, [0, 0.42, -0.04], 0.08),
    C(0.13, 0.13, 0.42, bin, [0, 0.44, 0.13], null, 20),
    C(0.12, 0.12, 0.16, M('#8a8580', { rough: 1 }), [0, 0.31, 0.13], null, 16),
    C(0.14, 0.14, 0.04, grey, [0, 0.67, 0.13], null, 20),
    C(0.14, 0.14, 0.04, grey, [0, 0.22, 0.13], null, 20),
    B(0.08, 0.08, 0.06, M('#ff5a5a', { rough: 0.4 }), [0, 0.7, 0.24], 0.02),
    C(0.035, 0.035, 0.8, grey, [0, 1.12, -0.06], null, 12),
    T([[0, 1.5, -0.06], [0, 1.62, -0.04], [0, 1.66, 0.1], [0, 1.56, 0.14], [0, 1.48, 0.1]], 0.04, purple, 20),
    both((s) => B(0.08, 0.04, 0.05, grey, [s * 0.04, 0.95, -0.22], 0.012)),
    rep(4, (i) => mesh(G.torus(0.05, 0.018, PI * 2, 6, 14), M('#33353c', { rough: 0.6 }), { p: [0, 0.6 + i * 0.03, -0.24], r: [H, 0, 0], s: [1.6, 1, 1] })),
    T([[0.16, 0.15, 0.05], [0.24, 0.4, 0.0], [0.22, 0.8, -0.1], [0.08, 0.98, -0.16]], 0.035, M('#5d6370', { rough: 0.6 }), 24),
    { p: [0, 0.14, -0.06], r: [-0.22, 0, 0] },
  )
  return turn(
    grp(
      B(0.8, 0.16, 0.42, purple, [0, 0.1, 0.12], 0.06),
      B(0.82, 0.06, 0.06, RUBBER, [0, 0.07, 0.34], 0.025),
      B(0.7, 0.03, 0.02, M('#ffffff', { emissive: '#a0e8ff', glow: 0.8 }), [0, 0.15, 0.335], 0.01),
      both((s) => C(0.1, 0.1, 0.06, RUBBER, [s * 0.25, 0.1, -0.14], [0, 0, H], 18)),
      both((s) => C(0.05, 0.05, 0.065, grey, [s * 0.25, 0.1, -0.14], [0, 0, H], 12)),
      C(0.08, 0.08, 0.3, grey, [0, 0.15, -0.06], [0, 0, H], 14),
      upper,
    ),
    -0.35,
  )
}

// --- Laptop ------------------------------------------------------------------------------
function laptop() {
  const alu = M('#c3c8d0', { metal: 0.75, rough: 0.3 })
  const keys = tex('item-laptop-keys', 256, 128, (x, w, h) => {
    x.fillStyle = '#b8bdc6'
    x.fillRect(0, 0, w, h)
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 14; c++) {
        x.fillStyle = '#25272d'
        const kw = r === 4 && c > 3 && c < 9 ? 0 : 14
        if (kw) x.fillRect(8 + c * 17.4, 8 + r * 23, kw, 18)
      }
    x.fillRect(8 + 4 * 17.4, 8 + 4 * 23, 17.4 * 5 - 3, 18)
  })
  const screen = tex('item-laptop-screen', 256, 160, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#3a7bd5')
    g.addColorStop(1, '#9b59d0')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.fillStyle = 'rgba(255,255,255,0.9)'
    x.fillRect(30, 26, 120, 80)
    x.fillStyle = '#3a7bd5'
    x.fillRect(30, 26, 120, 12)
    x.fillStyle = '#ffd23f'
    x.fillRect(40, 48, 40, 30)
    x.fillStyle = '#ccd'
    for (let i = 0; i < 4; i++) x.fillRect(88, 48 + i * 12, 54, 6)
    x.fillStyle = 'rgba(255,255,255,0.85)'
    x.fillRect(170, 60, 60, 70)
    x.fillStyle = '#1d1f26'
    x.fillRect(0, h - 16, w, 16)
    for (let i = 0; i < 6; i++) {
      x.fillStyle = ['#ff6b6b', '#ffd23f', '#4dd08a', '#4da6ff', '#c58cff', '#fff'][i]
      x.fillRect(80 + i * 18, h - 13, 11, 10)
    }
  })
  const logo = tex('item-laptop-logo', 64, 64, (x) => {
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.arc(32, 34, 20, 0, PI * 2)
    x.fill()
    x.fillStyle = 'rgba(0,0,0,0)'
  })
  return turn(
    grp(
      B(1.3, 0.06, 0.88, alu, [0, 0.03, 0], 0.025),
      decal(keys, 1.1, 0.48, { p: [0, 0.061, -0.12], r: [-H, 0, 0] }),
      B(0.42, 0.005, 0.24, M('#aeb4be', { metal: 0.6, rough: 0.35 }), [0, 0.061, 0.27], 0.003),
      both((s) => B(0.1, 0.02, 0.1, RUBBER, [s * 0.55, -0.0, 0.35], 0.008)),
      grp(
        B(1.3, 0.86, 0.04, alu, [0, 0.43, -0.02], 0.025),
        B(1.24, 0.8, 0.01, GLOSS_BLACK, [0, 0.44, 0.002], 0.005),
        decal(screen, 1.16, 0.72, { p: [0, 0.45, 0.008], emissive: true, glow: 0.9 }),
        decal(logo, 0.16, 0.16, { p: [0, 0.45, -0.041], r: [0, PI, 0], emissive: true, glow: 0.5 }),
        { p: [0, 0.06, -0.42], r: [-0.28, 0, 0] },
      ),
    ),
    -0.35,
  )
}

// --- Electric Fan ------------------------------------------------------------------------
function electricFan() {
  const body = M('#f1f3f6', { rough: 0.35 })
  const cage = M('#cfd5dd', { metal: 0.8, rough: 0.3 })
  const blade = M('#7cc8f2', { rough: 0.25, opacity: 0.88 })
  const accent = M('#3fb6c8', { rough: 0.4 })
  const R = 0.46
  const bladeShape = [[0, 0.05], [0.09, 0.12], [0.16, 0.26], [0.17, 0.36], [0.1, 0.42], [0, 0.4], [-0.06, 0.3], [-0.05, 0.12]]
  const head = grp(
    mesh(G.capsule(0.13, 0.18, 14), body, { p: [0, 0, -0.2], r: [H, 0, 0] }),
    C(0.05, 0.05, 0.12, body, [0, 0.14, -0.3], null, 10),
    mesh(G.torus(R, 0.014, PI * 2, 6, 40), cage, { p: [0, 0, 0.1] }),
    mesh(G.torus(R, 0.014, PI * 2, 6, 40), cage, { p: [0, 0, -0.08] }),
    mesh(G.cyl(R + 0.01, R + 0.01, 0.06, 36, true), M('#cfd5dd', { metal: 0.8, rough: 0.3, side: 2 }), { p: [0, 0, 0.01], r: [H, 0, 0] }),
    rep(18, (i) => {
      const a = (i / 18) * PI * 2
      return rod([Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0.15], [Math.cos(a) * R, Math.sin(a) * R, 0.1], 0.006, cage, 4)
    }),
    rep(12, (i) => {
      const a = (i / 12) * PI * 2
      return rod([0, 0, -0.1], [Math.cos(a) * R, Math.sin(a) * R, -0.08], 0.006, cage, 4)
    }),
    mesh(G.torus(0.25, 0.008, PI * 2, 6, 28), cage, { p: [0, 0, 0.13] }),
    C(0.09, 0.09, 0.04, accent, [0, 0, 0.155], [H, 0, 0], 18),
    rep(3, (i) => grp(mesh(G.extrude(bladeShape, 0.012), blade, { r: [0, 0.35, 0] }), { p: [0, 0, 0.03], r: [0, 0, (i / 3) * PI * 2 + 0.3] })),
    C(0.07, 0.07, 0.08, body, [0, 0, 0.01], [H, 0, 0], 16),
    { p: [0, 1.25, 0], r: [-0.08, 0, 0] },
  )
  return turn(
    grp(
      mesh(G.lathe([[0.001, 0], [0.34, 0], [0.36, 0.03], [0.33, 0.07], [0.12, 0.1], [0.001, 0.1]], 24), body),
      rep(3, (i) => B(0.06, 0.03, 0.05, i === 0 ? accent : M('#b9c0ca', { rough: 0.4 }), [-0.08 + i * 0.08, 0.095, 0.2], 0.012)),
      C(0.04, 0.04, 1.0, cage, [0, 0.6, 0], null, 12),
      C(0.06, 0.06, 0.08, body, [0, 0.66, 0], null, 12),
      C(0.05, 0.05, 0.16, body, [0, 1.08, -0.2], null, 12),
      head,
    ),
    -0.35,
  )
}

// --- Mini Fridge -------------------------------------------------------------------------
function miniFridge() {
  const shell = M('#e9e1d0', { rough: 0.35 })
  const inner = M('#f7f9fb', { rough: 0.5 })
  const can = (col, p) => grp(C(0.06, 0.06, 0.16, M(col, { rough: 0.35, metal: 0.4 }), [0, 0.08, 0], null, 14), C(0.05, 0.06, 0.01, CHROME, [0, 0.165, 0], null, 14), { p })
  const W = 0.8
  const Hh = 1.0
  const D = 0.75
  const y0 = 0.06
  const logo = tex('item-minifridge-logo', 128, 48, (x, w, h) => {
    x.fillStyle = '#e2453c'
    x.font = font(30)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('CHILL', w / 2, h / 2 + 2)
  })
  const door = grp(
    B(W, Hh - 0.02, 0.08, shell, [-W / 2, 0, 0.04], 0.04),
    B(W - 0.12, Hh - 0.14, 0.03, M('#dcd4c2', { rough: 0.4 }), [-W / 2, 0, -0.01], 0.02),
    B(0.05, 0.4, 0.06, CHROME, [-W + 0.08, 0.1, 0.11], 0.02),
    decal(logo, 0.3, 0.11, { p: [-W / 2, 0.36, 0.081] }),
    B(W - 0.16, 0.04, 0.12, inner, [-W / 2, -0.12, -0.09], 0.015),
    B(W - 0.16, 0.08, 0.02, inner, [-W / 2, -0.08, -0.15], 0.008),
    can('#e2453c', [-0.25, -0.1, -0.09]),
    can('#3fa34d', [-0.42, -0.1, -0.09]),
    can('#3b82d6', [-0.59, -0.1, -0.09]),
    B(W - 0.16, 0.04, 0.12, inner, [-W / 2, 0.22, -0.09], 0.015),
    C(0.05, 0.05, 0.2, M('#ffffff', { rough: 0.3 }), [-0.3, 0.34, -0.09], null, 12),
    { p: [W / 2, y0 + Hh / 2, D / 2], r: [0, 1.15, 0] },
  )
  return turn(
    grp(
      B(W, 0.06, D, shell, [0, y0 + 0.03, 0], 0.025),
      B(W, 0.06, D, shell, [0, y0 + Hh - 0.03, 0], 0.025),
      both((s) => B(0.06, Hh, D, shell, [s * (W / 2 - 0.03), y0 + Hh / 2, 0], 0.025)),
      B(W, Hh, 0.06, shell, [0, y0 + Hh / 2, -D / 2 + 0.03], 0.025),
      B(W - 0.12, Hh - 0.12, 0.02, inner, [0, y0 + Hh / 2, -D / 2 + 0.07]),
      B(W - 0.12, 0.02, D - 0.1, M('#c9d2dc', { metal: 0.6, rough: 0.3 }), [0, y0 + 0.45, 0.0], 0.005),
      B(W - 0.12, 0.2, D - 0.15, M('#dfe8ef', { rough: 0.3, opacity: 0.8 }), [0, y0 + 0.17, -0.02], 0.03),
      can('#e2453c', [-0.2, y0 + 0.46, 0.05]),
      can('#ffd23f', [-0.05, y0 + 0.46, 0.1]),
      can('#e2453c', [0.15, y0 + 0.46, 0.0]),
      C(0.06, 0.06, 0.3, M('#7ccf5e', { rough: 0.2, opacity: 0.85 }), [0.1, y0 + 0.73, -0.1], null, 14),
      C(0.025, 0.04, 0.08, M('#7ccf5e', { rough: 0.2, opacity: 0.85 }), [0.1, y0 + 0.92, -0.1], null, 10),
      S(0.07, M('#ff9a3a', { rough: 0.6 }), [-0.18, y0 + 0.2, 0.05]),
      S(0.06, M('#e2453c', { rough: 0.4 }), [0.08, y0 + 0.2, 0.08]),
      B(0.3, 0.03, 0.06, M('#ffffff', { emissive: '#fff2c0', glow: 1.2 }), [0, y0 + Hh - 0.08, -0.1], 0.01),
      door,
      both((s) => both((t) => C(0.04, 0.05, 0.06, RUBBER, [s * 0.3, 0.03, t * 0.27], null, 10))),
    ),
    -0.45,
  )
}

// --- Golf Bag ----------------------------------------------------------------------------
function golfBag() {
  const bagM = M('#f1f3f6', { rough: 0.5 })
  const trim = M('#d8334a', { rough: 0.5 })
  const navy = M('#23355c', { rough: 0.6 })
  const shaft = M('#d6dbe2', { metal: 0.9, rough: 0.25 })
  const club = (x, z, h, kind, col) => {
    const top = [x, h, z]
    const parts = [rod([x * 0.5, 0.95, z * 0.5], top, 0.012, shaft, 6)]
    if (kind === 'cover')
      parts.push(
        S(0.11, M(col, { rough: 0.9 }), [x, h + 0.06, z], [1, 1.2, 1]),
        C(0.05, 0.06, 0.14, M(col, { rough: 0.9 }), [x, h - 0.06, z], null, 10),
        S(0.05, WHITE, [x, h + 0.2, z]),
      )
    else if (kind === 'iron') parts.push(B(0.16, 0.06, 0.035, CHROME, [x + 0.05, h, z], 0.012, [0, 0.3, 0.4]))
    else parts.push(B(0.14, 0.04, 0.05, M('#30343c', { metal: 0.8, rough: 0.3 }), [x + 0.05, h, z], 0.015, [0, 0.2, 0]))
    return grp(...parts)
  }
  const bag = grp(
    C(0.23, 0.21, 1.1, bagM, [0, 0.6, 0], null, 22),
    C(0.215, 0.215, 0.06, navy, [0, 0.05, 0], null, 22),
    mesh(G.torus(0.23, 0.035, PI * 2, 8, 24), trim, { p: [0, 1.15, 0], r: [H, 0, 0] }),
    C(0.24, 0.24, 0.08, navy, [0, 0.2, 0], null, 22),
    B(0.26, 0.5, 0.1, trim, [0, 0.62, 0.2], 0.05),
    B(0.2, 0.06, 0.02, navy, [0, 0.8, 0.25], 0.01),
    B(0.2, 0.2, 0.08, navy, [0, 0.42, 0.24], 0.04),
    T([[0.22, 1.0, 0.02], [0.33, 0.8, 0.1], [0.3, 0.45, 0.12], [0.21, 0.35, 0.04]], 0.03, navy, 16),
    C(0.12, 0.12, 0.02, navy, [0, 1.14, 0], null, 16),
    club(-0.08, -0.06, 1.42, 'cover', '#d8334a'),
    club(0.08, -0.08, 1.38, 'cover', '#23355c'),
    club(0.0, 0.1, 1.48, 'cover', '#ffd23f'),
    club(-0.12, 0.08, 1.3, 'iron'),
    club(0.12, 0.08, 1.27, 'iron'),
    club(0.04, -0.12, 1.34, 'putter'),
    club(-0.03, 0.01, 1.25, 'iron'),
    { r: [-0.28, 0, 0] },
  )
  return turn(
    grp(
      bag,
      both((s) => rod([s * 0.12, 0.85, -0.3], [s * 0.32, 0.0, -0.62], 0.018, DARK_METAL, 6)),
      both((s) => S(0.03, RUBBER, [s * 0.32, 0.02, -0.62])),
      B(0.3, 0.06, 0.2, navy, [0, 0.03, 0.03], 0.03),
    ),
    -0.2,
  )
}

// --- Fish Tank ---------------------------------------------------------------------------
function fishTank() {
  const wood = M('#ffffff', { map: woodTex('item-tank-wood', '#7a4a2a', '#4e2c16', [2, 1]), rough: 0.5 })
  const glass = M('#d8f0ff', { opacity: 0.22, rough: 0.05, metal: 0.1 })
  const water = M('#3fa8e0', { opacity: 0.32, rough: 0.1 })
  const frame = M('#22252c', { rough: 0.4 })
  const plant = M('#3fae5a', { rough: 0.6 })
  const plant2 = M('#7dd65a', { rough: 0.6 })
  const W = 1.2
  const D = 0.5
  const y = 0.66
  const Ht = 0.74
  const fish = (col, p, dir = 1, s = 1) =>
    grp(
      S(0.08, M(col, { rough: 0.3 }), [0, 0, 0], [1.4, 1, 0.6]),
      mesh(G.cone(0.06, 0.1, 10), M(col, { rough: 0.3 }), { p: [-0.13, 0, 0], r: [0, 0, -H], s: [1, 1, 0.4] }),
      S(0.018, BLACK, [0.07, 0.02, 0.04]),
      S(0.018, BLACK, [0.07, 0.02, -0.04]),
      { p, s: [dir * s, s, s] },
    )
  const weed = (x, z, h, mat) => T([[x, y + 0.08, z], [x + 0.04, y + 0.08 + h * 0.35, z], [x - 0.03, y + 0.08 + h * 0.7, z], [x + 0.02, y + 0.08 + h, z]], 0.022, mat, 12)
  return turn(
    grp(
      B(1.3, 0.62, 0.6, wood, [0, 0.31, 0], 0.03),
      both((s) => B(0.58, 0.48, 0.02, wood, [s * 0.31, 0.32, 0.3], 0.015)),
      both((s) => S(0.025, CHROME, [s * 0.06, 0.4, 0.32])),
      B(1.34, 0.04, 0.64, wood, [0, 0.635, 0], 0.015),
      B(W, Ht, D, glass, [0, y + Ht / 2, 0], 0.02),
      B(W - 0.04, Ht - 0.14, D - 0.04, water, [0, y + (Ht - 0.14) / 2 + 0.02, 0], 0.01),
      B(W + 0.03, 0.05, D + 0.03, frame, [0, y + 0.025, 0], 0.015),
      B(W + 0.05, 0.08, D + 0.05, frame, [0, y + Ht + 0.02, 0], 0.025),
      B(W - 0.3, 0.02, 0.06, M('#ffffff', { emissive: '#dff6ff', glow: 1.2 }), [0, y + Ht - 0.03, 0], 0.008),
      B(W - 0.05, 0.07, D - 0.05, M('#d8b878', { rough: 0.95 }), [0, y + 0.085, 0], 0.02),
      mesh(G.ico(0.09, 0), M('#8e96a3', { rough: 0.8, flat: true }), { p: [0.4, y + 0.15, -0.08] }),
      mesh(G.ico(0.06, 0), M('#6f7784', { rough: 0.8, flat: true }), { p: [0.3, y + 0.13, 0.08] }),
      grp(
        B(0.16, 0.16, 0.14, M('#c9b48a', { rough: 0.8 }), [0, 0.08, 0], 0.01),
        both((s) => C(0.04, 0.04, 0.26, M('#c9b48a', { rough: 0.8 }), [s * 0.09, 0.13, 0], null, 10)),
        both((s) => mesh(G.cone(0.05, 0.08, 10), RED, { p: [s * 0.09, 0.3, 0] })),
        B(0.06, 0.08, 0.02, BLACK, [0, 0.04, 0.07], 0.02),
        { p: [-0.35, y + 0.11, -0.08] },
      ),
      weed(-0.5, -0.15, 0.5, plant),
      weed(-0.46, 0.05, 0.38, plant2),
      weed(0.5, -0.12, 0.55, plant),
      weed(0.14, -0.16, 0.42, plant2),
      weed(0.2, -0.12, 0.3, plant),
      fish('#ff8a1e', [-0.05, y + 0.45, 0.05], 1, 1),
      fish('#ffd23f', [0.3, y + 0.32, 0.1], -1, 0.8),
      fish('#4da6ff', [-0.2, y + 0.24, -0.05], -1, 0.7),
      rep(5, (i) => S(0.02 + (i % 2) * 0.01, M('#ffffff', { opacity: 0.55, rough: 0.1 }), [0.42 + (i % 2) * 0.03, y + 0.2 + i * 0.09, 0.08])),
    ),
    -0.35,
  )
}

export const models = {
  Skateboard: skateboard,
  'Acoustic Guitar': acousticGuitar,
  Microwave: microwave,
  'Desk Chair': deskChair,
  Boombox: boombox,
  'Vacuum Cleaner': vacuumCleaner,
  Laptop: laptop,
  'Electric Fan': electricFan,
  'Mini Fridge': miniFridge,
  'Golf Bag': golfBag,
  'Fish Tank': fishTank,
}
