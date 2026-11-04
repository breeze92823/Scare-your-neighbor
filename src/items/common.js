// Common Index items: small everyday things. Each model stands on y = 0 facing +Z
// (profile-shaped ones are built along X and turned so their outline reads in the
// card's 3/4 view: camera azimuth -0.55, screen right = azimuth +1.02).
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

// Shared colours
const WHITE = M('#f2f4f7', { rough: 0.45 })
const BLACK = M('#1d1f26', { rough: 0.5 })
const CHROME = M('#d6dbe2', { metal: 0.9, rough: 0.25 })
const DARK_METAL = M('#4a505c', { metal: 0.7, rough: 0.4 })
const RED = M('#e2453c', { rough: 0.45 })
const YELLOW = M('#ffd23f', { rough: 0.4 })
const ORANGE = M('#ff8a1e', { rough: 0.45 })
const EYE_HI = M('#ffffff', { rough: 0.2 })

// --- Yo Yo -------------------------------------------------------------------------------
function yoyo() {
  const shell = M('#e8383d', { rough: 0.3 })
  const half = G.lathe([[0.001, 0.03], [0.42, 0.03], [0.48, 0.09], [0.475, 0.17], [0.4, 0.235], [0.001, 0.235]], 24)
  const star = tex('item-yoyo-star', 128, 128, (x, w, h) => {
    x.fillStyle = '#ffd23f'
    x.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -H + (i * PI) / 5
      const r = i % 2 ? 24 : 56
      x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r)
    }
    x.fill()
    x.strokeStyle = '#a8321f'
    x.lineWidth = 5
    x.stroke()
  })
  const c = 0.5
  return turn(
    grp(
      mesh(half, shell, { p: [0, c, 0], r: [H, 0, 0] }),
      mesh(half, shell, { p: [0, c, 0], r: [-H, 0, 0] }),
      mesh(G.torus(0.33, 0.028, PI * 2, 8, 28), WHITE, { p: [0, c, 0.235] }),
      mesh(G.torus(0.33, 0.028, PI * 2, 8, 28), WHITE, { p: [0, c, -0.235] }),
      C(0.15, 0.15, 0.03, M('#ffffff', { rough: 0.25 }), [0, c, 0.245], [H, 0, 0]),
      C(0.15, 0.15, 0.03, M('#ffffff', { rough: 0.25 }), [0, c, -0.245], [H, 0, 0]),
      decal(star, 0.26, 0.26, { p: [0, c, 0.262] }),
      C(0.07, 0.07, 0.08, DARK_METAL, [0, c, 0], [H, 0, 0]),
      mesh(G.torus(0.075, 0.012, PI * 2, 6, 16), WHITE, { p: [0, c, 0] }),
      T([[0, c + 0.075, 0], [0.04, c + 0.35, 0], [-0.03, c + 0.7, 0], [0, 1.15, 0]], 0.02, WHITE, 24),
      mesh(G.torus(0.08, 0.022, PI * 2, 6, 18), WHITE, { p: [0, 1.23, 0] }),
    ),
    0.3,
  )
}

// --- Rubber Duck -------------------------------------------------------------------------
function rubberDuck() {
  const duck = M('#ffd23f', { rough: 0.3 })
  return turn(
    grp(
      S(0.5, duck, [0, 0.36, 0], [0.85, 0.66, 1.1]),
      S(0.2, duck, [0, 0.55, -0.48], [0.8, 0.9, 1]),
      mesh(G.cone(0.12, 0.3, 14), duck, { p: [0, 0.7, -0.6], r: [-0.9, 0, 0] }),
      both((s) => S(0.3, M('#f5c21b', { rough: 0.35 }), [s * 0.37, 0.44, -0.08], [0.32, 0.55, 1])),
      S(0.31, duck, [0, 0.98, 0.26]),
      S(0.16, ORANGE, [0, 0.93, 0.58], [1.15, 0.38, 1.25]),
      S(0.12, M('#e8701a', { rough: 0.45 }), [0, 0.88, 0.54], [1, 0.3, 1.1]),
      both((s) => S(0.06, BLACK, [s * 0.15, 1.06, 0.5])),
      both((s) => S(0.022, EYE_HI, [s * 0.165, 1.085, 0.555])),
      both((s) => S(0.06, M('#ff9a8a', { rough: 0.5 }), [s * 0.22, 0.95, 0.47], [1, 0.6, 0.4])),
      T([[0, 1.25, 0.24], [0.02, 1.36, 0.22], [0.08, 1.38, 0.14], [0.06, 1.32, 0.1]], 0.03, duck, 12),
    ),
    0.55,
  )
}

// --- Teddy Bear --------------------------------------------------------------------------
function teddyBear() {
  const fur = M('#b87a44', { rough: 0.85 })
  const light = M('#e8c391', { rough: 0.85 })
  const dark = M('#3a2418', { rough: 0.4 })
  const bow = M('#d8334a', { rough: 0.5 })
  return turn(
    grp(
      S(0.42, fur, [0, 0.5, 0], [1, 1.1, 0.9]),
      S(0.3, light, [0, 0.48, 0.25], [1, 1.1, 0.45]),
      S(0.36, fur, [0, 1.12, 0.03]),
      S(0.16, light, [0, 1.04, 0.3], [1.2, 0.85, 0.9]),
      S(0.06, dark, [0, 1.1, 0.44], [1.3, 0.9, 0.8]),
      T([[0, 1.04, 0.44], [0, 0.98, 0.445]], 0.012, dark, 4),
      both((s) => T([[0, 0.98, 0.445], [s * 0.04, 0.97, 0.44], [s * 0.07, 0.99, 0.425]], 0.012, dark, 6)),
      both((s) => S(0.045, dark, [s * 0.13, 1.22, 0.3])),
      both((s) => S(0.016, EYE_HI, [s * 0.14, 1.235, 0.34])),
      both((s) => S(0.13, fur, [s * 0.26, 1.42, 0], [1, 1, 0.6])),
      both((s) => S(0.075, light, [s * 0.26, 1.42, 0.05], [1, 1, 0.4])),
      both((s) => mesh(G.capsule(0.12, 0.3), fur, { p: [s * 0.42, 0.62, 0.1], r: [-0.5, 0, s * 0.55] })),
      both((s) => mesh(G.capsule(0.14, 0.26), fur, { p: [s * 0.22, 0.2, 0.25], r: [H, 0, 0] })),
      both((s) => C(0.12, 0.12, 0.04, light, [s * 0.22, 0.2, 0.53], [H, 0, 0])),
      both((s) => mesh(G.cone(0.09, 0.2, 12), bow, { p: [s * 0.1, 0.86, 0.32], r: [0, 0, s * H] })),
      S(0.05, bow, [0, 0.86, 0.33]),
    ),
    -0.25,
  )
}

// --- Soda Can ----------------------------------------------------------------------------
function sodaCan() {
  const alu = M('#c9ced6', { metal: 0.9, rough: 0.3 })
  const label = tex('item-soda-label', 512, 256, (x, w, h) => {
    x.fillStyle = '#d62a2a'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.moveTo(0, h * 0.62)
    for (let i = 0; i <= 32; i++) x.lineTo((i / 32) * w, h * 0.62 + Math.sin((i / 32) * PI * 4) * 16)
    x.lineTo(w, h * 0.72)
    for (let i = 32; i >= 0; i--) x.lineTo((i / 32) * w, h * 0.72 + Math.sin((i / 32) * PI * 4) * 16)
    x.fill()
    x.fillStyle = '#ffd23f'
    for (let i = 0; i < 26; i++) {
      x.beginPath()
      x.arc((i * 97) % w, 20 + ((i * 53) % 90), 3 + (i % 4), 0, PI * 2)
      x.fill()
    }
    x.font = font(88)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.lineWidth = 10
    x.strokeStyle = '#7a1010'
    x.strokeText('FIZZ', w / 2, h * 0.38)
    x.fillStyle = '#ffffff'
    x.fillText('FIZZ', w / 2, h * 0.38)
  })
  return grp(
    mesh(G.lathe([[0.001, 0], [0.24, 0], [0.29, 0.05], [0.32, 0.12], [0.32, 0.9], [0.27, 0.99], [0.25, 1.02], [0.001, 1.0]], 28), alu),
    mesh(G.cyl(0.322, 0.322, 0.74, 28, true), M('#ffffff', { map: label, rough: 0.35, metal: 0.3 }), { p: [0, 0.51, 0], r: [0, PI - 0.55, 0] }),
    mesh(G.torus(0.25, 0.018, PI * 2, 8, 28), alu, { p: [0, 1.02, 0], r: [H, 0, 0] }),
    C(0.035, 0.035, 0.03, DARK_METAL, [0, 1.01, 0]),
    B(0.11, 0.015, 0.2, alu, [0, 1.035, 0.06], 0.006),
    B(0.08, 0.005, 0.06, BLACK, [0, 1.0, -0.12], 0.002),
    T([[0.08, 1.0, -0.05], [0.12, 1.45, -0.05], [0.14, 1.55, -0.05], [0.28, 1.6, -0.05]], 0.03, M('#3fb6c8', { rough: 0.4 }), 16),
  )
}

// --- Alarm Clock -------------------------------------------------------------------------
function alarmClock() {
  const body = M('#e14b3b', { rough: 0.35, metal: 0.2 })
  const face = tex('item-clock-face', 256, 256, (x, w, h) => {
    const c = w / 2
    x.fillStyle = '#fff8e8'
    x.beginPath()
    x.arc(c, c, 124, 0, PI * 2)
    x.fill()
    x.strokeStyle = '#2a2a33'
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * PI * 2
      const r0 = i % 5 ? 112 : 102
      x.lineWidth = i % 5 ? 2 : 5
      x.beginPath()
      x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0)
      x.lineTo(c + Math.cos(a) * 120, c + Math.sin(a) * 120)
      x.stroke()
    }
    x.fillStyle = '#2a2a33'
    x.font = font(34)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    for (const [n, a] of [[12, -H], [3, 0], [6, H], [9, PI]]) x.fillText(n, c + Math.cos(a) * 80, c + Math.sin(a) * 80)
    x.lineCap = 'round'
    x.lineWidth = 9
    x.beginPath()
    x.moveTo(c, c)
    x.lineTo(c + 40, c - 30)
    x.stroke()
    x.lineWidth = 6
    x.beginPath()
    x.moveTo(c, c)
    x.lineTo(c - 18, c - 78)
    x.stroke()
    x.strokeStyle = '#e14b3b'
    x.lineWidth = 3
    x.beginPath()
    x.moveTo(c - 20, c + 30)
    x.lineTo(c + 50, c - 75)
    x.stroke()
    x.fillStyle = '#e14b3b'
    x.beginPath()
    x.arc(c, c, 8, 0, PI * 2)
    x.fill()
  })
  const y = 0.62
  return turn(
    grp(
      C(0.45, 0.45, 0.3, body, [0, y, 0], [H, 0, 0], 28),
      mesh(G.torus(0.42, 0.05, PI * 2, 10, 32), CHROME, { p: [0, y, 0.15] }),
      decal(face, 0.8, 0.8, { p: [0, y, 0.152], rough: 0.4 }),
      mesh(G.dome(0.4, 1.2, 24, 8), M('#ffffff', { opacity: 0.18, rough: 0.05 }), { p: [0, y, 0.0], r: [H, 0, 0], s: [1, 0.45, 1] }),
      both((s) =>
        grp(
          mesh(G.dome(0.21, H, 20, 8), CHROME, { r: [0, 0, 0] }),
          C(0.21, 0.21, 0.03, CHROME, [0, 0.0, 0]),
          C(0.03, 0.03, 0.08, CHROME, [0, 0.24, 0]),
          S(0.04, CHROME, [0, 0.29, 0]),
          { p: [s * 0.3, y + 0.4, 0], r: [0, 0, -s * 0.55] },
        ),
      ),
      rod([0, y + 0.42, 0], [0, y + 0.62, 0], 0.025, CHROME),
      S(0.06, CHROME, [0, y + 0.64, 0]),
      mesh(G.torus(0.14, 0.025, PI, 8, 16), CHROME, { p: [0, y + 0.47, -0.1] }),
      both((s) => rod([s * 0.22, y - 0.35, 0], [s * 0.34, 0.06, 0], 0.035, CHROME)),
      both((s) => S(0.07, CHROME, [s * 0.35, 0.06, 0])),
      C(0.05, 0.05, 0.12, CHROME, [0, y + 0.1, -0.2], [H, 0, 0]),
      B(0.2, 0.05, 0.04, CHROME, [0, y + 0.1, -0.27], 0.015),
    ),
    -0.3,
  )
}

// --- Toy Car -----------------------------------------------------------------------------
function toyCar() {
  const paint = M('#2f7de1', { rough: 0.3, metal: 0.2 })
  const glass = M('#9fd8ff', { rough: 0.1, metal: 0.1, emissive: '#2a5a80', glow: 0.25 })
  const tire = M('#25272e', { rough: 0.8 })
  const num = tex('item-toycar-num', 128, 128, (x, w, h) => {
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.arc(w / 2, h / 2, 60, 0, PI * 2)
    x.fill()
    x.fillStyle = '#e2453c'
    x.font = font(86)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('7', w / 2, h / 2 + 4)
  })
  const wheel = (x, z) =>
    grp(
      C(0.22, 0.22, 0.18, tire, [0, 0, 0], [H, 0, 0], 20),
      C(0.12, 0.12, 0.19, CHROME, [0, 0, 0], [H, 0, 0], 16),
      C(0.05, 0.05, 0.2, RED, [0, 0, 0], [H, 0, 0], 10),
      { p: [x, 0.22, z] },
    )
  return turn(
    grp(
      B(1.7, 0.4, 0.82, paint, [0, 0.42, 0], 0.12),
      B(0.95, 0.36, 0.74, glass, [-0.12, 0.76, 0], 0.1),
      B(0.98, 0.09, 0.78, paint, [-0.14, 0.95, 0], 0.04),
      B(0.06, 0.34, 0.8, paint, [-0.12, 0.77, 0], 0.02),
      B(1.72, 0.06, 0.12, WHITE, [0, 0.62, 0], 0.02),
      B(1.0, 0.03, 0.12, WHITE, [-0.14, 1.0, 0], 0.015),
      wheel(0.55, 0.38),
      wheel(0.55, -0.38),
      wheel(-0.55, 0.38),
      wheel(-0.55, -0.38),
      B(0.12, 0.14, 0.9, CHROME, [0.86, 0.3, 0], 0.05),
      B(0.12, 0.14, 0.9, CHROME, [-0.86, 0.3, 0], 0.05),
      both((s) => S(0.07, M('#fff6b0', { emissive: '#ffe680', glow: 0.8 }), [0.84, 0.48, s * 0.27], [0.6, 1, 1])),
      both((s) => B(0.04, 0.08, 0.14, M('#ff4040', { emissive: '#ff2020', glow: 0.6 }), [-0.85, 0.5, s * 0.28], 0.015)),
      both((s) => rod([-0.72, 0.6, s * 0.28], [-0.78, 0.82, s * 0.28], 0.025, paint)),
      B(0.22, 0.04, 0.84, paint, [-0.8, 0.84, 0], 0.02),
      decal(num, 0.32, 0.32, { p: [0.12, 0.44, 0.415] }),
      decal(num, 0.32, 0.32, { p: [0.12, 0.44, -0.415], r: [0, PI, 0] }),
      // wind-up key
      rod([-0.5, 0.62, 0], [-0.5, 1.12, 0], 0.03, CHROME),
      both((s) => mesh(G.torus(0.11, 0.035, PI * 2, 8, 18), YELLOW, { p: [-0.5, 1.2, s * 0.11], r: [H, 0, 0] })),
      S(0.05, YELLOW, [-0.5, 1.17, 0]),
    ),
    -0.95,
  )
}

// --- Basketball --------------------------------------------------------------------------
function basketball() {
  const pebble = tex(
    'item-bball',
    128,
    128,
    (x, w, h) => {
      x.fillStyle = '#e8762c'
      x.fillRect(0, 0, w, h)
      for (let i = 0; i < 600; i++) {
        x.fillStyle = i % 2 ? '#d8661e' : '#f2883a'
        x.fillRect((i * 37) % w, (i * 71 + (i >> 3)) % h, 2, 2)
      }
    },
    { repeat: [4, 2] },
  )
  const leather = M('#ffffff', { map: pebble, rough: 0.7 })
  const seam = M('#2a1a12', { rough: 0.6 })
  const r = 0.5
  const ball = grp(
    mesh(G.sphere(r, 32, 22), leather),
    mesh(G.torus(r, 0.014, PI * 2, 6, 48), seam, { r: [H, 0, 0] }),
    mesh(G.torus(r, 0.014, PI * 2, 6, 48), seam),
    both((s) => mesh(G.torus(0.37, 0.014, PI * 2, 6, 40), seam, { p: [s * 0.335, 0, 0], r: [0, H, 0] })),
    { p: [0, 0.58, 0], r: [0.35, 0.5, 0.25] },
  )
  return grp(
    ball,
    mesh(G.lathe([[0.32, 0], [0.34, 0.02], [0.34, 0.06], [0.26, 0.12], [0.24, 0.12], [0.24, 0.06], [0.001, 0.06]], 24), M('#3a3f4b', { metal: 0.6, rough: 0.35 })),
    mesh(G.torus(0.25, 0.02, PI * 2, 6, 24), YELLOW, { p: [0, 0.12, 0], r: [H, 0, 0] }),
  )
}

// --- Coffee Mug --------------------------------------------------------------------------
function coffeeMug() {
  const ceramic = M('#f2f5f8', { rough: 0.22 })
  const heart = tex('item-mug-heart', 128, 128, (x, w) => {
    x.fillStyle = '#e2453c'
    x.beginPath()
    x.moveTo(64, 108)
    x.bezierCurveTo(10, 70, 6, 30, 36, 22)
    x.bezierCurveTo(52, 18, 62, 30, 64, 40)
    x.bezierCurveTo(66, 30, 76, 18, 92, 22)
    x.bezierCurveTo(122, 30, 118, 70, 64, 108)
    x.fill()
  })
  const steam = M('#ffffff', { opacity: 0.55, rough: 1 })
  const a = -0.45
  return grp(
    mesh(G.lathe([[0.001, 0], [0.34, 0], [0.39, 0.03], [0.41, 0.12], [0.42, 0.9], [0.43, 0.95], [0.4, 0.97], [0.38, 0.92], [0.37, 0.14], [0.001, 0.13]], 28), ceramic),
    C(0.375, 0.375, 0.02, M('#5a3420', { rough: 0.2 }), [0, 0.82, 0], null, 24),
    mesh(G.torus(0.25, 0.065, PI, 10, 18), ceramic, { p: [-0.4, 0.5, 0], r: [0, 0, H] }),
    mesh(G.torus(0.42, 0.012, PI * 2, 6, 32), M('#e2453c', { rough: 0.3 }), { p: [0, 0.14, 0], r: [H, 0, 0] }),
    decal(heart, 0.32, 0.32, { p: [Math.sin(a) * 0.43, 0.5, Math.cos(a) * 0.43], r: [0, a, 0] }),
    T([[-0.1, 0.86, 0], [-0.16, 1.05, 0.02], [-0.05, 1.2, 0], [-0.14, 1.38, 0]], 0.035, steam, 20),
    T([[0.1, 0.86, -0.05], [0.16, 1.02, -0.05], [0.06, 1.16, -0.05], [0.14, 1.3, -0.05]], 0.03, steam, 20),
  )
}

// --- Desk Lamp ---------------------------------------------------------------------------
function deskLamp() {
  const shadeM = M('#2fb59a', { rough: 0.35, metal: 0.3 })
  const arm = M('#e9edf2', { rough: 0.35, metal: 0.5 })
  const bulb = M('#fff6c8', { emissive: '#ffe27a', glow: 1.4 })
  const elbow = [0.32, 0.95, 0]
  const head = [1.0, 1.18, 0]
  return turn(
    grp(
      mesh(G.lathe([[0.001, 0], [0.38, 0], [0.4, 0.03], [0.38, 0.07], [0.2, 0.12], [0.08, 0.14], [0.001, 0.14]], 24), shadeM),
      S(0.07, arm, [0, 0.16, 0]),
      both((s) => rod([0, 0.16, s * 0.04], elbow.map((v, i) => (i === 2 ? s * 0.04 : v)), 0.025, arm)),
      rep(7, (i) => mesh(G.torus(0.03, 0.008, PI * 2, 6, 10), DARK_METAL, { p: [0.05 + i * 0.035, 0.27 + i * 0.075, 0.08], r: [H, 0, 0] })),
      C(0.07, 0.07, 0.14, shadeM, elbow, [H, 0, 0], 16),
      both((s) => rod([elbow[0], elbow[1], s * 0.04], [head[0], head[1], s * 0.04], 0.022, arm)),
      C(0.06, 0.06, 0.12, shadeM, head, [H, 0, 0], 16),
      grp(
        mesh(G.lathe([[0.3, -0.36], [0.29, -0.33], [0.15, -0.16], [0.09, -0.06], [0.05, 0]], 24), shadeM),
        mesh(G.lathe([[0.285, -0.355], [0.14, -0.17], [0.085, -0.07]], 24), M('#f6f3e6', { side: 2, rough: 0.5 })),
        mesh(G.torus(0.3, 0.02, PI * 2, 6, 28), arm, { p: [0, -0.36, 0], r: [H, 0, 0] }),
        S(0.11, bulb, [0, -0.25, 0]),
        { p: [head[0] + 0.04, head[1], 0], r: [0, 0, 0.75] },
      ),
      C(0.04, 0.04, 0.05, DARK_METAL, [0.22, 0.13, 0.22], [H, 0, 0], 12),
    ),
    -0.3,
  )
}

// --- Sneaker -----------------------------------------------------------------------------
function sneaker() {
  const upper = M('#e2453c', { rough: 0.55 })
  const sole = M('#f4f4f2', { rough: 0.6 })
  const gum = M('#c8a57a', { rough: 0.7 })
  const navy = M('#26365f', { rough: 0.55 })
  const W = 0.42
  const sh = (pts, d, mat, p = [0, 0, 0], bevel = 0) => mesh(G.extrude(pts, d, bevel), mat, { p })
  const lacePts = [[0.33, 0.38], [0.22, 0.43], [0.11, 0.48], [0.0, 0.53]]
  return turn(
    grp(
      sh([[-0.56, 0], [0.5, 0], [0.62, 0.03], [0.66, 0.09], [0.6, 0.13], [-0.56, 0.13], [-0.63, 0.08], [-0.62, 0.02]], W + 0.02, sole),
      sh([[-0.57, 0], [0.52, 0], [0.62, 0.03], [0.6, 0.035], [-0.6, 0.035]], W + 0.03, gum, [0, -0.005, 0]),
      sh([[-0.56, 0.12], [0.56, 0.12], [0.6, 0.19], [0.5, 0.29], [0.3, 0.37], [0.02, 0.5], [-0.08, 0.62], [-0.46, 0.64], [-0.6, 0.56], [-0.62, 0.3]], W - 0.06, upper, [0, 0, 0], 0.03),
      sh([[0.25, 0.12], [0.58, 0.12], [0.62, 0.19], [0.52, 0.3], [0.35, 0.36], [0.25, 0.2]], W - 0.02, sole, [0, 0.005, 0], 0.02),
      sh([[-0.64, 0.12], [-0.4, 0.12], [-0.4, 0.62], [-0.48, 0.66], [-0.62, 0.58], [-0.65, 0.3]], W - 0.02, navy, [0, 0, 0], 0.02),
      B(0.24, 0.07, 0.3, BLACK, [-0.25, 0.65, 0], 0.03),
      B(0.1, 0.32, 0.26, upper, [-0.05, 0.62, 0], 0.04, [0, 0, 0.6]),
      ...lacePts.map(([x, y]) => B(0.05, 0.03, W - 0.02, WHITE, [x, y + 0.03, 0], 0.012, [0, 0, 0.42])),
      both((s) => T([[-0.38, 0.22, s * 0.215], [-0.05, 0.2, s * 0.22], [0.2, 0.26, s * 0.205], [0.32, 0.34, s * 0.19]], 0.025, WHITE, 16)),
      B(0.05, 0.18, 0.1, YELLOW, [-0.64, 0.6, 0], 0.02),
    ),
    -0.7,
  )
}

// --- Toaster -----------------------------------------------------------------------------
function toaster() {
  const body = M('#e25b4f', { rough: 0.3, metal: 0.3 })
  const crust = M('#a8682e', { rough: 0.8 })
  const crumb = M('#ecc78b', { rough: 0.9 })
  const bread = [[-0.26, 0], [0.26, 0], [0.26, 0.3], [0.3, 0.36], [0.27, 0.43], [0.14, 0.47], [0, 0.44], [-0.14, 0.47], [-0.27, 0.43], [-0.3, 0.36], [-0.26, 0.3]]
  const toast = (z) =>
    grp(
      mesh(G.extrude(bread, 0.06), crust),
      mesh(G.extrude(bread, 0.066), crumb, { p: [0, 0.03, 0], s: [0.86, 0.86, 1] }),
      { p: [0, 0.58, z] },
    )
  return turn(
    grp(
      B(1.0, 0.62, 0.56, body, [0, 0.4, 0], 0.16),
      B(1.02, 0.08, 0.58, CHROME, [0, 0.26, 0], 0.035),
      B(1.04, 0.07, 0.6, BLACK, [0, 0.07, 0], 0.03),
      both((s) => B(0.12, 0.05, 0.12, BLACK, [s * 0.38, 0.02, 0.18], 0.02)),
      both((s) => B(0.12, 0.05, 0.12, BLACK, [s * 0.38, 0.02, -0.18], 0.02)),
      B(0.66, 0.02, 0.1, BLACK, [0, 0.705, 0.12], 0.01),
      B(0.66, 0.02, 0.1, BLACK, [0, 0.705, -0.12], 0.01),
      toast(0.12),
      toast(-0.12),
      B(0.03, 0.4, 0.06, BLACK, [-0.505, 0.45, 0.0], 0.012),
      B(0.12, 0.06, 0.12, CHROME, [-0.56, 0.5, 0.0], 0.025),
      C(0.06, 0.06, 0.05, CHROME, [-0.52, 0.32, 0.16], [0, 0, H], 16),
      B(0.04, 0.02, 0.02, BLACK, [-0.55, 0.34, 0.16], 0.005),
      decal(
        tex('item-toaster-badge', 128, 48, (x, w, h) => {
          x.fillStyle = '#ffffff'
          x.font = font(34)
          x.textAlign = 'center'
          x.textBaseline = 'middle'
          x.fillText('TOASTY', w / 2, h / 2 + 2)
        }),
        0.36,
        0.13,
        { p: [0, 0.48, 0.283] },
      ),
    ),
    -0.2,
  )
}

export const models = {
  'Yo Yo': yoyo,
  'Rubber Duck': rubberDuck,
  'Teddy Bear': teddyBear,
  'Soda Can': sodaCan,
  'Alarm Clock': alarmClock,
  'Toy Car': toyCar,
  Basketball: basketball,
  'Coffee Mug': coffeeMug,
  'Desk Lamp': deskLamp,
  Sneaker: sneaker,
  Toaster: toaster,
}
