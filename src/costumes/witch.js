// Witch (Legendary): green skin, a crooked nose with a wart, long purple-black hair, a
// tall crooked pointy hat with a wide brim, a band and a gold buckle; a purple dress with
// a laced bodice, a belt hung with glowing potion vials, a layered ragged skirt and flared
// sleeves; striped purple/black stockings, pointy curled boots, and a broomstick held in
// the right hand, its bristles bound with twine.
import { Group, Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'

const PI = Math.PI
const SKIN = M('#7cc25a', { rough: 0.6 })
const SKIN_D = M('#5e9e42', { rough: 0.65 })
const WART = M('#4f7e36', { rough: 0.7 })
const HAIR = M('#2c1838', { rough: 0.45, metal: 0.05 })
const HAIR_HI = M('#4a2a60', { rough: 0.4 })
const HAT = M('#24162f', { rough: 0.7 })
const HAT_D = M('#1a0f22', { rough: 0.75 })
const BAND = M('#7a3cb4', { rough: 0.5 })
const GOLD = M('#f0c040', { rough: 0.25, metal: 0.9 })
const DRESS = M('#6a2c9e', { rough: 0.7 })
const DRESS_D = M('#4c1e74', { rough: 0.75 })
const DRESS_L = M('#8a48c4', { rough: 0.7 })
const UNDER = M('#1c1424', { rough: 0.8 })
const LACE = M('#120c18', { rough: 0.6 })
const BELT = M('#2e1c14', { rough: 0.6 })
const BOOT = M('#1a1420', { rough: 0.35, metal: 0.1 })
const WOOD = M('#7a5030', { rough: 0.75 })
const WOOD_D = M('#5a3820', { rough: 0.8 })
const STRAW = M('#d8b45a', { rough: 0.85 })
const STRAW_D = M('#b08a3a', { rough: 0.9 })
const TWINE = M('#8a6a3a', { rough: 0.9 })
const GLASS = M('#d8f4ff', { rough: 0.05, metal: 0.1, opacity: 0.38 })
const CORK = M('#a07848', { rough: 0.8 })
const NAIL = M('#3a1a4a', { rough: 0.3 })

// Stockings: purple/black bands, one texture per stripe count.
const stripes = (n) =>
  tex(`witch:stripes${n}`, 16, 64, (x, w, h) => {
    x.fillStyle = '#7a36b8'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#151019'
    x.fillRect(0, h / 2, w, h / 2)
  }, { repeat: [1, n] })
const STOCK3 = M('#ffffff', { rough: 0.6, map: stripes(3) })
const STOCK2 = M('#ffffff', { rough: 0.6, map: stripes(2) })

const faceTex = () =>
  tex('witch:face', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    // rosy-green cheeks
    for (const cx of [48, 208]) {
      const g = x.createRadialGradient(cx, 160, 2, cx, 160, 30)
      g.addColorStop(0, 'rgba(60,120,40,0.55)')
      g.addColorStop(1, 'rgba(60,120,40,0)')
      x.fillStyle = g
      x.fillRect(cx - 30, 130, 60, 60)
    }
    // eyes: yellow with a slit pupil, a dark lid line and lashes
    for (const [cx, sgn] of [[78, 1], [178, -1]]) {
      x.save()
      x.translate(cx, 108)
      x.fillStyle = '#fff4b0'
      x.beginPath()
      x.ellipse(0, 0, 26, 20, 0, 0, PI * 2)
      x.fill()
      x.fillStyle = '#e8a010'
      x.beginPath()
      x.arc(2 * sgn, 2, 14, 0, PI * 2)
      x.fill()
      x.fillStyle = '#1a0e04'
      x.beginPath()
      x.ellipse(2 * sgn, 2, 4, 12, 0, 0, PI * 2)
      x.fill()
      x.fillStyle = '#ffffff'
      x.beginPath()
      x.arc(-5, -6, 4, 0, PI * 2)
      x.fill()
      x.strokeStyle = '#1e1028'
      x.lineWidth = 6
      x.lineCap = 'round'
      x.beginPath()
      x.ellipse(0, 2, 28, 22, 0, PI * 1.08, PI * 1.92)
      x.stroke()
      x.lineWidth = 4
      for (const dy of [0, 6]) {
        x.beginPath()
        x.moveTo(-24 * sgn, -8 + dy)
        x.lineTo(-36 * sgn, -16 + dy * 1.5)
        x.stroke()
      }
      x.restore()
    }
    // arched, pointy brows (one raised)
    x.strokeStyle = '#2a1436'
    x.lineWidth = 8
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(50, 78)
    x.quadraticCurveTo(80, 58, 106, 76)
    x.moveTo(152, 70)
    x.quadraticCurveTo(178, 46, 210, 66)
    x.stroke()
    // a wide toothy smirk with one snaggle tooth
    x.fillStyle = '#3a0a28'
    x.beginPath()
    x.moveTo(70, 186)
    x.quadraticCurveTo(130, 222, 196, 178)
    x.quadraticCurveTo(140, 200, 70, 186)
    x.fill()
    x.strokeStyle = '#2a0a1c'
    x.lineWidth = 5
    x.beginPath()
    x.moveTo(64, 182)
    x.quadraticCurveTo(130, 224, 200, 172)
    x.stroke()
    x.fillStyle = '#fff6d8'
    x.beginPath()
    x.moveTo(150, 196)
    x.lineTo(162, 192)
    x.lineTo(158, 208)
    x.fill()
    // freckly warts
    x.fillStyle = '#4a7a30'
    for (const [px, py, r] of [[40, 190, 5], [214, 128, 4], [222, 140, 3]]) {
      x.beginPath()
      x.arc(px, py, r, 0, PI * 2)
      x.fill()
    }
  })

// --- Head, hair and hat (Neck1) ---------------------------------------------------------
function hat() {
  // a chain of tapering, tilting segments: the crooked cone
  const segs = [
    [0.84, 1.06, 0.42, -0.04, 0.06],
    [0.62, 0.84, 0.38, -0.1, 0.32],
    [0.42, 0.62, 0.36, -0.06, 0.42],
    [0.26, 0.42, 0.34, -0.04, 0.5],
  ]
  let tipGroup = null
  for (let i = segs.length - 1; i >= 0; i--) {
    const [rt, rb, h, rx, rz] = segs[i]
    const g = grp(
      mesh(G.cyl(rt, rb, h, 20), HAT, { p: [0, h / 2, 0] }),
      mesh(G.sphere(rt, 16, 10), HAT, { p: [0, h, 0] }),
      i === 2 && mesh(G.rbox(0.36, 0.3, 0.08, 0.03), M('#5a3a2a', { rough: 0.9 }), { p: [0, h * 0.5, rb * 0.92], r: [-0.2, 0, 0.15] }),
      { r: [rx, 0, rz] },
    )
    if (tipGroup) {
      tipGroup.position.y = h
      g.add(tipGroup)
    } else {
      // the bent tip, curling over with a little bobble
      g.add(grp(mesh(G.cone(rt, 0.5, 16), HAT, { p: [0, 0.25, 0] }), mesh(G.sphere(0.07, 10, 8), GOLD, { p: [0, 0.5, 0] }), { p: [0, h, 0], r: [-0.1, 0, 0.6] }))
    }
    tipGroup = g
  }
  tipGroup.position.y = 0.12
  return grp(
    // wide, slightly wavy brim with a rolled edge
    mesh(G.cyl(1.9, 1.9, 0.08, 32), HAT, { p: [0, 0, 0] }),
    mesh(G.torus(1.88, 0.06, PI * 2, 8, 40), HAT_D, { r: [PI / 2, 0, 0] }),
    // band and gold buckle
    mesh(G.cyl(1.1, 1.12, 0.32, 24), BAND, { p: [0, 0.2, 0] }),
    grp(
      mesh(G.rbox(0.46, 0.08, 0.06, 0.02), GOLD, { p: [0, 0.15, 0] }),
      mesh(G.rbox(0.46, 0.08, 0.06, 0.02), GOLD, { p: [0, -0.15, 0] }),
      mesh(G.rbox(0.08, 0.38, 0.06, 0.02), GOLD, { p: [0.19, 0, 0] }),
      mesh(G.rbox(0.08, 0.38, 0.06, 0.02), GOLD, { p: [-0.19, 0, 0] }),
      mesh(G.box(0.04, 0.3, 0.05), GOLD, { p: [0, 0, 0.01] }),
      { p: [0, 0.2, 1.12], r: [0, 0, 0] },
    ),
    tipGroup,
    // a tiny spider dangling from the brim on a thread
    mesh(G.cyl(0.006, 0.006, 0.6, 4), M('#dddddd', { rough: 0.5 }), { p: [-1.45, -0.32, 0.9] }),
    grp(
      mesh(G.sphere(0.09, 10, 8), LACE),
      mesh(G.sphere(0.06, 8, 6), LACE, { p: [0, 0.08, 0.05] }),
      both((s) => rep(3, (i) => mesh(G.cyl(0.012, 0.012, 0.2, 4), LACE, { p: [0.1 * s, 0, -0.05 + i * 0.06], r: [0, 0, 1.0 * s] }))),
      { p: [-1.45, -0.66, 0.9] },
    ),
    { p: [0, 6.26, -0.04], r: [-0.06, 0, 0.08] },
  )
}

function head() {
  // crooked nose: a tapering bend ending in a hook, and a wart on its side
  const nose = grp(
    mesh(G.cyl(0.11, 0.16, 0.4, 12), SKIN, { p: [0, 0.2, 0] }),
    mesh(G.sphere(0.11, 12, 8), SKIN, { p: [0, 0.4, 0] }),
    grp(mesh(G.cyl(0.07, 0.11, 0.3, 12), SKIN, { p: [0, 0.15, 0] }), mesh(G.cone(0.07, 0.18, 12), SKIN, { p: [0, 0.39, 0] }), { p: [0, 0.4, 0], r: [0.6, 0, 0.3] }),
    mesh(G.sphere(0.06, 10, 8), WART, { p: [0.12, 0.3, 0.02] }),
    mesh(G.sphere(0.025, 6, 4), WART, { p: [0.15, 0.34, 0.04] }),
    { p: [0.02, 5.5, 0.8], r: [PI / 2 - 0.25, 0, 0.12] },
  )
  const lock = (x, z, len, rz) =>
    grp(mesh(G.rbox(0.28, len, 0.28, 0.1), HAIR, { p: [0, -len / 2, 0] }), mesh(G.cone(0.14, 0.3, 8), HAIR, { p: [0, -len - 0.12, 0], r: [PI, 0, 0] }), { p: [x, 6.25, z], r: [0, 0, rz] })
  return grp(
    mesh(G.rbox(1.6, 1.6, 1.6, 0.14, 3), SKIN, { p: [0, 5.6, 0] }),
    decal(faceTex(), 1.56, 1.56, { p: [0, 5.6, 0.805] }),
    nose,
    // pointy chin
    mesh(G.rbox(0.46, 0.26, 0.2, 0.08), SKIN_D, { p: [0.04, 4.92, 0.76] }),
    // hair: crown, a long back curtain with pointy ends, side locks framing the face
    mesh(G.rbox(1.74, 0.3, 1.74, 0.14), HAIR, { p: [0, 6.28, -0.02] }),
    mesh(G.rbox(1.76, 1.4, 0.3, 0.1), HAIR, { p: [0, 5.55, -0.9] }),
    rep(7, (i) => {
      const x = -0.75 + i * 0.25
      const len = 0.65 + ((i * 37) % 5) * 0.08
      return grp(mesh(G.rbox(0.26, len, 0.26, 0.08), i % 2 ? HAIR : HAIR_HI, { p: [0, -len / 2, 0] }), mesh(G.cone(0.13, 0.28, 8), HAIR, { p: [0, -len - 0.12, 0], r: [PI, 0, 0] }), {
        p: [x, 4.9, -0.95],
        r: [0.12, 0, (i - 3) * 0.04],
      })
    }),
    // a solid side curtain behind the locks
    both((s) => mesh(G.rbox(0.16, 1.05, 1.5, 0.06), HAIR, { p: [0.86 * s, 5.72, -0.12] })),
    lock(0.86, 0.56, 1.0, 0.05),
    lock(-0.86, 0.56, 0.92, -0.05),
    lock(0.88, 0.2, 1.15, 0.03),
    lock(-0.88, 0.2, 1.08, -0.03),
    lock(0.88, -0.18, 1.2, 0.02),
    lock(-0.88, -0.18, 1.22, -0.02),
    lock(0.88, -0.55, 1.3, 0.02),
    lock(-0.88, -0.55, 1.28, -0.02),
    // bangs under the brim
    rep(5, (i) => mesh(G.extrude([[-0.2, 0], [0.2, 0], [0, -0.28 - (i % 2) * 0.08]], 0.08, 0.02), HAIR, { p: [-0.64 + i * 0.32, 6.24, 0.82] })),
    hat(),
  )
}

// --- Dress -----------------------------------------------------------------------------------
function chest() {
  return grp(
    mesh(G.rbox(2.9, 1.5, 1.7, 0.12), DRESS, { p: [0, 4.08, 0] }),
    // laced front panel
    mesh(G.rbox(0.56, 1.42, 0.06, 0.03), DRESS_D, { p: [0, 4.06, 0.86] }),
    rep(4, (i) => both((s) => mesh(G.rbox(0.4, 0.05, 0.04, 0.02), LACE, { p: [0, 4.55 - i * 0.28, 0.91], r: [0, 0, 0.55 * s] }))),
    rep(5, (i) => both((s) => mesh(G.cyl(0.035, 0.035, 0.04, 8), GOLD, { p: [0.2 * s, 4.68 - i * 0.28, 0.9], r: [PI / 2, 0, 0] }))),
    // a little bow at the top of the lacing
    both((s) => mesh(G.sphere(0.09, 10, 8), LACE, { p: [0.09 * s, 4.7, 0.93], s: [1.3, 0.8, 0.5] })),
    // pointed collar flaps over the shoulders and a ragged shawl edge
    both((s) => mesh(G.extrude([[0, 0], [0.9, 0.04], [0.72, -0.5], [0.42, -0.24], [0.2, -0.56]], 0.06, 0.02), DRESS_D, { p: [0.12 * s, 4.86, 0.88], s: [s, 1, 1], r: [0.05, 0, 0] })),
    mesh(G.rbox(2.96, 0.2, 1.76, 0.08), DRESS_D, { p: [0, 4.76, 0] }),
    // a pendant: a crescent moon on a chain
    mesh(G.torus(0.42, 0.015, PI, 4, 16), GOLD, { p: [0, 4.75, 0.9], r: [0, 0, PI] }),
    mesh(G.torus(0.09, 0.03, PI * 1.3, 6, 14), GOLD, { p: [-0.05, 4.24, 0.93], r: [0, 0, 0.6] }),
  )
}

// Ragged hem points for an elliptical skirt (ellipse a x b), n points at height y.
function hemRing(n, a, b, y, w, h, mat, off = 0, flare = 0.18) {
  const tri = G.extrude([[-w / 2, 0], [w / 2, 0], [0, -h]], 0.05, 0.015)
  return rep(n, (i) => {
    const t = ((i + off) / n) * PI * 2
    const nAng = Math.atan2(Math.sin(t) / a, Math.cos(t) / b)
    return grp(mesh(tri, mat, { r: [-flare, 0, 0] }), { p: [Math.sin(t) * a, y, Math.cos(t) * b], r: [0, nAng, 0] })
  })
}

function vial(liquid, glowCol, p, tilt) {
  const LIQ = M(liquid, { rough: 0.15, emissive: glowCol, glow: 0.55 })
  return grp(
    mesh(G.cyl(0.006, 0.006, 0.22, 4), TWINE, { p: [0, 0.3, 0] }),
    mesh(G.cyl(0.06, 0.07, 0.1, 10), CORK, { p: [0, 0.18, 0] }),
    mesh(G.cyl(0.06, 0.07, 0.14, 12), GLASS, { p: [0, 0.08, 0] }),
    mesh(G.sphere(0.17, 16, 12), GLASS, { p: [0, -0.12, 0] }),
    mesh(G.sphere(0.135, 14, 10), LIQ, { p: [0, -0.14, 0] }),
    mesh(G.torus(0.065, 0.015, PI * 2, 4, 12), TWINE, { p: [0, 0.03, 0], r: [PI / 2, 0, 0] }),
    { p, r: [0, 0, tilt] },
  )
}

function hips() {
  const A = 1.56
  const B = 0.98
  return grp(
    mesh(G.rbox(2.86, 0.9, 1.66, 0.1), DRESS, { p: [0, 3.0, 0] }),
    // belt with a gold buckle
    mesh(G.rbox(2.98, 0.3, 1.8, 0.08), BELT, { p: [0, 3.34, 0] }),
    mesh(G.rbox(0.46, 0.4, 0.08, 0.04), GOLD, { p: [0, 3.34, 0.92] }),
    mesh(G.rbox(0.3, 0.24, 0.09, 0.03), BELT, { p: [0, 3.34, 0.93] }),
    mesh(G.box(0.05, 0.3, 0.1), GOLD, { p: [-0.06, 3.34, 0.95] }),
    // potion vials hanging from the belt
    vial('#4cff7a', '#20d050', [0.78, 2.98, 0.98], 0.08),
    vial('#ff5ad8', '#d020a0', [1.22, 3.0, 0.66], -0.06),
    vial('#5ab8ff', '#1a80e0', [-0.95, 2.98, 0.96], -0.1),
    // a pouch on the hip
    mesh(G.rbox(0.42, 0.46, 0.3, 0.12), M('#5a3a22', { rough: 0.85 }), { p: [-1.45, 3.0, 0.3] }),
    mesh(G.rbox(0.44, 0.16, 0.32, 0.05), M('#4a2e1a', { rough: 0.85 }), { p: [-1.45, 3.2, 0.3] }),
    // the layered skirt: a black ragged underskirt, the purple overskirt, a lighter band
    mesh(G.lathe([[1.84, 1.32], [1.76, 1.7], [1.64, 2.3], [1.53, 2.8], [1.48, 3.2]], 32), M('#1c1424', { rough: 0.8, side: 2 }), { s: [1, 1, B / A + 0.02] }),
    hemRing(16, 1.83, 1.83 * (B / A + 0.02), 1.35, 0.78, 0.4, UNDER, 0.5, 0.2),
    mesh(G.lathe([[1.9, 1.62], [1.82, 1.95], [1.7, 2.4], [1.6, 2.85], [1.57, 3.24]], 32), M('#6a2c9e', { rough: 0.7, side: 2 }), { s: [1, 1, B / A + 0.04] }),
    mesh(G.lathe([[1.92, 1.63], [1.88, 1.79]], 32), M('#8a48c4', { rough: 0.7, side: 2 }), { s: [1, 1, B / A + 0.045] }),
    hemRing(14, 1.9, 1.9 * (B / A + 0.04), 1.65, 0.9, 0.34, DRESS, 0, 0.2),
    // a stitched patch on the skirt
    mesh(G.rbox(0.42, 0.36, 0.04, 0.02), M('#3d6a3a', { rough: 0.9 }), { p: [-0.78, 2.15, 1.2], r: [-0.25, -0.4, 0.15] }),
    rep(4, (i) => mesh(G.box(0.02, 0.09, 0.02), M('#e0d0a0', { rough: 0.9 }), { p: [-0.95 + i * 0.11, 2.3 - i * 0.015, 1.23], r: [-0.25, -0.4, 0.15] })),
  )
}

// --- Arms ------------------------------------------------------------------------------------
function upperArm(s) {
  const x = 2.0 * s
  return grp(
    mesh(G.rbox(1.3, 1.26, 1.3, 0.28, 4), DRESS, { p: [x, 4.2, 0] }),
    mesh(G.rbox(1.34, 0.12, 1.34, 0.05), DRESS_D, { p: [x, 3.62, 0] }),
  )
}

function lowerArm(s) {
  const x = 2.0 * s
  const tri = G.extrude([[-0.24, 0], [0.24, 0], [0, -0.3]], 0.04, 0.012)
  return grp(
    mesh(G.rbox(1.2, 0.5, 1.2, 0.1), DRESS, { p: [x, 3.34, 0] }),
    // flared bell sleeve, darker inside, ragged points round the cuff
    mesh(G.cyl(0.66, 1.0, 0.82, 20, true), M('#6a2c9e', { rough: 0.7, side: 0 }), { p: [x, 2.82, 0] }),
    mesh(G.cyl(0.62, 0.96, 0.8, 20, true), M('#3a1658', { rough: 0.8, side: 1 }), { p: [x, 2.82, 0] }),
    mesh(G.torus(0.99, 0.04, PI * 2, 6, 24), DRESS_L, { p: [x, 2.42, 0], r: [PI / 2, 0, 0] }),
    rep(10, (i) => {
      const a = (i / 10) * PI * 2
      return grp(mesh(tri, i % 2 ? DRESS_D : DRESS, { r: [-0.15, 0, 0] }), { p: [x + Math.sin(a) * 0.98, 2.42, Math.cos(a) * 0.98], r: [0, a, 0] })
    }),
    // a bony green hand with long dark nails
    mesh(G.rbox(0.36, 0.5, 0.36, 0.1), SKIN_D, { p: [x, 2.6, 0] }),
    mesh(G.rbox(0.82, 0.48, 0.82, 0.14), SKIN, { p: [x, 2.22, 0] }),
    s > 0 && rep(3, (i) => mesh(G.rbox(0.16, 0.16, 0.14, 0.04), NAIL, { p: [x - 0.3 * s, 2.0, -0.24 + i * 0.24] })),
    // the right hand's fingers curl forward round the broomstick
    s < 0 && mesh(G.rbox(0.7, 0.34, 0.72, 0.12), SKIN, { p: [x, 2.24, 0.62] }),
    s < 0 && rep(3, (i) => mesh(G.rbox(0.14, 0.1, 0.12, 0.03), NAIL, { p: [x + 0.12, 2.12 + i * 0.12, 1.0] })),
  )
}

// The broomstick in the right fist: a knotty shaft, a twine binding and a straw bundle.
function broom() {
  const s = grp(
    // the knobbly shaft, held in front of the forearm
    mesh(G.cyl(0.085, 0.1, 3.7, 12), WOOD, { p: [0, 0.75, 0] }),
    mesh(G.sphere(0.13, 12, 8), WOOD_D, { p: [0, 2.62, 0] }),
    mesh(G.sphere(0.06, 8, 6), WOOD_D, { p: [0.08, 1.6, 0.02] }),
    mesh(G.sphere(0.05, 8, 6), WOOD_D, { p: [-0.07, 0.2, 0.03] }),
    mesh(G.cyl(0.03, 0.05, 0.22, 6), WOOD, { p: [0.12, 2.0, 0], r: [0, 0, -0.9] }),
    // twine binding the bristles
    rep(3, (i) => mesh(G.torus(0.17 + i * 0.015, 0.035, PI * 2, 6, 16), TWINE, { p: [0, -1.05 - i * 0.12, 0], r: [PI / 2, 0, 0] })),
    mesh(G.cyl(0.006, 0.006, 0.3, 4), TWINE, { p: [0.18, -1.35, 0.05], r: [0, 0, 0.2] }),
    // the straw bundle: a flared core and loose straws
    mesh(G.cyl(0.16, 0.46, 1.1, 16), STRAW, { p: [0, -1.65, 0] }),
    rep(14, (i) => {
      const a = (i / 14) * PI * 2
      const r = 0.3 + (i % 3) * 0.06
      return mesh(G.cyl(0.03, 0.025, 1.05 + (i % 4) * 0.06, 5), i % 2 ? STRAW_D : STRAW, {
        p: [Math.sin(a) * r, -1.72 - (i % 4) * 0.03, Math.cos(a) * r],
        r: [Math.cos(a) * 0.32, 0, -Math.sin(a) * 0.32],
      })
    }),
    { r: [0.38, 0, -0.06] },
  )
  return grp(s, { p: [-2.0, 2.24, 0.9] })
}

// --- Legs ------------------------------------------------------------------------------------
function thigh(s) {
  const x = 0.7 * s
  return grp(mesh(G.rbox(1.24, 1.26, 1.26, 0.1), STOCK3, { p: [x, 1.82, 0] }), mesh(G.rbox(1.3, 0.14, 1.32, 0.05), UNDER, { p: [x, 2.3, 0] }))
}

function shin(s) {
  const x = 0.7 * s
  return grp(
    mesh(G.rbox(1.2, 0.76, 1.22, 0.1), STOCK2, { p: [x, 0.95, 0] }),
    // pointy boots with a folded cuff and a buckle; the toe curls up at the end
    mesh(G.rbox(1.32, 0.58, 1.36, 0.14), BOOT, { p: [x, 0.3, 0] }),
    mesh(G.rbox(1.42, 0.16, 1.46, 0.06), DRESS_D, { p: [x, 0.62, 0] }),
    grp(mesh(G.cone(0.6, 1.05, 16), BOOT, { s: [1, 1, 0.42] }), { p: [x, 0.25, 1.0], r: [PI / 2, 0, 0] }),
    mesh(G.tube([[x, 0.26, 1.42], [x, 0.36, 1.62], [x, 0.56, 1.66], [x, 0.62, 1.5]], 0.05, 12), BOOT),
    mesh(G.sphere(0.07, 10, 8), GOLD, { p: [x, 0.6, 1.48] }),
    mesh(G.rbox(1.34, 0.06, 1.38, 0.02), M('#3a2a1a', { rough: 0.7 }), { p: [x, 0.03, 0] }),
    mesh(G.rbox(0.4, 0.22, 0.36, 0.04), M('#3a2a1a', { rough: 0.7 }), { p: [x, 0.1, -0.5] }),
    mesh(G.rbox(0.36, 0.26, 0.06, 0.03), GOLD, { p: [x, 0.36, 0.69] }),
    mesh(G.box(0.22, 0.14, 0.07), BOOT, { p: [x, 0.36, 0.7] }),
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
  c.on('Neck1', bake('witch:head', () => head()))
  c.on('Spine2', bake('witch:chest', () => chest()))
  c.on('Spine1', bake('witch:hips', () => hips()))
  c.on('ArmL1', bake('witch:upperArm1', () => upperArm(1)))
  c.on('ArmR1', bake('witch:upperArm-1', () => upperArm(-1)))
  c.on('ArmL2', bake('witch:lowerArm1', () => lowerArm(1)))
  c.on('ArmR2', bake('witch:lowerArm-1', () => lowerArm(-1)))
  c.on('ArmR2', bake('witch:broom', () => broom()))
  c.on('LegL1', bake('witch:thigh1', () => thigh(1)))
  c.on('LegR1', bake('witch:thigh-1', () => thigh(-1)))
  c.on('LegL2', bake('witch:shin1', () => shin(1)))
  c.on('LegR2', bake('witch:shin-1', () => shin(-1)))
}

// Broom held upright at her side.
export const pose = {
  Neck1: { z: -0.06 },
  ArmR1: { x: -0.2, z: -0.2 },
  ArmR2: { x: -0.2 },
  ArmL1: { x: -0.1, z: 0.32 },
  ArmL2: { x: -0.35 },
}
