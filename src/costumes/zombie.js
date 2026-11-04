// Zombie (Rare): green rotting skin, a blocky head with a stitched scar, mismatched
// sunken eyes (one bulging, one hollow with a red glint), an exposed brain patch, a
// hanging jaw with crooked teeth; a torn blue shirt with a ragged hem and holes showing
// skin, dark trousers ripped at the right knee, bare forearms with a bandage wrap, and
// worn shoes with a toe poking out of the left one. Dirt and old blood are canvas stains.
import { Group, Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const SKIN = M('#82b25a', { rough: 0.75 })
const SKIN_D = M('#5f8c3e', { rough: 0.8 })
const SKIN_L = M('#9cc472', { rough: 0.75 })
const ROT = M('#4a6a2e', { rough: 0.9 })
const SHIRT = M('#3f6db0', { rough: 0.85 })
const SHIRT_D = M('#2d4f86', { rough: 0.9 })
const PANTS = M('#3a3448', { rough: 0.9 })
const PANTS_D = M('#29243a', { rough: 0.95 })
const SHOE = M('#5b3d27', { rough: 0.8 })
const SOLE = M('#2a1d14', { rough: 0.9 })
const BAND = M('#e6dcc0', { rough: 0.9 })
const BAND_D = M('#c4b48e', { rough: 0.9 })
const THREAD = M('#1e1a14', { rough: 0.8 })
const BRAIN = M('#e494a4', { rough: 0.45, emissive: '#5a1a28', glow: 0.25 })
const BRAIN_D = M('#c2687e', { rough: 0.5 })
const WOUND = M('#6a1a1e', { rough: 0.5 })
const TOOTH = M('#e8dfb0', { rough: 0.4 })
const MOUTH = M('#2a0e10', { rough: 0.8 })
const EYE = M('#f2edc2', { rough: 0.25 })
const PUPIL = M('#141008', { rough: 0.3 })
const GLINT = M('#ff4a3a', { rough: 0.3, emissive: '#ff2010', glow: 0.8 })
const NAIL = M('#3a3a24', { rough: 0.5 })
const HAIR = M('#2b2a1e', { rough: 0.9 })

// --- Canvas paint ------------------------------------------------------------------------------
const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

function blotches(x, w, h, seed, n, cols, rMin, rMax) {
  const r = rnd(seed)
  for (let i = 0; i < n; i++) {
    x.fillStyle = cols[i % cols.length]
    const cx = r() * w
    const cy = r() * h
    const rr = rMin + r() * (rMax - rMin)
    x.beginPath()
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * PI * 2
      const q = rr * (0.6 + r() * 0.5)
      k ? x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : x.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q)
    }
    x.fill()
  }
}

const faceTex = () =>
  tex('zombie:face', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    // rot blotches and veins
    blotches(x, w, h, 7, 9, ['rgba(70,100,40,0.45)', 'rgba(110,150,70,0.35)'], 8, 20)
    x.strokeStyle = 'rgba(60,40,70,0.35)'
    x.lineWidth = 2
    x.beginPath()
    x.moveTo(20, 150)
    x.lineTo(40, 140)
    x.lineTo(50, 160)
    x.moveTo(230, 40)
    x.lineTo(214, 56)
    x.lineTo(222, 70)
    x.stroke()
    // sunken eye bags: left side of the image = the character's right eye (small, hollow)
    const socket = (cx, cy, rx, ry) => {
      const g = x.createRadialGradient(cx, cy, 2, cx, cy, rx * 1.4)
      g.addColorStop(0, 'rgba(20,24,10,0.95)')
      g.addColorStop(0.6, 'rgba(40,50,20,0.8)')
      g.addColorStop(1, 'rgba(60,80,30,0)')
      x.fillStyle = g
      x.beginPath()
      x.ellipse(cx, cy, rx * 1.4, ry * 1.4, 0, 0, PI * 2)
      x.fill()
    }
    socket(78, 108, 30, 26)
    socket(176, 104, 38, 34)
    // brows: crooked, heavy
    x.fillStyle = '#26301a'
    x.save()
    x.translate(78, 70)
    x.rotate(0.28)
    x.fillRect(-30, -7, 60, 13)
    x.restore()
    x.save()
    x.translate(178, 64)
    x.rotate(-0.12)
    x.fillRect(-34, -7, 68, 12)
    x.restore()
    // nose holes
    x.fillStyle = '#2a3518'
    x.beginPath()
    x.ellipse(118, 150, 6, 9, 0.3, 0, PI * 2)
    x.ellipse(140, 150, 6, 9, -0.3, 0, PI * 2)
    x.fill()
    // the open mouth: a dark lopsided hole
    x.fillStyle = '#2a0e10'
    x.beginPath()
    x.moveTo(62, 186)
    x.quadraticCurveTo(128, 172, 200, 182)
    x.lineTo(196, 232)
    x.quadraticCurveTo(128, 246, 70, 234)
    x.closePath()
    x.fill()
    x.fillStyle = '#5a1418'
    x.beginPath()
    x.ellipse(132, 226, 40, 12, 0, 0, PI * 2)
    x.fill()
    // stitched scar across the left cheek (image right)
    x.strokeStyle = '#4a2a2a'
    x.lineWidth = 5
    x.beginPath()
    x.moveTo(150, 150)
    x.lineTo(238, 128)
    x.stroke()
    x.strokeStyle = '#1e1a14'
    x.lineWidth = 3
    for (let i = 0; i < 6; i++) {
      const t = i / 5
      const sx = 156 + t * 76
      const sy = 148 - t * 19
      x.beginPath()
      x.moveTo(sx - 3, sy - 11)
      x.lineTo(sx + 3, sy + 11)
      x.stroke()
    }
    // a dried blood trickle from the mouth corner
    x.fillStyle = 'rgba(110,20,24,0.85)'
    x.beginPath()
    x.moveTo(70, 228)
    x.quadraticCurveTo(62, 244, 66, 256)
    x.lineTo(74, 256)
    x.quadraticCurveTo(72, 242, 78, 232)
    x.fill()
  })

// Shirt front: stains and torn holes showing green skin underneath.
const shirtTex = (key, seed, holes) =>
  tex(key, 256, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    blotches(x, w, h, seed, 7, ['rgba(60,45,30,0.4)', 'rgba(25,40,70,0.35)', 'rgba(100,20,24,0.45)'], 10, 26)
    for (const [cx, cy, r] of holes) {
      const rr = rnd(seed + cx)
      x.beginPath()
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * PI * 2
        const q = r * (0.55 + rr() * 0.6)
        k ? x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.8) : x.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.8)
      }
      x.closePath()
      x.fillStyle = '#7aa852'
      x.fill()
      x.lineWidth = 4
      x.strokeStyle = '#1f3a66'
      x.stroke()
      x.fillStyle = 'rgba(60,90,35,0.8)'
      x.beginPath()
      x.arc(cx + r * 0.2, cy, r * 0.3, 0, PI * 2)
      x.fill()
      // ribs showing in the bigger hole
      if (r > 22) {
        x.strokeStyle = 'rgba(220,210,170,0.8)'
        x.lineWidth = 3
        for (let i = -1; i <= 1; i++) {
          x.beginPath()
          x.moveTo(cx - r * 0.45, cy + i * 9)
          x.quadraticCurveTo(cx, cy + i * 9 - 4, cx + r * 0.45, cy + i * 9)
          x.stroke()
        }
      }
    }
  })

const dirtTex = (key, seed) =>
  tex(key, 128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    blotches(x, w, h, seed, 8, ['rgba(40,28,18,0.5)', 'rgba(90,70,40,0.35)', 'rgba(95,20,22,0.4)'], 8, 22)
  })

// A jagged strip of triangles hanging down (torn hem). Returns an outline in XY.
const jag = (w, h, n, seed) => {
  const r = rnd(seed)
  const pts = [[w / 2, 0], [-w / 2, 0]]
  for (let i = 0; i <= n * 2; i++) {
    const t = i / (n * 2)
    const down = i % 2 ? h * (0.5 + r() * 0.5) : h * 0.12 * r()
    pts.push([-w / 2 + t * w, -down])
  }
  return pts
}

// --- Head (Neck1) ------------------------------------------------------------------------------
function head() {
  const tooth = (x, y, z, h, rz) => mesh(G.rbox(0.13, h, 0.1, 0.03), TOOTH, { p: [x, y, z], r: [0.1, 0, rz] })
  return grp(
    mesh(G.rbox(1.6, 1.6, 1.6, 0.14, 3), SKIN, { p: [0, 5.6, 0] }),
    decal(faceTex(), 1.56, 1.56, { p: [0, 5.6, 0.805] }),
    // right eye (image left): sunken, with a red glint
    mesh(G.sphere(0.12, 12, 8), MOUTH, { p: [-0.33, 5.78, 0.76], s: [1, 0.9, 0.4] }),
    mesh(G.sphere(0.045, 8, 6), GLINT, { p: [-0.32, 5.77, 0.8], shadow: false }),
    // left eye: bulging, oversized, with a tiny pupil looking off
    mesh(G.sphere(0.24, 18, 12), EYE, { p: [0.38, 5.8, 0.74] }),
    mesh(G.sphere(0.075, 10, 8), PUPIL, { p: [0.44, 5.76, 0.96], s: [1, 1, 0.5] }),
    mesh(G.torus(0.24, 0.045, PI * 2, 6, 18), SKIN_D, { p: [0.38, 5.8, 0.8] }),
    // nose stub
    mesh(G.rbox(0.24, 0.3, 0.16, 0.06), SKIN_D, { p: [0.02, 5.5, 0.84] }),
    // upper teeth, crooked, one missing
    tooth(-0.38, 5.24, 0.82, 0.16, 0.12),
    tooth(-0.2, 5.22, 0.83, 0.2, -0.08),
    tooth(0.18, 5.23, 0.83, 0.17, 0.18),
    tooth(0.36, 5.25, 0.82, 0.13, -0.1),
    // hanging lower jaw, skewed to one side, with its own crooked teeth
    grp(
      mesh(G.rbox(1.24, 0.34, 0.5, 0.1), SKIN_L, { p: [0, -0.12, 0] }),
      mesh(G.box(1.0, 0.06, 0.3), MOUTH, { p: [0, 0.06, 0.02] }),
      tooth(-0.3, 0.12, 0.14, 0.14, -0.2),
      tooth(-0.08, 0.13, 0.15, 0.12, 0.1),
      tooth(0.26, 0.12, 0.14, 0.15, 0.25),
      { p: [0.05, 4.95, 0.66], r: [0.12, 0, -0.07] },
    ),
    // ears: one whole, one torn
    mesh(G.rbox(0.18, 0.4, 0.3, 0.06), SKIN_D, { p: [-0.86, 5.6, 0.05] }),
    mesh(G.rbox(0.18, 0.24, 0.3, 0.06), SKIN_D, { p: [0.86, 5.66, 0.05], r: [0, 0, -0.3] }),
    mesh(G.sphere(0.07, 8, 6), WOUND, { p: [0.92, 5.55, 0.08] }),
    // exposed brain on the top-left: torn skin rim, folds bulging out
    mesh(G.cyl(0.52, 0.56, 0.12, 16), WOUND, { p: [0.28, 6.38, -0.06] }),
    ...[
      [0.12, 6.48, 0.06, 0.24],
      [0.42, 6.5, 0.1, 0.22],
      [0.28, 6.52, -0.2, 0.25],
      [0.5, 6.46, -0.22, 0.18],
      [0.06, 6.46, -0.24, 0.17],
    ].map(([x, y, z, r], i) => mesh(G.sphere(r, 14, 10), i % 2 ? BRAIN_D : BRAIN, { p: [x, y, z], s: [1, 0.62, 1] })),
    mesh(G.torus(0.14, 0.035, PI * 1.5, 6, 14), BRAIN_D, { p: [0.28, 6.6, -0.04], r: [PI / 2, 0, 0.4] }),
    // flaps of skin peeled back from the wound
    mesh(G.extrude([[0, 0], [0.4, 0], [0.18, 0.22]], 0.05, 0.01), SKIN_D, { p: [-0.1, 6.42, 0.36], r: [-1.1, 0, 0.2] }),
    // stitched scar running down the left temple
    mesh(G.box(0.02, 0.9, 0.08), WOUND, { p: [0.805, 5.75, -0.18], r: [0.5, 0, 0] }),
    rep(6, (i) => mesh(G.box(0.03, 0.04, 0.26), THREAD, { p: [0.81, 6.1 - i * 0.14, -0.4 + i * 0.08], r: [0.5, 0, 0] })),
    // a few lank hair tufts on the right
    mesh(G.rbox(0.55, 0.12, 0.7, 0.05), HAIR, { p: [-0.45, 6.44, -0.25] }),
    mesh(G.rbox(0.2, 0.5, 0.3, 0.06), HAIR, { p: [-0.78, 6.1, -0.45], r: [0, 0, 0.12] }),
    // neck stub
    mesh(G.rbox(0.8, 0.3, 0.8, 0.1), SKIN_D, { p: [0, 4.78, 0] }),
  )
}

// --- Torso -----------------------------------------------------------------------------------
function chest() {
  return grp(
    mesh(G.rbox(2.9, 1.5, 1.7, 0.1), SHIRT, { p: [0, 4.1, 0] }),
    decal(shirtTex('zombie:shirtF', 11, [[180, 80, 34], [60, 110, 16], [110, 30, 10]]), 2.82, 1.44, { p: [0, 4.1, 0.855] }),
    decal(shirtTex('zombie:shirtB', 23, [[90, 60, 26], [200, 110, 14]]), 2.82, 1.44, { p: [0, 4.1, -0.855], r: [0, PI, 0] }),
    // a torn open collar with green neck showing
    mesh(G.extrude([[-0.38, 0], [0.38, 0], [0, -0.48]], 0.06, 0.01), SKIN, { p: [0, 4.84, 0.85] }),
    both((s) => mesh(G.extrude([[0, 0], [0.48 * s, 0.02], [0.12 * s, -0.42]], 0.06, 0.015), SHIRT_D, { p: [0.08 * s, 4.86, 0.9], r: [0, 0, -0.1 * s] })),
    // two buttons left, one hanging by a thread
    mesh(G.cyl(0.07, 0.07, 0.04, 10), THREAD, { p: [0.05, 4.15, 0.88], r: [PI / 2, 0, 0] }),
    mesh(G.cyl(0.07, 0.07, 0.04, 10), THREAD, { p: [0.08, 3.6, 0.9], r: [PI / 2, 0.3, 0.5] }),
    // patch sewn on the chest
    mesh(G.rbox(0.5, 0.42, 0.05, 0.02), M('#9a7a4a', { rough: 0.9 }), { p: [-0.75, 4.35, 0.865], r: [0, 0, 0.12] }),
    rep(5, (i) => mesh(G.box(0.03, 0.08, 0.02), THREAD, { p: [-0.97 + i * 0.11, 4.58 + i * 0.012, 0.895] })),
    // a hole in the side, showing skin
    mesh(G.rbox(0.05, 0.4, 0.5, 0.02), SKIN, { p: [-1.452, 3.75, 0.1] }),
  )
}

function hips() {
  return grp(
    // the shirt's lower part, ending in a ragged hem
    mesh(G.rbox(2.86, 0.7, 1.66, 0.08), SHIRT, { p: [0, 3.15, 0] }),
    mesh(G.extrude(jag(2.86, 0.42, 7, 5), 0.06, 0.01), SHIRT, { p: [0, 2.82, 0.82] }),
    mesh(G.extrude(jag(2.86, 0.36, 7, 9), 0.06, 0.01), SHIRT, { p: [0, 2.82, -0.82] }),
    both((s) => mesh(G.extrude(jag(1.66, 0.34, 4, 13 + s), 0.06, 0.01), SHIRT_D, { p: [1.42 * s, 2.82, 0], r: [0, PI / 2, 0] })),
    // green belly peeking through below the hem
    mesh(G.rbox(2.74, 0.3, 1.58, 0.06), SKIN, { p: [0, 2.75, 0] }),
    // trouser waist with a rope belt
    mesh(G.rbox(2.84, 0.5, 1.64, 0.08), PANTS, { p: [0, 2.48, 0] }),
    mesh(G.rbox(2.9, 0.12, 1.7, 0.05), M('#8a6e44', { rough: 0.9 }), { p: [0, 2.62, 0] }),
    mesh(G.torus(0.1, 0.035, PI * 2, 6, 12), M('#8a6e44', { rough: 0.9 }), { p: [0.6, 2.56, 0.87] }),
    mesh(G.cyl(0.03, 0.03, 0.4, 6), M('#8a6e44', { rough: 0.9 }), { p: [0.62, 2.34, 0.88], r: [0, 0, 0.15] }),
  )
}

// --- Arms ------------------------------------------------------------------------------------
function upperArm(s) {
  const x = 2.0 * s
  return grp(
    // torn short sleeve
    mesh(G.rbox(1.3, 0.72, 1.3, 0.08), SHIRT, { p: [x, 4.46, 0] }),
    ...[0, PI / 2, PI, -PI / 2].map((a, i) =>
      grp(mesh(G.extrude(jag(1.3, 0.3, 3, 31 + i + s), 0.05, 0.01), i % 2 ? SHIRT_D : SHIRT), {
        p: [x + Math.sin(a) * 0.64, 4.12, Math.cos(a) * 0.64],
        r: [0, a, 0],
      }),
    ),
    // bare green upper arm
    mesh(G.rbox(1.12, 0.9, 1.12, 0.08), SKIN, { p: [x, 3.9, 0] }),
    mesh(G.sphere(0.12, 10, 8), ROT, { p: [x + 0.4 * s, 3.85, 0.52], s: [1, 1.3, 0.3] }),
  )
}

function lowerArm(s) {
  const x = 2.0 * s
  const wraps = s < 0
  const claw = (z, len) =>
    grp(
      mesh(G.rbox(0.22, len, 0.22, 0.06), SKIN_D, { p: [0, -len / 2, 0] }),
      mesh(G.cone(0.08, 0.16, 8), NAIL, { p: [0, -len - 0.05, 0.03], r: [PI + 0.3, 0, 0] }),
      { p: [x, 2.42, z], r: [0.35, 0, 0] },
    )
  return grp(
    mesh(G.rbox(1.1, 1.0, 1.1, 0.08), SKIN, { p: [x, 3.08, 0] }),
    mesh(G.rbox(1.12, 0.22, 1.12, 0.06), SKIN_D, { p: [x, 3.62, 0] }),
    // hand, a bit knobbly, and its clawed fingers reaching out
    mesh(G.rbox(1.0, 0.5, 1.0, 0.12), SKIN_L, { p: [x, 2.58, 0.02] }),
    claw(-0.3, 0.42),
    claw(-0.02, 0.5),
    claw(0.26, 0.44),
    mesh(G.rbox(0.22, 0.34, 0.22, 0.06), SKIN_D, { p: [x - 0.42 * s, 2.5, 0.38], r: [0.4, 0, 0.3 * s] }),
    // bandage wrap on the right forearm, loose end dangling
    wraps &&
      grp(
        ...[3.38, 3.18, 2.98].map((y, i) => mesh(G.rbox(1.18, 0.16, 1.18, 0.05), i % 2 ? BAND_D : BAND, { p: [x, y, 0], r: [0, 0, (i - 1) * 0.12] })),
        mesh(G.rbox(0.18, 0.5, 0.05, 0.02), BAND, { p: [x - 0.3, 2.72, 0.6], r: [0.15, 0, 0.18] }),
        mesh(G.sphere(0.08, 8, 6), WOUND, { p: [x + 0.3, 3.1, 0.58], s: [1, 1, 0.3] }),
      ),
    !wraps && mesh(G.sphere(0.16, 12, 8), ROT, { p: [x + 0.2, 3.1, 0.56], s: [1.4, 1, 0.3] }),
    !wraps && mesh(G.sphere(0.07, 8, 6), WOUND, { p: [x + 0.2, 3.1, 0.6], s: [1, 1, 0.3] }),
  )
}

// --- Legs ------------------------------------------------------------------------------------
function thigh(s) {
  const x = 0.7 * s
  return grp(
    mesh(G.rbox(1.42, 1.24, 1.52, 0.08), PANTS, { p: [x, 1.82, 0] }),
    decal(dirtTex(`zombie:dirtT${s}`, 40 + s), 1.3, 1.1, { p: [x, 1.8, 0.765] }),
    // seam down the outer side
    mesh(G.box(0.02, 1.2, 0.05), PANTS_D, { p: [x + 0.715 * s, 1.82, 0] }),
  )
}

function shin(s) {
  const x = 0.7 * s
  const ripped = s < 0
  return grp(
    // ripped knee: the trouser shin is shorter in front, green knee and shin showing
    ripped
      ? grp(
          mesh(G.rbox(1.42, 0.52, 1.52, 0.08), PANTS, { p: [x, 0.68, 0] }),
          mesh(G.rbox(1.3, 0.5, 1.3, 0.08), SKIN, { p: [x, 1.0, 0.02] }),
          mesh(G.rbox(1.42, 0.5, 0.4, 0.06), PANTS, { p: [x, 0.98, -0.56] }),
          mesh(G.extrude(jag(1.42, 0.2, 4, 77), 0.05, 0.01), PANTS_D, { p: [x, 1.24, 0.75] }),
          mesh(G.extrude(jag(1.42, 0.2, 4, 78), 0.05, 0.01), PANTS_D, { p: [x, 0.92, 0.76], r: [0, 0, PI] }),
          mesh(G.sphere(0.14, 10, 8), WOUND, { p: [x + 0.1, 1.05, 0.65], s: [1.3, 1, 0.3] }),
          mesh(G.extrude([[0, 0], [0.3, 0], [0.1, -0.3]], 0.04, 0.01), PANTS, { p: [x + 0.3, 0.94, 0.78], r: [0, 0, 0.4] }),
        )
      : grp(
          mesh(G.rbox(1.42, 0.86, 1.52, 0.08), PANTS, { p: [x, 0.84, 0] }),
          mesh(G.extrude(jag(1.42, 0.2, 4, 81), 0.05, 0.01), PANTS_D, { p: [x, 0.42, 0.77] }),
          mesh(G.rbox(0.5, 0.36, 0.05, 0.02), PANTS_D, { p: [x - 0.2, 0.95, 0.775], r: [0, 0, 0.2] }),
        ),
    // green ankle above the shoe
    mesh(G.rbox(1.2, 0.2, 1.2, 0.05), SKIN_D, { p: [x, 0.46, 0] }),
    // worn shoe: upper, toe cap, sole, laces
    mesh(G.rbox(1.44, 0.36, 1.9, 0.12), SHOE, { p: [x, 0.24, 0.16] }),
    mesh(G.rbox(1.48, 0.1, 1.98, 0.04), SOLE, { p: [x, 0.05, 0.16] }),
    rep(3, (i) => mesh(G.box(0.7, 0.04, 0.06), M('#c8b890', { rough: 0.9 }), { p: [x, 0.43, 0.3 + i * 0.16], r: [0, (i % 2 ? 0.2 : -0.2), 0] })),
    decal(dirtTex(`zombie:dirtS${s}`, 60 + s), 1.3, 0.3, { p: [x, 0.24, 1.115] }),
    // left shoe: the toe pokes out through a hole
    !ripped && mesh(G.rbox(0.42, 0.24, 0.1, 0.04), SOLE, { p: [x + 0.25, 0.22, 1.105] }),
    !ripped && mesh(G.rbox(0.26, 0.2, 0.28, 0.08), SKIN, { p: [x + 0.25, 0.22, 1.18] }),
    !ripped && mesh(G.rbox(0.16, 0.06, 0.1, 0.02), NAIL, { p: [x + 0.25, 0.3, 1.3] }),
    // the right shoe's sole flaps open at the front
    ripped && mesh(G.rbox(1.42, 0.08, 0.5, 0.03), SOLE, { p: [x, 0.03, 1.2], r: [0.25, 0, 0] }),
  )
}

// --- Baking --------------------------------------------------------------------------------
// Every part is modelled from many small pieces; once built it is merged into one mesh per
// material (geometry cached per part), so the whole costume costs a few dozen draw calls.
const baked = new Map()
function bake(key, make) {
  let parts = baked.get(key)
  if (!parts) {
    const src = make()
    src.updateMatrixWorld(true)
    const byMat = new Map()
    src.traverse((m) => {
      if (!m.isMesh) return
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n)
      g.applyMatrix4(m.matrixWorld)
      if (m.matrixWorld.determinant() < 0) {
        // a mirrored piece: restore the triangle winding
        for (const a of Object.values(g.attributes)) {
          const s = a.itemSize
          const arr = a.array
          for (let i = 0; i < a.count; i += 3)
            for (let k = 0; k < s; k++) {
              const t = arr[(i + 1) * s + k]
              arr[(i + 1) * s + k] = arr[(i + 2) * s + k]
              arr[(i + 2) * s + k] = t
            }
        }
      }
      if (!byMat.has(m.material)) byMat.set(m.material, { geos: [], shadow: m.castShadow })
      byMat.get(m.material).geos.push(g)
    })
    parts = [...byMat].map(([mat, { geos, shadow }]) => ({ mat, shadow, geo: mergeGeometries(geos, false) }))
    for (const p of parts) p.geo.computeBoundingSphere()
    baked.set(key, parts)
  }
  const out = new Group()
  for (const p of parts) {
    const m = new Mesh(p.geo, p.mat)
    m.castShadow = p.shadow
    m.receiveShadow = p.shadow
    out.add(m)
  }
  return out
}

export function build(c) {
  c.on('Neck1', bake('zombie:head', () => head()))
  c.on('Spine2', bake('zombie:chest', () => chest()))
  c.on('Spine1', bake('zombie:hips', () => hips()))
  c.on('ArmL1', bake('zombie:upperArm1', () => upperArm(1)))
  c.on('ArmR1', bake('zombie:upperArm-1', () => upperArm(-1)))
  c.on('ArmL2', bake('zombie:lowerArm1', () => lowerArm(1)))
  c.on('ArmR2', bake('zombie:lowerArm-1', () => lowerArm(-1)))
  c.on('LegL1', bake('zombie:thigh1', () => thigh(1)))
  c.on('LegR1', bake('zombie:thigh-1', () => thigh(-1)))
  c.on('LegL2', bake('zombie:shin1', () => shin(1)))
  c.on('LegR2', bake('zombie:shin-1', () => shin(-1)))
}

// The classic zombie reach: both arms straight out, head lolling.
export const pose = {
  Neck1: { z: -0.12, x: 0.06 },
  ArmL1: { x: -1.35, z: 0.04 },
  ArmR1: { x: -1.25, z: -0.06 },
  ArmL2: { x: -0.1 },
  ArmR2: { x: -0.2 },
  LegL1: { x: -0.12 },
  LegR1: { x: 0.1 },
}
export const cardYaw = -0.28
