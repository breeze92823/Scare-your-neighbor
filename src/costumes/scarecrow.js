// Scarecrow (Secret): a woven burlap sack head with a stitched jagged smile and
// mismatched button eyes, a rope at the neck with straw bursting out, a wide patched
// straw hat; red-and-black plaid flannel, blue denim overalls (straps, brass buttons,
// pocket, knee patch), straw poking out of every cuff, old boots and a crow on the
// shoulder.
import { Group, Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'
import { bake } from '../bake.js'

const PI = Math.PI
// Rounded boxes with 2 bevel segments: ~half the triangles of the default.
const rb = (w, h, d, r) => G.rbox(w, h, d, r, 2)
const UP = new Vector3(0, 1, 0)

const C = {
  burlap: '#c9a46a',
  straw: '#e8c25a',
  strawDk: '#c99a32',
  strawLt: '#f3d985',
  rope: '#9a7646',
  denim: '#3f629e',
  plaid: '#b8231f',
  boot: '#4a2e1c',
  bootDk: '#2a1a10',
  brass: '#c9a13a',
  thread: '#2a1d14',
  crow: '#1b1b24',
}

let seed = 1
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

// A thin straw stalk from `p` along `dir`.
function straw(p, dir, len, mat, r = 0.032) {
  const m = mesh(G.cyl(r * 0.6, r, len, 5), mat, { shadow: false })
  const d = new Vector3(...dir).normalize()
  m.quaternion.setFromUnitVectors(UP, d)
  m.position.set(...p).addScaledVector(d, len / 2)
  return m
}
// A burst of straws around a point, spreading from `dir`.
function tuft(n, p, dir, spread, len, mats) {
  const g = new Group()
  const d = new Vector3(...dir).normalize()
  for (let i = 0; i < n; i++) {
    const v = new Vector3(d.x + (rnd() - 0.5) * spread, d.y + (rnd() - 0.5) * spread, d.z + (rnd() - 0.5) * spread)
    g.add(straw([p[0] + (rnd() - 0.5) * 0.15, p[1] + (rnd() - 0.5) * 0.1, p[2] + (rnd() - 0.5) * 0.15], v.toArray(), len * (0.7 + rnd() * 0.6), mats[i % mats.length]))
  }
  return g
}
// A ring of straws sticking out around a vertical axis.
function strawRing(n, cx, y, cz, rx, rz, outY, len, mats) {
  const g = new Group()
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + rnd() * 0.3
    const sx = Math.sin(a)
    const sz = Math.cos(a)
    g.add(straw([cx + sx * rx, y + (rnd() - 0.5) * 0.08, cz + sz * rz], [sx, outY + (rnd() - 0.5) * 0.5, sz], len * (0.7 + rnd() * 0.6), mats[i % mats.length]))
  }
  return g
}

const burlapTex = () =>
  tex(
    'sc-burlap',
    128,
    128,
    (x, w, h) => {
      x.fillStyle = C.burlap
      x.fillRect(0, 0, w, h)
      for (let i = 0; i < w; i += 4) {
        x.fillStyle = (i / 4) % 2 ? 'rgba(90,60,25,0.28)' : 'rgba(255,235,190,0.18)'
        x.fillRect(i, 0, 2, h)
        x.fillStyle = (i / 4) % 2 ? 'rgba(255,235,190,0.15)' : 'rgba(90,60,25,0.25)'
        x.fillRect(0, i, w, 2)
      }
      seed = 5
      for (let i = 0; i < 300; i++) {
        x.fillStyle = rnd() > 0.5 ? 'rgba(70,45,20,0.25)' : 'rgba(255,240,200,0.2)'
        x.fillRect(rnd() * w, rnd() * h, 2, 1)
      }
    },
    { repeat: [2, 2] },
  )

const plaidTex = (key, base) =>
  tex(
    key,
    128,
    128,
    (x, w, h) => {
      x.fillStyle = base
      x.fillRect(0, 0, w, h)
      x.fillStyle = 'rgba(15,10,12,0.55)'
      x.fillRect(0, 8, w, 30)
      x.fillRect(8, 0, 30, h)
      x.fillRect(0, 72, w, 30)
      x.fillRect(72, 0, 30, h)
      x.fillStyle = 'rgba(15,10,12,0.5)'
      x.fillRect(0, 54, w, 4)
      x.fillRect(54, 0, 4, h)
      x.fillStyle = 'rgba(255,210,120,0.35)'
      x.fillRect(0, 118, w, 2)
      x.fillRect(118, 0, 2, h)
      x.fillStyle = 'rgba(255,255,255,0.06)'
      for (let i = 0; i < h; i += 3) x.fillRect(0, i, w, 1)
    },
    { repeat: [1.5, 1.5] },
  )

const denimTex = (key, stitchBorder = false) =>
  tex(key, 128, 128, (x, w, h) => {
    x.fillStyle = C.denim
    x.fillRect(0, 0, w, h)
    x.strokeStyle = 'rgba(160,190,230,0.22)'
    x.lineWidth = 1.5
    for (let i = -h; i < w; i += 5) {
      x.beginPath()
      x.moveTo(i, h)
      x.lineTo(i + h, 0)
      x.stroke()
    }
    seed = 9
    for (let i = 0; i < 200; i++) {
      x.fillStyle = rnd() > 0.5 ? 'rgba(20,30,60,0.25)' : 'rgba(200,220,250,0.18)'
      x.fillRect(rnd() * w, rnd() * h, 3, 1)
    }
    if (stitchBorder) {
      x.strokeStyle = '#e0a040'
      x.lineWidth = 3
      x.setLineDash([7, 5])
      x.strokeRect(9, 9, w - 18, h - 18)
    }
  })

const patchTex = () =>
  tex('sc-patch', 64, 64, (x, w, h) => {
    x.fillStyle = '#d9b44a'
    x.fillRect(0, 0, w, h)
    x.fillStyle = 'rgba(120,60,10,0.35)'
    for (let i = 0; i < w; i += 8) x.fillRect(i, 0, 3, h)
    for (let i = 0; i < h; i += 8) x.fillRect(0, i, w, 3)
    x.strokeStyle = C.thread
    x.lineWidth = 3
    x.setLineDash([5, 4])
    x.strokeRect(4, 4, w - 8, h - 8)
  })

const faceTex = () =>
  tex('sc-face', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    x.lineCap = 'round'
    x.lineJoin = 'round'
    // stitched cheek patch
    x.fillStyle = 'rgba(150,105,55,0.7)'
    x.fillRect(176, 132, 46, 40)
    x.strokeStyle = C.thread
    x.lineWidth = 2.5
    x.setLineDash([5, 4])
    x.strokeRect(178, 134, 42, 36)
    x.setLineDash([])
    // thread holding the eye buttons on
    x.lineWidth = 3
    for (const [cx, r] of [
      [178, 34],
      [76, 26],
    ]) {
      x.strokeStyle = 'rgba(42,29,20,0.5)'
      x.beginPath()
      x.arc(cx, 98, r, 0, PI * 2)
      x.stroke()
    }
    // stitched triangle nose
    x.fillStyle = '#3a2614'
    x.beginPath()
    x.moveTo(128, 124)
    x.lineTo(114, 148)
    x.lineTo(142, 148)
    x.closePath()
    x.fill()
    // jagged stitched grin
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      const px = 36 + t * 184
      const py = 176 + Math.sin(t * PI) * 28 - (i % 2 ? 10 : -6) * Math.sin(t * PI) + (t < 0.1 || t > 0.9 ? -10 : 0)
      pts.push([px, py])
    }
    x.strokeStyle = '#24160c'
    x.lineWidth = 8
    x.beginPath()
    pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)))
    x.stroke()
    // cross stitches across the mouth
    x.lineWidth = 4
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i]
      x.beginPath()
      x.moveTo(px - 4, py - 13)
      x.lineTo(px + 4, py + 13)
      x.stroke()
    }
  })

function parts(c) {
  const burlap = M('#ffffff', { map: burlapTex(), rough: 0.95 })
  const plaid = M('#ffffff', { map: plaidTex('sc-plaid', C.plaid), rough: 0.85 })
  const plaidDk = M('#ffffff', { map: plaidTex('sc-plaid-dk', '#8a1814'), rough: 0.85 })
  const denim = M('#ffffff', { map: denimTex('sc-denim'), rough: 0.85 })
  const denimSt = M('#ffffff', { map: denimTex('sc-denim-st', true), rough: 0.85 })
  const denimLt = M('#5b7fbc', { rough: 0.85 })
  const patch = M('#ffffff', { map: patchTex(), rough: 0.9 })
  const strawM = [M(C.straw, { rough: 0.8 }), M(C.strawDk, { rough: 0.8 }), M(C.strawLt, { rough: 0.8 })]
  const rope = M(C.rope, { rough: 0.9 })
  const brass = M(C.brass, { rough: 0.3, metal: 0.85 })
  const boot = M(C.boot, { rough: 0.7 })
  const bootDk = M(C.bootDk, { rough: 0.8 })
  const thread = M('#e8dcc0', { rough: 0.8 })
  const hatM = M('#ffffff', { map: burlapTex(), rough: 0.9 })
  const hatStraw = M('#e2b85a', { rough: 0.85 })
  seed = 1 // after the textures: same straw layout on every build

  // ---- sack head ---------------------------------------------------------------------
  c.on('Neck1', mesh(rb(1.66, 1.62, 1.66, 0.32), burlap, { p: [0, 5.62, 0] }))
  c.on('Neck1', decal(faceTex(), 1.5, 1.5, { p: [0, 5.6, 0.84] }))
  // mismatched button eyes: big dark four-hole button (its left) and a small red one
  const button = (r, col, holes, p) =>
    grp(
      mesh(G.cyl(r, r, 0.08, 20), M(col, { rough: 0.35 }), { r: [PI / 2, 0, 0] }),
      mesh(G.torus(r * 0.85, r * 0.12, PI * 2, 6, 20), M(col, { rough: 0.3 }), { p: [0, 0, 0.04] }),
      rep(holes, (i) => {
        const a = (i / holes) * PI * 2 + PI / 4
        return mesh(G.cyl(r * 0.13, r * 0.13, 0.1, 8), M('#0a0806'), { p: [Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32, 0.01], r: [PI / 2, 0, 0] })
      }),
      mesh(G.box(r * 0.95, 0.025, 0.02), thread, { p: [0, 0, 0.055], r: [0, 0, PI / 4] }),
      mesh(G.box(r * 0.95, 0.025, 0.02), thread, { p: [0, 0, 0.055], r: [0, 0, -PI / 4] }),
      { p },
    )
  c.on('Neck1', button(0.25, '#23232b', 4, [0.31, 5.76, 0.87]))
  c.on('Neck1', button(0.18, '#a8331f', 2, [-0.32, 5.74, 0.87]))
  // gathered sack below the head + rope tie with a knot and loose ends
  // rope tied round the bottom of the sack (rounded square), knot, loose ends, straw
  const ropeLoop = (h, y) => {
    const pts = []
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * PI * 2
      const cx = Math.cos(a)
      const sz = Math.sin(a)
      const k = 1 / Math.pow(Math.pow(Math.abs(cx), 4) + Math.pow(Math.abs(sz), 4), 0.25)
      pts.push([cx * k * h, y + Math.sin(a * 3) * 0.015, sz * k * h])
    }
    return pts
  }
  c.on('Neck1', mesh(G.tube(ropeLoop(0.875, 5.0), 0.075, 64, true), rope))
  c.on('Neck1', mesh(G.tube(ropeLoop(0.865, 5.12), 0.05, 64, true), M('#7a5a30', { rough: 0.9 })))
  c.on('Neck1', mesh(G.sphere(0.15, 12, 10), rope, { p: [0.32, 5.0, 0.9] }))
  c.on('Neck1', mesh(G.tube([[0.32, 4.98, 0.94], [0.42, 4.75, 1.0], [0.4, 4.5, 1.02]], 0.05, 10), rope))
  c.on('Neck1', mesh(G.tube([[0.32, 4.98, 0.94], [0.2, 4.76, 1.0], [0.14, 4.55, 1.02]], 0.05, 10), rope))
  c.on('Neck1', mesh(G.cone(0.07, 0.16, 6), rope, { p: [0.4, 4.43, 1.02], r: [PI, 0, 0] }))
  c.on('Neck1', strawRing(26, 0, 4.86, 0, 0.8, 0.8, -0.55, 0.42, strawM))
  // wide patched straw hat (tilted a little)
  c.on(
    'Neck1',
    grp(
      mesh(G.cyl(1.45, 1.5, 0.08, 28), hatM, { p: [0, 0, 0] }),
      mesh(G.torus(1.47, 0.06, PI * 2, 6, 36), hatStraw, { p: [0, 0, 0], r: [PI / 2, 0, 0] }),
      mesh(G.cyl(0.7, 0.86, 0.82, 22), hatM, { p: [0, 0.44, 0] }),
      mesh(G.dome(0.7, PI / 2, 22, 8), hatM, { p: [0, 0.85, 0], s: [1, 0.25, 1] }),
      mesh(G.cyl(0.875, 0.88, 0.2, 22), M('#7a2a1a', { rough: 0.7 }), { p: [0, 0.13, 0] }),
      mesh(rb(0.22, 0.24, 0.08, 0.03), M('#7a2a1a', { rough: 0.7 }), { p: [0.55, 0.13, 0.67], r: [0, 0.7, 0] }),
      mesh(rb(0.42, 0.34, 0.04, 0.02), patch, { p: [-0.25, 0.52, 0.76], r: [-0.17, -0.3, 0.1] }),
      grp(
        tuft(5, [1.4, 0, 0.3], [1, 0.1, 0.3], 0.7, 0.35, strawM),
        tuft(4, [-1.3, 0, -0.6], [-1, -0.1, -0.4], 0.7, 0.3, strawM),
        tuft(4, [-0.5, 0, 1.38], [-0.3, 0, 1], 0.6, 0.3, strawM),
        tuft(3, [0.15, 0.9, 0.1], [0.1, 1, 0], 0.8, 0.25, strawM),
      ),
      { p: [0, 6.47, 0], r: [-0.08, 0, 0.09] },
    ),
  )

  // ---- flannel shirt + overall bib ---------------------------------------------------
  c.on('Spine2', mesh(rb(2.8, 2.1, 1.6, 0.12), plaid, { p: [0, 3.75, 0] }))
  // collar flaps
  c.on('Spine2', both((s) => mesh(G.extrude([[0, 0], [s * 0.62, 0.02], [s * 0.18, -0.45]], 0.08, 0.02), plaidDk, { p: [s * 0.1, 4.82, 0.72], r: [-0.5, 0, 0] })))
  c.on('Spine2', strawRing(14, 0, 4.82, 0, 0.75, 0.68, 0.7, 0.42, strawM))
  // bib with stitched border, pocket, straps and brass buttons
  c.on('Spine2', mesh(rb(1.8, 1.2, 0.1, 0.03), denimSt, { p: [0, 3.82, 0.83] }))
  c.on('Spine2', mesh(rb(0.74, 0.5, 0.06, 0.02), denimSt, { p: [0, 3.95, 0.9] }))
  c.on('Spine2', mesh(G.box(0.74, 0.04, 0.02), M('#e0a040'), { p: [0, 4.14, 0.935] }))
  c.on('Spine2', mesh(G.cyl(0.03, 0.03, 0.4, 6), M('#e8b43a', { rough: 0.5 }), { p: [0.12, 4.28, 0.93], r: [0, 0, 0.1] }))
  c.on('Spine2', mesh(G.cyl(0.045, 0.045, 0.06, 8), M('#c43a2a'), { p: [0.1, 4.48, 0.93], r: [0, 0, 0.1] }))
  c.on(
    'Spine2',
    both((s) =>
      grp(
        mesh(rb(0.34, 0.42, 0.09, 0.03), denim, { p: [s * 0.62, 4.6, 0.84] }),
        mesh(rb(0.34, 0.09, 1.7, 0.03), denim, { p: [s * 0.62, 4.84, 0] }),
        mesh(rb(0.34, 1.7, 0.09, 0.03), denim, { p: [s * 0.62, 4.0, -0.84], r: [0, 0, -s * 0.12] }),
        mesh(rb(0.3, 0.2, 0.06, 0.03), brass, { p: [s * 0.62, 4.42, 0.9] }),
        mesh(G.cyl(0.11, 0.11, 0.06, 16), brass, { p: [s * 0.62, 4.42, 0.94], r: [PI / 2, 0, 0] }),
        mesh(G.cyl(0.06, 0.06, 0.08, 12), M('#8a6a20', { rough: 0.4, metal: 0.8 }), { p: [s * 0.62, 4.42, 0.95], r: [PI / 2, 0, 0] }),
      ),
    ),
  )

  // ---- overalls waist -----------------------------------------------------------------
  c.on('Spine1', mesh(rb(2.86, 0.88, 1.7, 0.12), denim, { p: [0, 2.78, 0] }))
  c.on('Spine1', mesh(rb(2.9, 0.12, 1.74, 0.04), denimLt, { p: [0, 3.16, 0] }))
  c.on('Spine1', both((s) => mesh(G.cyl(0.1, 0.1, 0.06, 14), brass, { p: [s * 1.44, 3.0, 0.4], r: [0, 0, PI / 2] })))
  c.on('Spine1', both((s) => mesh(rb(0.7, 0.55, 0.05, 0.02), denimSt, { p: [s * 0.65, 2.68, -0.86] })))
  c.on('Spine1', mesh(G.box(0.03, 0.75, 0.02), M('#e0a040'), { p: [0, 2.72, 0.86] }))
  // a rag hanging from the back pocket
  c.on('Spine1', mesh(rb(0.36, 0.6, 0.04, 0.02), M('#d8c34a', { rough: 0.9 }), { p: [-0.7, 2.4, -0.92], r: [0.1, 0, 0.2] }))

  // ---- flannel arms with straw hands ---------------------------------------------------
  const arm = (s) => {
    const x = s * 2.0
    const B1 = s > 0 ? 'ArmL1' : 'ArmR1'
    const B2 = s > 0 ? 'ArmL2' : 'ArmR2'
    c.on(B1, mesh(rb(1.22, 1.25, 1.62, 0.12), plaid, { p: [x, 4.18, 0] }))
    c.on(B2, mesh(rb(1.2, 0.62, 1.6, 0.12), plaid, { p: [x, 3.3, 0] }))
    c.on(B2, mesh(rb(1.08, 0.3, 0.05, 0.02), patch, { p: [x, 3.35, -0.82] }))
    c.on(B2, mesh(rb(1.3, 0.24, 1.7, 0.08), plaidDk, { p: [x, 2.98, 0] }))
    c.on(B2, mesh(rb(0.82, 0.4, 1.1, 0.15), strawM[1], { p: [x, 2.72, 0.05] }))
    c.on(B2, tuft(16, [x, 2.75, 0.05], [0, -1, 0], 1.1, 0.6, strawM))
    c.on(B2, strawRing(9, x, 2.92, 0, 0.55, 0.75, -0.6, 0.35, strawM))
  }
  arm(1)
  arm(-1)

  // ---- crow on the left shoulder ------------------------------------------------------
  const crow = M(C.crow, { rough: 0.35, metal: 0.1 })
  c.on(
    'ArmL1',
    grp(
      mesh(G.sphere(0.32, 16, 12), crow, { p: [0, 0.32, -0.05], r: [-0.35, 0, 0], s: [0.85, 0.85, 1.3] }),
      both((s) => mesh(G.sphere(0.3, 14, 10), M('#262634', { rough: 0.4 }), { p: [s * 0.22, 0.34, -0.12], r: [-0.4, 0, s * 0.15], s: [0.25, 0.65, 1.25] })),
      mesh(G.sphere(0.22, 16, 12), crow, { p: [0, 0.68, 0.28] }),
      mesh(G.cone(0.08, 0.32, 8), M('#4a4040', { rough: 0.4 }), { p: [0, 0.65, 0.58], r: [PI / 2 + 0.15, 0, 0] }),
      both((s) => mesh(G.sphere(0.05, 10, 8), M('#ffd040', { emissive: '#a07000', glow: 0.5, rough: 0.2 }), { p: [s * 0.15, 0.73, 0.42] })),
      both((s) => mesh(G.sphere(0.022, 8, 6), M('#000000'), { p: [s * 0.165, 0.735, 0.46] })),
      mesh(rb(0.3, 0.05, 0.55, 0.02), crow, { p: [0, 0.18, -0.5], r: [-0.55, 0, 0] }),
      both((s) => mesh(G.cyl(0.02, 0.02, 0.18, 5), M('#6a5040'), { p: [s * 0.1, 0.06, 0.02] })),
      { p: [2.05, 4.8, 0.05], r: [0, 0.35, 0] },
    ),
  )

  // ---- denim legs, knee patch, straw ankles, boots -----------------------------------
  const leg = (s) => {
    const x = s * 0.7
    const B1 = s > 0 ? 'LegL1' : 'LegR1'
    const B2 = s > 0 ? 'LegL2' : 'LegR2'
    c.on(B1, mesh(rb(1.42, 1.26, 1.66, 0.12), denim, { p: [x, 1.8, 0] }))
    c.on(B1, mesh(G.box(0.03, 1.2, 0.02), M('#e0a040'), { p: [x + s * 0.71, 1.8, 0] }))
    c.on(B2, mesh(rb(1.44, 0.72, 1.68, 0.12), denim, { p: [x, 0.98, 0] }))
    if (s < 0) c.on(B2, mesh(rb(0.68, 0.55, 0.05, 0.02), patch, { p: [x - 0.1, 1.08, 0.85], r: [0, 0, 0.12] }))
    c.on(B2, mesh(rb(1.52, 0.2, 1.76, 0.08), denimLt, { p: [x, 0.66, 0] }))
    c.on(B2, strawRing(10, x, 0.58, 0, 0.66, 0.8, -0.7, 0.32, strawM))
    // boot: shaft, rounded toe, sole, laces
    c.on(B2, mesh(rb(1.26, 0.5, 1.5, 0.14), boot, { p: [x, 0.3, -0.05] }))
    c.on(B2, mesh(G.sphere(0.56, 18, 12), boot, { p: [x, 0.28, 0.65], s: [1.12, 0.6, 0.85] }))
    c.on(B2, mesh(rb(1.34, 0.12, 1.98, 0.05), bootDk, { p: [x, 0.06, 0.25] }))
    c.on(B2, rep(3, (i) => mesh(G.box(0.6, 0.03, 0.04), M('#c8b08a'), { p: [x, 0.42 + i * 0.1, 0.72 - i * 0.04], r: [0, 0, (i % 2 ? 1 : -1) * 0.3] })))
    c.on(B2, mesh(rb(0.7, 0.24, 0.06, 0.02), bootDk, { p: [x, 0.45, 0.7] }))
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
