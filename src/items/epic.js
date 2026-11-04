// Epic Index items: big furniture and machines. Each model stands on y = 0 facing +Z
// (card camera azimuth -0.55; screen right = azimuth +1.02).
import { Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const H = PI / 2
const UP = new Vector3(0, 1, 0)

const B = (w, h, d, mat, p, rad = 0.03, r) => mesh(G.rbox(w, h, d, rad), mat, { p, r })
const C = (rt, rb, h, mat, p, r, seg = 20) => mesh(G.cyl(rt, rb, h, seg), mat, { p, r })
const S = (rad, mat, p, s) => mesh(G.sphere(rad, 20, 14), mat, { p, s })
const T = (pts, r, mat, seg = 32, closed = false) => mesh(G.tube(pts, r, seg, closed), mat)
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
function label(key, w, h, text, fg, bg, px, stroke) {
  return tex(key, w, h, (x) => {
    if (bg) {
      x.fillStyle = bg
      x.fillRect(0, 0, w, h)
    }
    x.font = font(px)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    if (stroke) {
      x.lineWidth = px / 6
      x.strokeStyle = stroke
      x.strokeText(text, w / 2, h / 2 + 2)
    }
    x.fillStyle = fg
    x.fillText(text, w / 2, h / 2 + 2)
  })
}
// A decal facing +X (for parts built in a profile frame).
const decalX = (t, w, h, p, o = {}) => decal(t, w, h, { ...o, p, r: [0, H, 0] })

const WHITE = M('#f2f4f7', { rough: 0.45 })
const BLACK = M('#1d1f26', { rough: 0.5 })
const GLOSS_BLACK = M('#202329', { rough: 0.2, metal: 0.3 })
const CHROME = M('#d6dbe2', { metal: 0.9, rough: 0.25 })
const DARK_METAL = M('#4a505c', { metal: 0.7, rough: 0.4 })
const GOLD = M('#e0b040', { metal: 0.85, rough: 0.3 })
const RUBBER = M('#26282e', { rough: 0.85 })
const RED = M('#e2453c', { rough: 0.45 })
const glowM = (c, g = 1.4) => M(c, { emissive: c, glow: g, rough: 0.4 })

function starBase(plastic, n = 5, r = 0.5) {
  return grp(
    rep(n, (i) =>
      grp(
        B(r, 0.06, 0.09, plastic, [r / 2, 0.13, 0], 0.03, [0, 0, -0.1]),
        C(0.02, 0.02, 0.06, CHROME, [r - 0.02, 0.1, 0], null, 8),
        C(0.055, 0.055, 0.07, RUBBER, [r, 0.055, 0], [H, 0, 0], 14),
        { r: [0, (i / n) * PI * 2 + 0.3, 0] },
      ),
    ),
    C(0.08, 0.1, 0.1, plastic, [0, 0.16, 0], null, 16),
    C(0.05, 0.05, 0.25, M('#3a3e48', { rough: 0.4 }), [0, 0.32, 0], null, 12),
    C(0.035, 0.035, 0.18, CHROME, [0, 0.5, 0], null, 12),
  )
}

// --- Arcade Machine ----------------------------------------------------------------------
function arcadeMachine() {
  const cab = M('#24262e', { rough: 0.45 })
  const side = M('#5b3fd1', { rough: 0.35 })
  const screen = tex('item-arcade-screen', 160, 200, (x, w, h) => {
    x.fillStyle = '#05051a'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#ffffff'
    for (let i = 0; i < 30; i++) x.fillRect((i * 53) % w, (i * 37) % h, 2, 2)
    const inv = ['#3dff6a', '#ff3df0', '#3dd5ff']
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) {
        x.fillStyle = inv[r]
        const px = 18 + c * 26
        const py = 30 + r * 24
        x.fillRect(px, py, 16, 8)
        x.fillRect(px + 3, py - 4, 3, 4)
        x.fillRect(px + 10, py - 4, 3, 4)
        x.fillRect(px - 2, py + 8, 4, 4)
        x.fillRect(px + 14, py + 8, 4, 4)
      }
    x.fillStyle = '#ffd23f'
    x.fillRect(w / 2 - 10, h - 30, 20, 10)
    x.fillRect(w / 2 - 3, h - 36, 6, 6)
    x.fillRect(w / 2 - 1, h - 70, 2, 14)
    x.fillStyle = '#ffffff'
    x.font = font(14)
    x.fillText('1UP 004200', 8, 16)
  })
  const marquee = tex('item-arcade-marquee', 256, 96, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#ff3df0')
    g.addColorStop(1, '#3dd5ff')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.font = font(56)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.lineWidth = 8
    x.strokeStyle = '#2a0a50'
    x.strokeText('ARCADE', w / 2, h / 2 + 3)
    x.fillStyle = '#ffd23f'
    x.fillText('ARCADE', w / 2, h / 2 + 3)
  })
  const art = tex('item-arcade-side', 128, 256, (x, w, h) => {
    x.fillStyle = '#ffd23f'
    x.beginPath()
    x.moveTo(70, 10)
    x.lineTo(30, 120)
    x.lineTo(62, 120)
    x.lineTo(40, 240)
    x.lineTo(100, 100)
    x.lineTo(68, 100)
    x.lineTo(92, 10)
    x.fill()
    x.strokeStyle = '#ff3df0'
    x.lineWidth = 6
    for (let i = 0; i < 3; i++) {
      x.beginPath()
      x.moveTo(0, 150 + i * 30)
      x.lineTo(w, 110 + i * 30)
      x.stroke()
    }
  })
  const profile = [[-0.4, 0], [0.32, 0], [0.32, 0.85], [0.5, 0.92], [0.5, 1.0], [0.26, 1.08], [0.18, 1.62], [0.38, 1.66], [0.38, 1.95], [-0.4, 1.95]]
  const Z = 0.33
  const inner = 0.61
  const btn = (col, p) => grp(C(0.03, 0.03, 0.03, glowM(col, 0.8), [0, 0, 0], null, 12), C(0.04, 0.04, 0.01, BLACK, [0, -0.015, 0], null, 12), { p })
  const body = grp(
    both((s) => mesh(G.extrude(profile, 0.05, 0.012), side, { p: [0, 0, s * Z] })),
    decal(art, 0.36, 0.72, { p: [-0.05, 0.62, Z + 0.04], rough: 0.4 }),
    B(0.7, 0.84, inner, cab, [-0.05, 0.43, 0], 0.01),
    B(0.5, 0.95, inner, cab, [-0.15, 1.4, 0], 0.01),
    B(0.76, 0.3, inner, cab, [-0.02, 1.8, 0], 0.01),
    B(0.04, 0.12, inner, M('#16171c', { rough: 0.6 }), [0.32, 0.06, 0], 0.01),
    grp(
      B(0.34, 0.08, inner, cab, [0, 0, 0], 0.02),
      grp(rod([0, 0, 0], [0, 0.12, 0], 0.012, CHROME, 6), S(0.035, RED, [0, 0.13, 0]), C(0.04, 0.04, 0.01, BLACK, [0, 0.0, 0], null, 12), { p: [0, 0.04, 0.16] }),
      btn('#ff3df0', [0.03, 0.045, -0.02]),
      btn('#3dd5ff', [-0.04, 0.045, -0.08]),
      btn('#ffd23f', [0.03, 0.045, -0.14]),
      btn('#3dff6a', [-0.04, 0.045, -0.2]),
      { p: [0.36, 1.0, 0], r: [0, 0, -0.26] },
    ),
    grp(
      B(0.04, 0.6, 0.5, GLOSS_BLACK, [0, 0, 0], 0.02),
      decalX(screen, 0.4, 0.5, [0.025, 0, 0], { emissive: true, glow: 1.1 }),
      { p: [0.21, 1.35, 0], r: [0, 0, 0.148] },
    ),
    B(0.03, 0.26, inner, GLOSS_BLACK, [0.37, 1.8, 0], 0.01),
    decalX(marquee, inner - 0.04, 0.22, [0.39, 1.8, 0], { emissive: true, glow: 1.2 }),
    B(0.2, 0.03, inner, M('#16171c', { rough: 0.7 }), [0.28, 1.645, 0], 0.01),
    B(0.02, 0.34, 0.3, M('#3a3c44', { metal: 0.6, rough: 0.35 }), [0.33, 0.5, 0], 0.01),
    both((s) => B(0.02, 0.05, 0.03, glowM('#ff4040', 1.6), [0.345, 0.58, s * 0.07], 0.008)),
    B(0.02, 0.03, 0.12, M('#16171c', { rough: 0.6 }), [0.345, 0.45, 0], 0.008),
    { r: [0, -H, 0] },
  )
  return turn(grp(body), 0.45)
}

// --- Bicycle -----------------------------------------------------------------------------
function bicycle() {
  const frame = M('#e2453c', { rough: 0.25, metal: 0.4 })
  const tire = M('#25272e', { rough: 0.8 })
  const spokeM = M('#c9ced6', { metal: 0.8, rough: 0.3 })
  const R = 0.36
  const wheel = (x) =>
    grp(
      mesh(G.torus(R, 0.035, PI * 2, 8, 40), tire),
      mesh(G.torus(R - 0.035, 0.014, PI * 2, 6, 40), CHROME),
      rep(16, (i) => {
        const a = (i / 16) * PI * 2
        const z = i % 2 ? 0.025 : -0.025
        return rod([0, 0, z], [Math.cos(a) * (R - 0.04), Math.sin(a) * (R - 0.04), 0], 0.004, spokeM, 4)
      }),
      C(0.03, 0.03, 0.08, CHROME, [0, 0, 0], [H, 0, 0], 12),
      { p: [x, R + 0.035, 0] },
    )
  const y0 = R + 0.035
  const Ra = [-0.58, y0, 0]
  const Fa = [0.58, y0, 0]
  const BB = [-0.04, 0.33, 0]
  const ST = [-0.2, 0.88, 0]
  const HT = [0.38, 0.9, 0]
  const HB = [0.43, 0.72, 0]
  const zz = (p, z) => [p[0], p[1], z]
  return turn(
    grp(
      wheel(Ra[0]),
      wheel(Fa[0]),
      rod(BB, ST, 0.028, frame),
      rod(ST, HT, 0.026, frame),
      rod(BB, HB, 0.032, frame),
      rod(HB, HT, 0.038, frame),
      both((s) => rod(zz(BB, s * 0.03), zz(Ra, s * 0.05), 0.016, frame, 8)),
      both((s) => rod(zz(ST, s * 0.02), zz(Ra, s * 0.05), 0.016, frame, 8)),
      both((s) => T([zz(HB, s * 0.03), [0.5, 0.55, s * 0.045], [0.57, y0 + 0.05, s * 0.05], zz(Fa, s * 0.05)], 0.016, frame, 12)),
      rod(HT, [0.36, 1.0, 0], 0.02, CHROME, 8),
      rod([0.36, 1.0, 0], [0.43, 1.0, 0], 0.02, CHROME, 8),
      T([[0.4, 1.0, -0.28], [0.44, 1.01, -0.18], [0.44, 1.0, 0], [0.44, 1.01, 0.18], [0.4, 1.0, 0.28]], 0.016, CHROME, 20),
      both((s) => C(0.022, 0.022, 0.1, BLACK, [0.39, 1.0, s * 0.27], [H, 0, 0], 10)),
      C(0.025, 0.025, 0.02, GOLD, [0.44, 1.04, 0.1], null, 12),
      rod(ST, [-0.23, 0.98, 0], 0.018, CHROME, 8),
      mesh(G.extrude([[-0.13, 0], [0.04, 0.0], [0.12, 0.02], [0.13, 0.04], [0.04, 0.05], [-0.13, 0.06], [-0.15, 0.03]], 0.12, 0.015), BLACK, { p: [-0.22, 0.98, 0] }),
      mesh(G.torus(0.1, 0.015, PI * 2, 6, 24), CHROME, { p: [BB[0], BB[1], 0.07] }),
      C(0.09, 0.09, 0.01, CHROME, [BB[0], BB[1], 0.07], [H, 0, 0], 16),
      C(0.04, 0.04, 0.16, DARK_METAL, [BB[0], BB[1], 0], [H, 0, 0], 12),
      mesh(G.torus(0.045, 0.01, PI * 2, 6, 16), CHROME, { p: [Ra[0], Ra[1], 0.07] }),
      rod([BB[0], BB[1] + 0.1, 0.07], [Ra[0], Ra[1] + 0.045, 0.07], 0.007, DARK_METAL, 4),
      rod([BB[0], BB[1] - 0.1, 0.07], [Ra[0], Ra[1] - 0.045, 0.07], 0.007, DARK_METAL, 4),
      rod([BB[0], BB[1], 0.09], [BB[0] + 0.1, BB[1] - 0.12, 0.09], 0.014, CHROME, 6),
      rod([BB[0], BB[1], -0.09], [BB[0] - 0.1, BB[1] + 0.12, -0.09], 0.014, CHROME, 6),
      B(0.1, 0.025, 0.07, BLACK, [BB[0] + 0.1, BB[1] - 0.12, 0.14], 0.008),
      B(0.1, 0.025, 0.07, BLACK, [BB[0] - 0.1, BB[1] + 0.12, -0.14], 0.008),
      T([[-0.68, y0 + 0.12, 0], [-0.58, y0 + 0.43, 0], [-0.4, y0 + 0.42, 0], [-0.3, y0 + 0.3, 0]], 0.025, M('#f2f4f7', { rough: 0.3, metal: 0.3 }), 16),
      T([[0.38, y0 + 0.34, 0], [0.58, y0 + 0.44, 0], [0.75, y0 + 0.3, 0], [0.8, y0 + 0.12, 0]], 0.025, M('#f2f4f7', { rough: 0.3, metal: 0.3 }), 16),
      rod([-0.12, 0.3, -0.04], [-0.2, 0.02, -0.16], 0.012, DARK_METAL, 6),
      C(0.04, 0.03, 0.06, M('#fff6b0', { emissive: '#ffe680', glow: 0.8 }), [0.48, 0.92, 0], [0, 0, H], 12),
    ),
    -0.72,
  )
}

// --- Big TV ------------------------------------------------------------------------------
function bigTV() {
  const pic = tex('item-tv-picture', 320, 180, (x, w, h) => {
    const sky = x.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#3a9bff')
    sky.addColorStop(1, '#bfe6ff')
    x.fillStyle = sky
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#ffd23f'
    x.beginPath()
    x.arc(w * 0.8, h * 0.25, 22, 0, PI * 2)
    x.fill()
    x.fillStyle = '#ffffff'
    for (const [cx, cy] of [[60, 40], [150, 28]]) {
      x.beginPath()
      x.arc(cx, cy, 14, 0, PI * 2)
      x.arc(cx + 16, cy - 6, 16, 0, PI * 2)
      x.arc(cx + 34, cy, 13, 0, PI * 2)
      x.fill()
    }
    x.fillStyle = '#4caf50'
    x.beginPath()
    x.moveTo(0, h)
    x.quadraticCurveTo(w * 0.25, h * 0.45, w * 0.55, h * 0.75)
    x.quadraticCurveTo(w * 0.8, h * 0.5, w, h * 0.7)
    x.lineTo(w, h)
    x.fill()
    x.fillStyle = '#2e8b3e'
    x.beginPath()
    x.moveTo(0, h)
    x.quadraticCurveTo(w * 0.5, h * 0.65, w, h * 0.9)
    x.lineTo(w, h)
    x.fill()
    x.fillStyle = '#e2453c'
    x.beginPath()
    x.moveTo(200, 108)
    x.lineTo(222, 88)
    x.lineTo(244, 108)
    x.fill()
    x.fillStyle = '#fff3d6'
    x.fillRect(204, 108, 36, 26)
    x.fillStyle = '#7a4a2a'
    x.fillRect(217, 118, 10, 16)
    x.fillStyle = 'rgba(255,255,255,0.15)'
    x.beginPath()
    x.moveTo(0, 0)
    x.lineTo(w * 0.35, 0)
    x.lineTo(0, h * 0.6)
    x.fill()
  })
  const bezel = M('#17181d', { rough: 0.3, metal: 0.4 })
  return turn(
    grp(
      B(2.1, 1.22, 0.07, bezel, [0, 0.85, 0], 0.03),
      decal(pic, 2.02, 1.13, { p: [0, 0.86, 0.037], emissive: true, glow: 0.95 }),
      B(1.4, 0.8, 0.12, bezel, [0, 0.85, -0.08], 0.06),
      decal(label('item-tv-logo', 128, 32, 'VIEWMAX', '#c9ced6', null, 22), 0.2, 0.05, { p: [0, 0.265, 0.037] }),
      C(0.01, 0.01, 0.01, glowM('#ff3030', 2), [0.9, 0.26, 0.036], [H, 0, 0], 8),
      B(0.16, 0.22, 0.06, CHROME, [0, 0.16, -0.06], 0.02),
      B(0.8, 0.04, 0.4, CHROME, [0, 0.02, -0.03], 0.02),
      B(1.1, 0.1, 0.12, M('#2a2c33', { rough: 0.6 }), [0, 0.09, 0.26], 0.04),
      B(1.04, 0.07, 0.01, M('#3a3c44', { rough: 0.9 }), [0, 0.09, 0.321], 0.005),
    ),
    -0.28,
  )
}

// --- Armchair ----------------------------------------------------------------------------
function armchair() {
  const fabric = M('#2e8b78', { rough: 0.85 })
  const fabric2 = M('#38a08b', { rough: 0.85 })
  const leg = M('#5a3420', { rough: 0.4 })
  const legGeo = G.lathe([[0.001, 0], [0.035, 0], [0.05, 0.05], [0.04, 0.1], [0.055, 0.14], [0.05, 0.18], [0.001, 0.18]], 14)
  return turn(
    grp(
      both((s) => both((t) => mesh(legGeo, leg, { p: [s * 0.42, 0, t * 0.36] }))),
      B(1.06, 0.3, 0.9, fabric, [0, 0.33, 0], 0.08),
      B(0.68, 0.17, 0.72, fabric2, [0, 0.56, 0.06], 0.08),
      B(1.06, 0.78, 0.24, fabric, [0, 0.82, -0.35], 0.12),
      B(0.68, 0.48, 0.18, fabric2, [0, 0.86, -0.2], 0.09, [-0.12, 0, 0]),
      rep(6, (i) => S(0.02, M('#1f6355', { rough: 0.6 }), [-0.2 + (i % 3) * 0.2, 0.8 + Math.floor(i / 3) * 0.18, -0.108 - Math.floor(i / 3) * 0.022])),
      both((s) =>
        grp(
          B(0.2, 0.36, 0.9, fabric, [0, 0.6, 0.02], 0.07),
          C(0.13, 0.13, 0.92, fabric2, [s * 0.03, 0.8, 0.02], [H, 0, 0], 20),
          C(0.135, 0.135, 0.02, M('#1f6355', { rough: 0.6 }), [s * 0.03, 0.8, 0.48], [H, 0, 0], 20),
          { p: [s * 0.44, 0, 0] },
        ),
      ),
      B(0.34, 0.3, 0.12, M('#f2b8c6', { rough: 0.8 }), [0.2, 0.75, -0.1], 0.08, [-0.3, -0.4, 0.2]),
    ),
    -0.25,
  )
}

// --- Gaming Chair ------------------------------------------------------------------------
function gamingChair() {
  const blk = M('#1f2128', { rough: 0.55 })
  const red = M('#e0302f', { rough: 0.5 })
  const plastic = M('#2b2e36', { rough: 0.45 })
  const back = [[-0.3, 0], [0.3, 0], [0.35, 0.3], [0.29, 0.52], [0.34, 0.74], [0.22, 0.84], [0.19, 0.96], [0.15, 1.06], [-0.15, 1.06], [-0.19, 0.96], [-0.22, 0.84], [-0.34, 0.74], [-0.29, 0.52], [-0.35, 0.3]]
  const panel = [[-0.14, 0.04], [0.14, 0.04], [0.16, 0.3], [0.14, 0.6], [0.12, 0.8], [0.09, 0.95], [-0.09, 0.95], [-0.12, 0.8], [-0.14, 0.6], [-0.16, 0.3]]
  const backrest = grp(
    mesh(G.extrude(back, 0.14, 0.03), blk),
    mesh(G.extrude(panel, 0.02, 0.01), red, { p: [0, 0, 0.085] }),
    both((s) => C(0.035, 0.035, 0.2, M('#0b0c10', { rough: 0.9 }), [s * 0.12, 0.88, 0], [H, 0, 0], 12)),
    B(0.3, 0.16, 0.1, red, [0, 0.82, 0.12], 0.06),
    B(0.32, 0.16, 0.1, blk, [0, 0.22, 0.12], 0.06),
    decal(label('item-gchair-logo', 128, 48, 'GG', '#ffffff', null, 40, '#e0302f'), 0.12, 0.05, { p: [0, 0.22, 0.172] }),
    { p: [0, 0.74, -0.3], r: [-0.12, 0, 0] },
  )
  return turn(
    grp(
      starBase(plastic, 5, 0.52),
      B(0.3, 0.08, 0.3, plastic, [0, 0.6, 0], 0.03),
      B(0.6, 0.12, 0.6, blk, [0, 0.69, 0.02], 0.06),
      B(0.32, 0.03, 0.5, red, [0, 0.755, 0.04], 0.012),
      both((s) => B(0.12, 0.14, 0.6, red, [s * 0.26, 0.76, 0.02], 0.06)),
      backrest,
      both((s) =>
        grp(
          B(0.05, 0.24, 0.06, plastic, [0, 0.8, -0.02], 0.02),
          B(0.1, 0.05, 0.32, blk, [0, 0.93, 0.02], 0.025),
          { p: [s * 0.37, 0, 0] },
        ),
      ),
      rod([0, 0.62, -0.12], [0, 0.78, -0.3], 0.04, plastic),
    ),
    -0.35,
  )
}

// --- Wardrobe ----------------------------------------------------------------------------
function wardrobe() {
  const wood = M('#ffffff', { map: woodTex('item-wardrobe-wood', '#a0643a', '#6e3e1e', [1, 2]), rough: 0.45 })
  const woodDark = M('#6e3e1e', { rough: 0.45 })
  const inside = M('#c99566', { rough: 0.6 })
  const W = 1.2
  const Ht = 2.0
  const D = 0.6
  const shirt = [[-0.17, 0], [0.17, 0], [0.17, 0.38], [0.27, 0.3], [0.32, 0.36], [0.2, 0.5], [0.06, 0.52], [0, 0.47], [-0.06, 0.52], [-0.2, 0.5], [-0.32, 0.36], [-0.27, 0.3], [-0.17, 0.38]]
  const hang = (x, col, len = 0) =>
    grp(
      mesh(G.extrude(shirt, 0.03), M(col, { rough: 0.8 }), { p: [0, -0.1 - 0.52 * (1 + len), 0], s: [0.85, 1 + len, 1] }),
      T([[0, -0.02, 0], [0, -0.1, 0]], 0.01, CHROME, 4),
      mesh(G.extrude([[-0.24, -0.02], [0.24, -0.02], [0, 0.04]], 0.015), CHROME, { p: [0, -0.12, 0] }),
      { p: [x, Ht - 0.12, 0], r: [0, H, 0] },
    )
  const door = (s, ang) =>
    grp(
      B(W / 2 - 0.01, Ht - 0.42, 0.04, wood, [-s * W / 4, 0, 0.02], 0.015),
      both((f) => B(W / 2 - 0.15, Ht - 0.6, 0.02, woodDark, [-s * W / 4, 0.02, f * 0.045], 0.01)),
      both((f) => B(W / 2 - 0.19, Ht - 0.66, 0.02, wood, [-s * W / 4, 0.02, f * 0.05], 0.01)),
      C(0.022, 0.022, 0.06, GOLD, [-s * (W / 2 - 0.07), 0, 0.06], [H, 0, 0], 10),
      { p: [s * W / 2, Ht / 2 + 0.17, D / 2], r: [0, s * ang, 0] },
    )
  return turn(
    grp(
      both((s) => B(0.05, Ht, D, wood, [s * (W / 2 - 0.025), Ht / 2, 0], 0.015)),
      B(W, 0.04, D, wood, [0, Ht - 0.02, 0], 0.01),
      B(W, Ht, 0.03, inside, [0, Ht / 2, -D / 2 + 0.015], 0.01),
      B(W - 0.1, 0.03, D - 0.04, inside, [0, 0.4, 0], 0.01),
      B(0.03, Ht - 0.45, D - 0.04, inside, [0, 1.2, 0], 0.01),
      B(W + 0.1, 0.1, D + 0.08, woodDark, [0, Ht + 0.05, 0.0], 0.03),
      B(W + 0.16, 0.05, D + 0.12, woodDark, [0, Ht + 0.12, 0.0], 0.02),
      mesh(G.extrude([[-0.3, 0], [0.3, 0], [0.22, 0.1], [0.08, 0.16], [-0.08, 0.16], [-0.22, 0.1]], 0.05), woodDark, { p: [0, Ht + 0.14, D / 2 + 0.02] }),
      B(W, 0.36, 0.05, wood, [0, 0.22, D / 2 - 0.02], 0.02),
      both((s) => B(0.18, 0.04, 0.04, GOLD, [s * 0.28, 0.24, D / 2 + 0.02], 0.015)),
      both((s) => both((t) => S(0.06, woodDark, [s * (W / 2 - 0.08), 0.02, t * (D / 2 - 0.08)]))),
      rod([0.02, Ht - 0.12, 0], [W / 2 - 0.05, Ht - 0.12, 0], 0.015, CHROME, 8),
      hang(0.1, '#3b82d6'),
      hang(0.2, '#e2453c', 0.15),
      hang(0.3, '#ffd23f'),
      hang(0.4, '#4caf50', 0.3),
      hang(0.5, '#f2f4f7'),
      grp(B(0.12, 0.06, 0.24, M('#e2453c', { rough: 0.6 }), [0, 0.03, 0.03], 0.03), B(0.11, 0.08, 0.1, M('#e2453c', { rough: 0.6 }), [0, 0.07, -0.06], 0.03), { p: [0.18, 0.42, 0.05] }),
      grp(B(0.12, 0.06, 0.24, M('#3a2416', { rough: 0.4 }), [0, 0.03, 0.03], 0.03), B(0.11, 0.08, 0.1, M('#3a2416', { rough: 0.4 }), [0, 0.07, -0.06], 0.03), { p: [0.38, 0.42, 0.05] }),
      door(-1, 0),
      door(1, 2.45),
    ),
    -0.45,
  )
}

// --- Fridge ------------------------------------------------------------------------------
function fridge() {
  const steel = M('#c9ced6', { metal: 0.75, rough: 0.28 })
  const drawing = tex('item-fridge-drawing', 128, 160, (x, w, h) => {
    x.fillStyle = '#ffffff'
    x.fillRect(0, 0, w, h)
    x.lineCap = 'round'
    x.lineWidth = 6
    x.strokeStyle = '#ffb020'
    x.fillStyle = '#ffd23f'
    x.beginPath()
    x.arc(96, 32, 16, 0, PI * 2)
    x.fill()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2
      x.beginPath()
      x.moveTo(96 + Math.cos(a) * 22, 32 + Math.sin(a) * 22)
      x.lineTo(96 + Math.cos(a) * 30, 32 + Math.sin(a) * 30)
      x.stroke()
    }
    x.strokeStyle = '#2b5fd9'
    x.beginPath()
    x.arc(48, 70, 12, 0, PI * 2)
    x.moveTo(48, 82)
    x.lineTo(48, 120)
    x.moveTo(26, 96)
    x.lineTo(70, 96)
    x.moveTo(48, 120)
    x.lineTo(32, 146)
    x.moveTo(48, 120)
    x.lineTo(64, 146)
    x.stroke()
    x.strokeStyle = '#3fae5a'
    x.beginPath()
    x.moveTo(0, 152)
    x.lineTo(w, 152)
    x.stroke()
  })
  const disp = tex('item-fridge-disp', 64, 96, (x, w, h) => {
    x.fillStyle = '#0c1820'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#5ad7ff'
    x.font = font(22)
    x.textAlign = 'center'
    x.fillText('-18°', w / 2, 30)
    x.fillRect(12, 50, 40, 6)
    x.fillRect(12, 64, 28, 6)
  })
  const W = 1.0
  const D = 0.78
  const zf = D / 2
  const magnet = (col, p) => C(0.03, 0.03, 0.02, M(col, { rough: 0.3 }), p, [H, 0, 0], 12)
  return turn(
    grp(
      B(W, 1.92, D, steel, [0, 1.02, 0], 0.04),
      B(W - 0.04, 0.08, 0.05, BLACK, [0, 0.04, zf - 0.04], 0.015),
      B(W / 2 - 0.01, 1.16, 0.07, steel, [-W / 4, 1.38, zf + 0.02], 0.03),
      B(W / 2 - 0.01, 1.16, 0.07, steel, [W / 4, 1.38, zf + 0.02], 0.03),
      grp(
        B(W, 0.66, 0.07, steel, [0, 0.42, zf + 0.02], 0.03),
        B(W - 0.1, 0.03, 0.42, M('#dfe6ee', { rough: 0.4 }), [0, 0.2, zf - 0.2], 0.01),
        both((s) => B(0.03, 0.4, 0.42, M('#dfe6ee', { rough: 0.4, opacity: 0.85 }), [s * (W / 2 - 0.06), 0.4, zf - 0.2], 0.01)),
        B(0.26, 0.22, 0.2, M('#ffffff', { rough: 0.4 }), [-0.25, 0.33, zf - 0.15], 0.04),
        B(0.24, 0.06, 0.18, M('#e2453c', { rough: 0.4 }), [-0.25, 0.47, zf - 0.15], 0.02),
        B(0.22, 0.28, 0.06, M('#4caf50', { rough: 0.7 }), [0.05, 0.36, zf - 0.25], 0.03, [0.3, 0, 0]),
        rep(5, (i) => B(0.07, 0.07, 0.07, M('#dff6ff', { rough: 0.1, opacity: 0.8 }), [0.22 + (i % 2) * 0.08, 0.26 + Math.floor(i / 2) * 0.07, zf - 0.12 - (i % 3) * 0.06], 0.015)),
        rod([-0.35, 0.66, zf + 0.12], [0.35, 0.66, zf + 0.12], 0.02, CHROME, 10),
        both((s) => B(0.03, 0.03, 0.08, CHROME, [s * 0.3, 0.66, zf + 0.08], 0.01)),
        { p: [0, 0, 0.36] },
      ),
      B(W - 0.04, 0.68, 0.02, M('#2a2d34', { rough: 0.6 }), [0, 0.42, zf + 0.0], 0.01),
      both((s) =>
        grp(
          C(0.02, 0.02, 0.9, CHROME, [0, 1.38, zf + 0.12], null, 10),
          B(0.03, 0.03, 0.08, CHROME, [0, 1.8, zf + 0.08], 0.01),
          B(0.03, 0.03, 0.08, CHROME, [0, 0.96, zf + 0.08], 0.01),
          { p: [s * 0.06, 0, 0] },
        ),
      ),
      B(0.26, 0.42, 0.02, GLOSS_BLACK, [-0.25, 1.3, zf + 0.06], 0.03),
      B(0.18, 0.18, 0.04, M('#2a2d34', { rough: 0.5 }), [-0.25, 1.22, zf + 0.05], 0.02),
      B(0.05, 0.1, 0.03, CHROME, [-0.25, 1.28, zf + 0.07], 0.01),
      decal(disp, 0.1, 0.14, { p: [-0.25, 1.44, zf + 0.072], emissive: true, glow: 1.1 }),
      decal(drawing, 0.26, 0.32, { p: [0.27, 1.45, zf + 0.058], r: [0, 0, -0.06] }),
      magnet('#e2453c', [0.2, 1.6, zf + 0.065]),
      magnet('#3fae5a', [0.36, 1.27, zf + 0.065]),
      magnet('#ffd23f', [0.3, 1.1, zf + 0.065]),
      magnet('#3b82d6', [0.15, 1.15, zf + 0.065]),
      decal(label('item-fridge-logo', 128, 32, 'FROSTY', '#3a3f4b', null, 22), 0.2, 0.05, { p: [0, 1.9, zf + 0.002] }),
    ),
    -0.3,
  )
}

// --- Dining Table ------------------------------------------------------------------------
function diningTable() {
  const wood = M('#ffffff', { map: woodTex('item-table-wood', '#b5733f', '#7a4520', [2, 1]), rough: 0.4 })
  const woodDark = M('#7a4520', { rough: 0.45 })
  const legGeo = G.lathe([[0.001, 0], [0.05, 0], [0.06, 0.08], [0.04, 0.2], [0.065, 0.38], [0.04, 0.56], [0.055, 0.62], [0.055, 0.7], [0.001, 0.7]], 14)
  const plateM = M('#ffffff', { rough: 0.2 })
  const glassM = M('#cfe8ff', { opacity: 0.4, rough: 0.05 })
  const chair = (p, ry) =>
    grp(
      B(0.46, 0.06, 0.44, wood, [0, 0.46, 0], 0.02),
      both((s) => both((t) => rod([s * 0.19, 0, t * 0.18], [s * 0.19, 0.44, t * 0.18], 0.025, woodDark, 8))),
      both((s) => rod([s * 0.19, 0.46, -0.19], [s * 0.2, 1.08, -0.23], 0.028, woodDark, 8)),
      B(0.46, 0.09, 0.05, wood, [0, 1.04, -0.225], 0.02),
      rep(3, (i) => rod([-0.1 + i * 0.1, 0.5, -0.2], [-0.1 + i * 0.1, 1.0, -0.22], 0.016, woodDark, 6)),
      B(0.38, 0.05, 0.36, M('#d8334a', { rough: 0.85 }), [0, 0.51, 0.01], 0.025),
      { p, r: [0, ry, 0] },
    )
  const setting = (x, z) =>
    grp(
      C(0.13, 0.1, 0.02, plateM, [0, 0, 0], null, 20),
      C(0.08, 0.06, 0.025, M('#3b82d6', { rough: 0.25 }), [0, 0.01, 0], null, 18),
      mesh(G.lathe([[0.001, 0], [0.04, 0], [0.01, 0.01], [0.01, 0.08], [0.04, 0.1], [0.045, 0.18], [0.04, 0.18], [0.035, 0.11], [0.001, 0.1]], 14), glassM, { p: [0.15, 0, -0.1] }),
      B(0.02, 0.005, 0.18, CHROME, [-0.17, 0.005, 0], 0.002),
      B(0.02, 0.005, 0.18, CHROME, [0.17, 0.005, 0.05], 0.002),
      { p: [x, 0.79, z] },
    )
  return turn(
    grp(
      B(1.7, 0.07, 1.0, wood, [0, 0.755, 0], 0.025),
      B(1.5, 0.1, 0.82, woodDark, [0, 0.67, 0], 0.02),
      both((s) => both((t) => mesh(legGeo, woodDark, { p: [s * 0.72, 0, t * 0.38] }))),
      B(0.28, 0.005, 0.98, M('#d8334a', { rough: 0.8 }), [0, 0.792, 0], 0.002),
      setting(-0.5, 0.1),
      setting(0.5, -0.1),
      mesh(G.lathe([[0.001, 0], [0.07, 0], [0.04, 0.03], [0.02, 0.12], [0.04, 0.16], [0.001, 0.16]], 16), GOLD, { p: [0, 0.79, 0.15] }),
      C(0.02, 0.02, 0.22, M('#fff6e0', { rough: 0.5 }), [0, 1.06, 0.15], null, 10),
      S(0.025, glowM('#ffb020', 2), [0, 1.2, 0.15], [1, 1.6, 1]),
      mesh(G.lathe([[0.001, 0], [0.08, 0], [0.15, 0.06], [0.16, 0.1], [0.001, 0.04]], 18), M('#f2f4f7', { rough: 0.25 }), { p: [0, 0.79, -0.18] }),
      S(0.06, M('#e2453c', { rough: 0.35 }), [-0.05, 0.9, -0.18]),
      S(0.055, M('#ff9a3a', { rough: 0.6 }), [0.06, 0.9, -0.15]),
      S(0.05, M('#7ccf5e', { rough: 0.35 }), [0.02, 0.9, -0.26]),
      mesh(G.capsule(0.03, 0.12, 8), M('#ffd23f', { rough: 0.5 }), { p: [0, 0.96, -0.2], r: [0.2, 0, 1.1] }),
      chair([-1.0, 0, 0], H),
      chair([1.0, 0, 0], -H),
      chair([-0.35, 0, -0.62], 0),
      chair([0.35, 0, -0.62], 0),
    ),
    -0.2,
  )
}

// --- Jukebox -----------------------------------------------------------------------------
function jukebox() {
  const wood = M('#ffffff', { map: woodTex('item-juke-wood', '#8a4422', '#5a2a12', [1, 1]), rough: 0.35 })
  const W = 0.5
  const top = 1.3
  const arch = (r, n = 16) => {
    const pts = [[-r, 0]]
    for (let i = 0; i <= n; i++) {
      const a = PI - (i / n) * PI
      pts.push([Math.cos(a) * r, Math.sin(a) * r])
    }
    return pts
  }
  const outline = [[-W, 0], [W, 0], ...arch(W).slice(1).reverse().map(([x, y]) => [x, y + top])]
  const archTube = (r, z, col, g) => {
    const pts = [[-r, 0.25, z]]
    for (let i = 0; i <= 12; i++) {
      const a = PI - (i / 12) * PI
      pts.push([Math.cos(a) * r, top + 0.1 + Math.sin(a) * r, z])
    }
    pts.push([r, 0.25, z])
    return T(pts, 0.035, glowM(col, g), 64)
  }
  const D = 0.6
  const zf = D / 2
  const records = grp(
    B(0.62, 0.4, 0.02, M('#2a0e1e', { rough: 0.6 }), [0, 0, -0.08], 0.01),
    rep(5, (i) => grp(C(0.12, 0.12, 0.01, GLOSS_BLACK, [0, 0, 0], [H, 0, 0], 20), C(0.04, 0.04, 0.012, M(['#e2453c', '#ffd23f', '#3dd5ff', '#4dff88', '#ff3df0'][i], { rough: 0.4 }), [0, 0, 0], [H, 0, 0], 12), { p: [-0.2 + i * 0.1, 0.0, -0.05 + i * 0.012], r: [0, 0.6, 0] })),
    C(0.02, 0.02, 0.5, GOLD, [0, -0.1, -0.03], [0, 0, H], 8),
    { p: [0, 1.32, zf - 0.05] },
  )
  return turn(
    grp(
      mesh(G.extrude(outline, D, 0.02), wood, { p: [0, 0.1, 0] }),
      B(1.08, 0.12, D + 0.06, M('#3a1a0c', { rough: 0.5 }), [0, 0.06, 0], 0.03),
      mesh(G.extrude(arch(W - 0.12).map(([x, y]) => [x, y]), 0.02), M('#1a0c14', { rough: 0.5 }), { p: [0, top + 0.1, zf + 0.012] }),
      B(0.76, 0.3, 0.02, M('#1a0c14', { rough: 0.5 }), [0, top - 0.05, zf + 0.012], 0.01),
      records,
      mesh(G.dome(0.42, 1.2, 24, 8), M('#ffe7c0', { opacity: 0.22, rough: 0.05 }), { p: [0, 1.25, zf - 0.02], r: [H, 0, 0], s: [1, 0.35, 1] }),
      archTube(W - 0.04, zf + 0.04, '#ff7a2f', 1.6),
      archTube(W - 0.1, zf + 0.05, '#ff3df0', 1.4),
      both((s) => grp(C(0.04, 0.04, 0.95, glowM(s > 0 ? '#3dd5ff' : '#4dff88', 1.2), [0, 0, 0], null, 12), rep(4, (i) => S(0.018, M('#ffffff', { opacity: 0.7 }), [0, -0.35 + i * 0.22, 0.035])), { p: [s * 0.33, 0.68, zf + 0.04] })),
      B(0.5, 0.22, 0.06, CHROME, [0, 0.98, zf + 0.04], 0.02, [-0.35, 0, 0]),
      rep(10, (i) => B(0.035, 0.035, 0.03, i % 3 ? WHITE : RED, [-0.19 + (i % 5) * 0.095, 0.95 + Math.floor(i / 5) * 0.06, zf + 0.08 - Math.floor(i / 5) * 0.02], 0.008, [-0.35, 0, 0])),
      B(0.5, 0.52, 0.03, M('#5a2a12', { rough: 0.5 }), [0, 0.55, zf + 0.01], 0.02),
      rep(7, (i) => C(0.012, 0.012, 0.46, CHROME, [-0.18 + i * 0.06, 0.55, zf + 0.04], null, 6)),
      C(0.1, 0.1, 0.03, GOLD, [0, 0.55, zf + 0.06], [H, 0, 0], 18),
      mesh(G.torus(W + 0.02, 0.025, PI, 8, 28), CHROME, { p: [0, top + 0.1, zf - 0.05] }),
      C(0.05, 0.05, 0.04, CHROME, [0, top + 0.1 + W + 0.02, zf - 0.05], [H, 0, 0], 14),
    ),
    -0.3,
  )
}

// --- Pinball Machine ---------------------------------------------------------------------
function pinballMachine() {
  const cab = M('#2b1f5c', { rough: 0.35 })
  const play = tex('item-pinball-field', 128, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1a2a8a')
    g.addColorStop(1, '#7a1a8a')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    for (const [cx, cy, c] of [[40, 60, '#ffd23f'], [88, 60, '#ff3df0'], [64, 96, '#3dd5ff']]) {
      x.fillStyle = c
      x.beginPath()
      x.arc(cx, cy, 14, 0, PI * 2)
      x.fill()
    }
    x.strokeStyle = '#ffffff'
    x.lineWidth = 3
    x.beginPath()
    x.moveTo(10, h - 60)
    x.lineTo(48, h - 24)
    x.moveTo(w - 22, h - 60)
    x.lineTo(80, h - 24)
    x.stroke()
    x.fillStyle = '#ff5050'
    for (let i = 0; i < 5; i++) {
      x.beginPath()
      x.moveTo(30 + i * 16, 150)
      x.lineTo(38 + i * 16, 140)
      x.lineTo(46 + i * 16, 150)
      x.fill()
    }
    x.strokeStyle = '#c9ced6'
    x.beginPath()
    x.moveTo(w - 14, h)
    x.lineTo(w - 14, 30)
    x.quadraticCurveTo(w - 14, 6, w / 2, 6)
    x.stroke()
  })
  const back = tex('item-pinball-back', 192, 160, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6)
    g.addColorStop(0, '#ff3df0')
    g.addColorStop(1, '#2a0a50')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#ffd23f'
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2
      x.beginPath()
      x.moveTo(w / 2, h / 2)
      x.lineTo(w / 2 + Math.cos(a) * 120, h / 2 + Math.sin(a) * 120)
      x.lineTo(w / 2 + Math.cos(a + 0.15) * 120, h / 2 + Math.sin(a + 0.15) * 120)
      x.fill()
    }
    x.font = font(40)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.lineWidth = 8
    x.strokeStyle = '#2a0a50'
    x.strokeText('PINBALL', w / 2, h / 2)
    x.fillStyle = '#ffffff'
    x.fillText('PINBALL', w / 2, h / 2)
    x.fillStyle = '#ff5050'
    x.fillRect(40, h - 30, w - 80, 20)
    x.fillStyle = '#ffd23f'
    x.font = font(16)
    x.fillText('0 0 1 2 5 0 0', w / 2, h - 19)
  })
  const side = tex('item-pinball-side', 256, 64, (x, w, h) => {
    x.fillStyle = '#ffd23f'
    x.beginPath()
    x.moveTo(0, h * 0.7)
    x.lineTo(w, h * 0.25)
    x.lineTo(w, h * 0.45)
    x.lineTo(0, h * 0.9)
    x.fill()
    x.fillStyle = '#ff3df0'
    x.beginPath()
    x.moveTo(0, h * 0.45)
    x.lineTo(w, 0)
    x.lineTo(w, h * 0.15)
    x.lineTo(0, h * 0.6)
    x.fill()
  })
  const L = 1.4
  const top = grp(
    B(0.72, 0.36, L, cab, [0, 0, 0], 0.03),
    B(0.74, 0.04, L + 0.02, CHROME, [0, 0.18, 0], 0.012),
    decal(play, 0.64, L - 0.1, { p: [0, 0.181, 0], r: [-H, 0, 0], emissive: true, glow: 0.4 }),
    B(0.66, 0.01, L - 0.08, M('#e0f0ff', { opacity: 0.15, rough: 0.02 }), [0, 0.22, 0], 0.004),
    rep(3, (i) => grp(C(0.045, 0.045, 0.05, WHITE, [0, 0, 0], null, 14), C(0.05, 0.05, 0.015, glowM(['#ffd23f', '#ff3df0', '#3dd5ff'][i], 1.6), [0, 0.03, 0], null, 14), { p: [[-0.13, 0.13, 0][i], 0.205, [-0.4, -0.4, -0.22][i]] })),
    S(0.025, CHROME, [0.1, 0.205, 0.2]),
    both((s) => B(0.12, 0.02, 0.03, WHITE, [s * 0.1, 0.2, 0.48], 0.008, [0, s * 0.5, 0])),
    decal(side, L - 0.1, 0.3, { p: [-0.362, 0, 0], r: [0, -H, 0] }),
    { p: [0, 0.92, 0], r: [0.07, 0, 0] },
  )
  return turn(
    grp(
      top,
      both((s) => both((t) => grp(C(0.035, 0.03, 0.85, CHROME, [0, 0.43, 0], null, 10), C(0.05, 0.05, 0.03, RUBBER, [0, 0.015, 0], null, 10), { p: [s * 0.31, 0, t * 0.62] }))),
      B(0.68, 0.2, 0.2, cab, [0, 1.12, -0.62], 0.02),
      B(0.74, 0.7, 0.2, cab, [0, 1.55, -0.68], 0.03),
      decal(back, 0.66, 0.54, { p: [0, 1.58, -0.578], emissive: true, glow: 1.0 }),
      B(0.74, 0.04, 0.22, CHROME, [0, 1.91, -0.68], 0.012),
      B(0.3, 0.2, 0.02, M('#3a3c44', { metal: 0.6, rough: 0.35 }), [0, 0.67, 0.71], 0.01),
      both((s) => B(0.02, 0.05, 0.02, glowM('#ff4040', 1.6), [s * 0.06, 0.7, 0.725], 0.006)),
      rod([0.24, 0.85, 0.7], [0.24, 0.85, 0.84], 0.012, CHROME, 6),
      S(0.035, RED, [0.24, 0.85, 0.85]),
      both((s) => C(0.03, 0.03, 0.03, glowM('#ffd23f', 0.8), [s * 0.37, 0.9, 0.55], [0, 0, H], 12)),
    ),
    -0.3,
  )
}

// --- Massage Chair -----------------------------------------------------------------------
function massageChair() {
  const cream = M('#efe6d6', { rough: 0.5 })
  const shell = M('#3a3f4b', { rough: 0.35, metal: 0.3 })
  const dark = M('#1d1f26', { rough: 0.7 })
  const led = glowM('#3dd5ff', 1.6)
  const backrest = grp(
    B(0.26, 1.05, 0.62, cream, [0, 0.52, 0], 0.11),
    B(0.2, 1.0, 0.8, shell, [-0.1, 0.55, 0], 0.09),
    B(0.08, 0.8, 0.12, M('#e2d6c0', { rough: 0.6 }), [0.13, 0.5, 0], 0.04),
    B(0.36, 0.34, 0.8, shell, [0.05, 1.08, 0], 0.15),
    B(0.2, 0.24, 0.58, cream, [0.16, 1.0, 0], 0.09),
    B(0.04, 0.6, 0.02, led, [-0.12, 0.55, 0.32], 0.01),
    { p: [-0.42, 0.5, 0], r: [0, 0, 0.42] },
  )
  const legrest = grp(
    B(0.18, 0.62, 0.56, cream, [0.02, -0.3, 0], 0.07),
    both((s) => B(0.04, 0.46, 0.16, dark, [0.11, -0.28, s * 0.13], 0.03)),
    B(0.28, 0.08, 0.56, shell, [0.08, -0.62, 0], 0.035),
    { p: [0.45, 0.5, 0], r: [0, 0, 0.8] },
  )
  const remote = grp(B(0.1, 0.03, 0.06, shell, [0, 0, 0], 0.01), B(0.06, 0.005, 0.04, glowM('#7affd4', 1.2), [0, 0.017, 0], 0.003), { p: [0.3, 1.16, 0.52] })
  return turn(
    grp(
      B(1.1, 0.24, 0.8, shell, [-0.02, 0.14, 0], 0.08),
      B(1.06, 0.03, 0.02, led, [-0.02, 0.15, 0.4], 0.01),
      B(0.66, 0.18, 0.6, cream, [0.04, 0.42, 0], 0.08),
      backrest,
      legrest,
      both((s) =>
        grp(
          B(0.95, 0.62, 0.2, shell, [-0.06, 0.55, 0], 0.09),
          B(0.62, 0.08, 0.2, cream, [0.0, 0.88, 0], 0.04),
          B(0.52, 0.24, 0.22, cream, [0.02, 1.02, 0], 0.09),
          B(0.04, 0.14, 0.13, dark, [0.28, 1.02, 0], 0.03),
          B(0.04, 0.4, 0.02, led, [0.4, 0.55, s * 0.1], 0.01),
          { p: [0, 0, s * 0.38] },
        ),
      ),
      remote,
      T([[0.3, 1.15, 0.52], [0.34, 1.0, 0.54], [0.25, 0.9, 0.5]], 0.008, dark, 8),
    ),
    -0.9,
  )
}

export const models = {
  'Arcade Machine': arcadeMachine,
  Bicycle: bicycle,
  'Big TV': bigTV,
  Armchair: armchair,
  'Gaming Chair': gamingChair,
  Wardrobe: wardrobe,
  Fridge: fridge,
  'Dining Table': diningTable,
  Jukebox: jukebox,
  'Pinball Machine': pinballMachine,
  'Massage Chair': massageChair,
}
