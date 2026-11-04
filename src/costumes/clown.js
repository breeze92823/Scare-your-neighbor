// Clown (Mythical): white face paint with blue diamond eyes, red ball nose and a huge
// painted grin, puffy blue hair tufts around a bald dome with a tiny tilted top hat, a
// big ruffled collar, a harlequin split suit (blue / orange) with pompom buttons, puffy
// sleeves with ruffle cuffs, white gloves, baggy trousers and huge red shoes.
import { Group } from 'three'
import { bake } from '../bake.js'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
// Rounded boxes with 2 bevel segments: ~half the triangles of the default.
const rb = (w, h, d, r) => G.rbox(w, h, d, r, 2)

const C = {
  skin: '#f6f2ea',
  blue: '#2f6fe0',
  blueDk: '#1f4fb0',
  hair: '#3d86ff',
  hairDk: '#2a62d8',
  orange: '#ff8a1e',
  red: '#e2262b',
  yellow: '#ffd23a',
  green: '#43c25a',
  white: '#fbfbf7',
  ink: '#1b1b22',
}

const faceTex = () =>
  tex('clown-face', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    x.lineCap = 'round'
    x.lineJoin = 'round'
    // blue diamond eye marks
    for (const cx of [78, 178]) {
      x.fillStyle = '#2f6fe0'
      x.beginPath()
      x.moveTo(cx, 30)
      x.lineTo(cx + 24, 96)
      x.lineTo(cx, 150)
      x.lineTo(cx - 24, 96)
      x.closePath()
      x.fill()
      x.strokeStyle = '#173a8a'
      x.lineWidth = 3
      x.stroke()
      // eye white + pupil
      x.fillStyle = '#ffffff'
      x.beginPath()
      x.ellipse(cx, 96, 13, 17, 0, 0, PI * 2)
      x.fill()
      x.fillStyle = C.ink
      x.beginPath()
      x.ellipse(cx + 1, 99, 8, 11, 0, 0, PI * 2)
      x.fill()
      x.fillStyle = '#ffffff'
      x.beginPath()
      x.arc(cx + 4, 93, 3, 0, PI * 2)
      x.fill()
      // high arched brow
      x.strokeStyle = C.ink
      x.lineWidth = 5
      x.beginPath()
      x.moveTo(cx - 26, 26)
      x.quadraticCurveTo(cx, 2, cx + 26, 26)
      x.stroke()
    }
    // rosy cheeks
    x.fillStyle = 'rgba(255,90,110,0.45)'
    for (const cx of [40, 216]) {
      x.beginPath()
      x.arc(cx, 160, 18, 0, PI * 2)
      x.fill()
    }
    // the wide painted grin (red with a dark mouth line and teeth)
    x.fillStyle = '#e2262b'
    x.beginPath()
    x.moveTo(30, 150)
    x.quadraticCurveTo(128, 268, 226, 150)
    x.quadraticCurveTo(216, 146, 208, 158)
    x.quadraticCurveTo(128, 214, 48, 158)
    x.quadraticCurveTo(40, 146, 30, 150)
    x.fill()
    x.fillStyle = '#5a0a12'
    x.beginPath()
    x.moveTo(58, 172)
    x.quadraticCurveTo(128, 246, 198, 172)
    x.quadraticCurveTo(128, 214, 58, 172)
    x.fill()
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.moveTo(70, 180)
    x.quadraticCurveTo(128, 215, 186, 180)
    x.quadraticCurveTo(128, 226, 70, 180)
    x.fill()
    x.strokeStyle = 'rgba(90,10,18,0.8)'
    x.lineWidth = 2
    for (let i = 0; i < 7; i++) {
      const tx = 84 + i * 15
      x.beginPath()
      x.moveTo(tx, 188)
      x.lineTo(tx, 212)
      x.stroke()
    }
  })

// Polka-dot fabric for the suit.
const dotsTex = (key, base, dot) =>
  tex(key, 128, 128, (x, w, h) => {
    x.fillStyle = base
    x.fillRect(0, 0, w, h)
    x.fillStyle = 'rgba(0,0,0,0.08)'
    for (let i = 0; i < 128; i += 8) x.fillRect(0, i, w, 2)
    x.fillStyle = dot
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        x.beginPath()
        x.arc(16 + c * 32 + (r % 2) * 16, 16 + r * 32, 7, 0, PI * 2)
        x.fill()
      }
  })

// Flattened puff (ruffle) facing outward from the y axis through (0, y, 0).
const ruffle = (n, rx, rz, y, r, mats, sy = 0.42, tilt = 0.35, cx = 0, phase = 0) =>
  rep(n, (i) => {
    const a = (i / n) * PI * 2 + phase
    const px = Math.sin(a) * rx
    const pz = Math.cos(a) * rz
    return grp(mesh(G.sphere(r, 10, 6), mats[i % mats.length], { r: [tilt, 0, 0], s: [1, sy, 0.7] }), { p: [cx + px, y, pz], r: [0, a, 0] })
  })

function parts(c) {
  const skin = M(C.skin, { rough: 0.55 })
  const blue = M('#ffffff', { map: dotsTex('clown-blue', C.blue, '#ffffff'), rough: 0.7 })
  const orange = M('#ffffff', { map: dotsTex('clown-orange', C.orange, C.yellow), rough: 0.7 })
  const blueP = M(C.blue, { rough: 0.7 })
  const orangeP = M(C.orange, { rough: 0.7 })
  const white = M(C.white, { rough: 0.7 })
  const red = M(C.red, { rough: 0.25 })
  const yellow = M(C.yellow, { rough: 0.6 })
  const ink = M(C.ink, { rough: 0.5 })
  const glove = M('#ffffff', { rough: 0.55 })
  const pom = [M(C.red, { rough: 0.9, flat: true }), M(C.yellow, { rough: 0.9, flat: true }), M(C.green, { rough: 0.9, flat: true })]

  // ---- head ----------------------------------------------------------------------------
  c.on('Neck1', mesh(rb(1.6, 1.6, 1.6, 0.2), skin, { p: [0, 5.6, 0] }))
  c.on('Neck1', decal(faceTex(), 1.5, 1.5, { p: [0, 5.6, 0.81] }))
  // red ball nose with a highlight
  c.on('Neck1', mesh(G.sphere(0.25, 20, 14), red, { p: [0, 5.55, 0.95] }))
  c.on('Neck1', mesh(G.sphere(0.07, 10, 8), M('#ffffff', { rough: 0.2 }), { p: [-0.08, 5.65, 1.16] }))
  // ears
  c.on('Neck1', both((s) => mesh(G.sphere(0.2, 14, 10), skin, { p: [s * 0.82, 5.55, 0.05], s: [0.5, 1, 0.8] })))
  // puffy hair tufts on both sides (bald on top)
  const hair = [M(C.hair, { rough: 0.85 }), M(C.hairDk, { rough: 0.85 })]
  const tufts = [
    [0.1, 0.05, 0.0, 0.42],
    [0.2, 0.42, 0.25, 0.32],
    [0.18, -0.32, 0.3, 0.3],
    [0.25, 0.32, -0.32, 0.36],
    [0.12, -0.3, -0.35, 0.33],
    [0.0, 0.5, -0.1, 0.3],
    [0.35, 0.02, 0.05, 0.32],
    [-0.15, 0.22, -0.62, 0.34],
    [-0.2, -0.2, -0.6, 0.3],
  ]
  c.on('Neck1', both((s) => grp(...tufts.map(([dx, dy, dz, r], i) => mesh(G.sphere(r, 12, 9), hair[i % 2], { p: [s * (0.88 + dx), 5.75 + dy, dz] })))))
  // back of the head fringe
  c.on('Neck1', rep(5, (i) => mesh(G.sphere(0.3, 12, 8), hair[i % 2], { p: [-0.6 + i * 0.3, 5.45 + (i % 2) * 0.12, -0.8] })))
  // tiny tilted top hat with a flower
  c.on(
    'Neck1',
    grp(
      mesh(G.cyl(0.46, 0.46, 0.06, 20), ink, { p: [0, 0.03, 0] }),
      mesh(G.cyl(0.29, 0.31, 0.52, 20), ink, { p: [0, 0.3, 0] }),
      mesh(G.cyl(0.315, 0.315, 0.11, 20), red, { p: [0, 0.12, 0] }),
      mesh(G.cyl(0.3, 0.3, 0.02, 20), M('#3a3a46', { rough: 0.4 }), { p: [0, 0.565, 0] }),
      grp(
        rep(5, (i) => mesh(G.sphere(0.07, 10, 8), white, { p: [Math.cos((i / 5) * PI * 2) * 0.08, Math.sin((i / 5) * PI * 2) * 0.08, 0], s: [1, 1, 0.4] })),
        mesh(G.sphere(0.055, 10, 8), yellow, { p: [0, 0, 0.02] }),
        { p: [0.1, 0.17, 0.3] },
      ),
      { p: [0.25, 6.4, 0.05], r: [-0.08, 0, -0.32] },
    ),
  )

  // ---- torso: harlequin split suit ---------------------------------------------------
  c.on('Spine2', mesh(rb(1.42, 2.1, 1.66, 0.14), blue, { p: [0.7, 3.78, 0] }))
  c.on('Spine2', mesh(rb(1.42, 2.1, 1.66, 0.14), orange, { p: [-0.7, 3.78, 0] }))
  // centre seam trim + big pompom buttons
  c.on('Spine2', mesh(rb(0.16, 2.05, 0.08, 0.03), yellow, { p: [0, 3.78, 0.83] }))
  c.on('Spine2', rep(3, (i) => mesh(G.ico(0.23, 1), pom[i], { p: [0, 4.28 - i * 0.52, 0.95] })))
  // back seam
  c.on('Spine2', mesh(rb(0.16, 2.05, 0.08, 0.03), yellow, { p: [0, 3.78, -0.83] }))
  // big ruffled collar: two layers of overlapping puffs
  c.on('Spine2', ruffle(18, 1.32, 1.08, 4.8, 0.46, [white, M('#e9eefc', { rough: 0.7 })], 0.4, 0.45))
  c.on('Spine2', ruffle(16, 1.05, 0.9, 4.95, 0.38, [M('#ffffff', { rough: 0.7 }), M('#ffe27a', { rough: 0.7 })], 0.42, 0.55, 0, 0.22))
  c.on('Spine2', mesh(G.cyl(0.72, 0.8, 0.22, 20), white, { p: [0, 4.88, 0] }))

  // ---- hips ---------------------------------------------------------------------------
  c.on('Spine1', mesh(rb(1.46, 0.62, 1.72, 0.12), orange, { p: [0.72, 2.52, 0] }))
  c.on('Spine1', mesh(rb(1.46, 0.62, 1.72, 0.12), blue, { p: [-0.72, 2.52, 0] }))
  c.on('Spine1', mesh(rb(2.96, 0.3, 1.76, 0.1), yellow, { p: [0, 2.86, 0] }))
  c.on('Spine1', rep(6, (i) => mesh(G.sphere(0.07, 10, 8), red, { p: [-1.25 + i * 0.5, 2.86, 0.89], s: [1, 1, 0.5] })))
  // giant bow at the back
  c.on('Spine1', grp(...[1, -1].map((s) => mesh(G.cone(0.28, 0.5, 4), red, { p: [s * 0.25, 0, 0], r: [0, 0, s * PI / 2] })), mesh(G.sphere(0.12, 12, 8), red), { p: [0, 2.86, -0.95] }))

  // ---- arms: puffy sleeves, ruffle cuffs, white gloves -------------------------------
  const arm = (s) => {
    const cloth = s > 0 ? blue : orange
    const plain = s > 0 ? blueP : orangeP
    const x = s * 2.0
    const B1 = s > 0 ? 'ArmL1' : 'ArmR1'
    const B2 = s > 0 ? 'ArmL2' : 'ArmR2'
    c.on(B1, mesh(G.sphere(0.74, 20, 14), cloth, { p: [x + s * 0.05, 4.3, 0], s: [0.95, 0.85, 1.18] }))
    c.on(B1, mesh(rb(1.18, 0.7, 1.55, 0.14), cloth, { p: [x, 3.88, 0] }))
    c.on(B1, mesh(G.torus(0.62, 0.07, PI * 2, 8, 24), yellow, { p: [x, 4.3, 0], r: [PI / 2, 0, 0], s: [1.15, 1.4, 1] }))
    c.on(B2, mesh(rb(1.18, 0.66, 1.55, 0.14), cloth, { p: [x, 3.3, 0] }))
    c.on(B2, mesh(G.cyl(0.66, 0.66, 0.12, 20), plain, { p: [x, 3.0, 0], s: [1, 1, 1.25] }))
    c.on(B2, ruffle(11, 0.66, 0.86, 2.95, 0.26, [white, M('#e9eefc', { rough: 0.7 })], 0.45, 0.5, x))
    // glove + thumb + finger seams
    c.on(B2, mesh(rb(1.0, 0.62, 1.32, 0.24), glove, { p: [x, 2.6, 0.1] }))
    c.on(B2, mesh(G.capsule(0.13, 0.22, 10), glove, { p: [x - s * 0.38, 2.68, 0.72], r: [0.5, 0, s * 0.4] }))
    c.on(B2, rep(3, (i) => mesh(G.box(0.03, 0.3, 0.03), M('#c9ccd6', { rough: 0.7 }), { p: [x + s * 0.505, 2.5, -0.25 + i * 0.3] })))
    c.on(B2, mesh(G.torus(0.52, 0.06, PI * 2, 8, 20), glove, { p: [x, 2.88, 0.1], r: [PI / 2, 0, 0], s: [1, 1.3, 1] }))
  }
  arm(1)
  arm(-1)

  // ---- legs: baggy trousers + huge red shoes ----------------------------------------
  const leg = (s) => {
    const cloth = s > 0 ? orange : blue
    const x = s * 0.72
    const B1 = s > 0 ? 'LegL1' : 'LegR1'
    const B2 = s > 0 ? 'LegL2' : 'LegR2'
    c.on(B1, mesh(rb(1.44, 1.3, 1.74, 0.16), cloth, { p: [x, 1.8, 0] }))
    c.on(B2, mesh(rb(1.5, 0.78, 1.8, 0.16), cloth, { p: [x, 0.98, 0] }))
    c.on(B2, mesh(rb(1.6, 0.18, 1.9, 0.08), yellow, { p: [x, 0.64, 0] }))
    c.on(B2, rep(4, (i) => mesh(G.ico(0.09, 1), pom[(i + (s > 0 ? 1 : 0)) % 3], { p: [x - 0.5 + i * 0.33, 0.64, 0.97] })))
    // shoe: round bulb toe, sole, heel, white bow
    c.on(B2, mesh(G.sphere(0.62, 22, 14), red, { p: [x, 0.38, 0.55], s: [1.2, 0.62, 1.8] }))
    c.on(B2, mesh(rb(1.36, 0.5, 1.2, 0.2), red, { p: [x, 0.3, -0.15] }))
    c.on(B2, mesh(G.cyl(0.62, 0.62, 0.14, 22), M('#2a1a1e', { rough: 0.6 }), { p: [x, 0.07, 0.5], s: [1.12, 1, 1.9] }))
    c.on(B2, mesh(G.sphere(0.14, 12, 8), M('#ffffff', { rough: 0.2 }), { p: [x - s * 0.22, 0.66, 1.25], s: [1.2, 0.5, 1] }))
    c.on(B2, grp(mesh(G.sphere(0.14, 12, 8), white, { p: [0.15, 0, 0], s: [1.2, 0.7, 0.5] }), mesh(G.sphere(0.14, 12, 8), white, { p: [-0.15, 0, 0], s: [1.2, 0.7, 0.5] }), mesh(G.sphere(0.07, 10, 8), white), { p: [x, 0.72, 0.55], r: [-0.4, 0, 0] }))
  }
  leg(1)
  leg(-1)
}

// Every part is merged per bone and material, so the whole costume is a few dozen
// draw calls (phones) while it is authored as many small pieces.
export function build(c) {
  const byBone = {}
  parts({ on: (bone, o) => ((byBone[bone] ??= new Group()).add(o), o) })
  for (const [bone, g] of Object.entries(byBone)) c.on(bone, bake(g, true))
}
