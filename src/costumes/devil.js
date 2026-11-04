// Devil (Cosmic): red skin, curved black horns, glowing yellow eyes and a sly fanged
// grin, pointed ears and a black goatee; a dark red / black armoured torso with plates,
// pauldrons and a skull-buckle belt; big bat wings on the back, a long arrow-tipped tail,
// clawed hands and goat-like legs ending in black hooves.
import { Group, Vector3 } from 'three'
import { G, M, both, decal, grp, mesh, rep, tex } from '../models/kit.js'
import { bake } from '../bake.js'

const PI = Math.PI
// Rounded boxes with 2 bevel segments: ~half the triangles of the default.
const rb = (w, h, d, r) => G.rbox(w, h, d, r, 2)

const C = {
  skin: '#c9231f',
  skinDk: '#951612',
  plate: '#7a0f17',
  plateDk: '#4d0a10',
  suit: '#26090d',
  black: '#17111a',
  gold: '#d6a23a',
  bone: '#e8dcc2',
  fur: '#3a1715',
  membrane: '#5a0d16',
}

const UP = new Vector3(0, 1, 0)
// Tapered chain of cylinders through points (horns, bones, claws).
function chain(pts, r0, r1, mat, seg = 12) {
  const g = new Group()
  const n = pts.length - 1
  for (let i = 0; i < n; i++) {
    const a = new Vector3(...pts[i])
    const b = new Vector3(...pts[i + 1])
    const ra = r0 + ((r1 - r0) * i) / n
    const rb = r0 + ((r1 - r0) * (i + 1)) / n
    const m = mesh(G.cyl(rb, ra, a.distanceTo(b), seg), mat)
    m.position.copy(a).add(b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize())
    g.add(m)
    if (i > 0) g.add(mesh(G.sphere(ra, seg, 8), mat, { p: pts[i] }))
  }
  return g
}
// A cone at `p` pointing along `dir`.
function spike(r, h, mat, p, dir, seg = 10) {
  const m = mesh(G.cone(r, h, seg), mat)
  const d = new Vector3(...dir).normalize()
  m.quaternion.setFromUnitVectors(UP, d)
  m.position.set(...p).addScaledVector(d, h / 2)
  return m
}

const faceTex = () =>
  tex('devil-face', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    x.lineCap = 'round'
    x.lineJoin = 'round'
    // dark eye sockets
    x.fillStyle = 'rgba(70,0,6,0.55)'
    for (const s of [-1, 1]) {
      x.beginPath()
      x.ellipse(128 + s * 50, 102, 34, 20, s * 0.25, 0, PI * 2)
      x.fill()
    }
    // angry V brows
    x.fillStyle = '#140608'
    for (const s of [-1, 1]) {
      x.beginPath()
      x.moveTo(128 + s * 14, 84)
      x.lineTo(128 + s * 90, 58)
      x.lineTo(128 + s * 86, 72)
      x.lineTo(128 + s * 18, 96)
      x.closePath()
      x.fill()
    }
    // nose
    x.strokeStyle = 'rgba(80,0,8,0.7)'
    x.lineWidth = 4
    x.beginPath()
    x.moveTo(122, 120)
    x.lineTo(116, 146)
    x.lineTo(126, 150)
    x.stroke()
    // sly lopsided grin
    x.fillStyle = '#2a0408'
    x.beginPath()
    x.moveTo(62, 168)
    x.quadraticCurveTo(130, 206, 204, 150)
    x.quadraticCurveTo(196, 172, 186, 178)
    x.quadraticCurveTo(128, 222, 68, 178)
    x.closePath()
    x.fill()
    x.strokeStyle = '#140608'
    x.lineWidth = 5
    x.beginPath()
    x.moveTo(56, 162)
    x.lineTo(66, 172)
    x.moveTo(204, 150)
    x.lineTo(212, 140)
    x.stroke()
    // fangs + small teeth
    x.fillStyle = '#fbf6ea'
    const tooth = (tx, ty, tw, th) => {
      x.beginPath()
      x.moveTo(tx - tw, ty)
      x.lineTo(tx + tw, ty)
      x.lineTo(tx, ty + th)
      x.closePath()
      x.fill()
    }
    tooth(96, 181, 9, 26)
    tooth(166, 175, 9, 26)
    for (let i = 0; i < 4; i++) tooth(114 + i * 13, 185 - i * 2, 5, 9)
    // soul patch under the lip
    x.fillStyle = '#140608'
    x.beginPath()
    x.moveTo(118, 214)
    x.lineTo(140, 214)
    x.lineTo(129, 236)
    x.closePath()
    x.fill()
  })

const eyeTex = () =>
  tex('devil-eyes', 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h)
    for (const s of [-1, 1]) {
      x.save()
      x.translate(128 + s * 50, 104)
      x.rotate(s * 0.28)
      const g = x.createRadialGradient(0, 0, 2, 0, 0, 30)
      g.addColorStop(0, '#fff6a0')
      g.addColorStop(0.55, '#ffd21c')
      g.addColorStop(1, '#ff8a00')
      x.fillStyle = g
      x.beginPath()
      x.moveTo(-30, 0)
      x.quadraticCurveTo(0, -22, 30, 0)
      x.quadraticCurveTo(0, 16, -30, 0)
      x.fill()
      x.fillStyle = '#1a0500'
      x.beginPath()
      x.ellipse(0, -1, 3.5, 10, 0, 0, PI * 2)
      x.fill()
      x.restore()
    }
  })

const furTex = () =>
  tex('devil-fur', 128, 128, (x, w, h) => {
    x.fillStyle = C.fur
    x.fillRect(0, 0, w, h)
    let s = 11
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    x.lineWidth = 2
    for (let i = 0; i < 260; i++) {
      const px = r() * w
      const py = r() * h
      x.strokeStyle = r() > 0.5 ? 'rgba(0,0,0,0.35)' : 'rgba(120,50,40,0.35)'
      x.beginPath()
      x.moveTo(px, py)
      x.lineTo(px + (r() - 0.5) * 6, py + 8 + r() * 6)
      x.stroke()
    }
  })

// One bat wing in its own plane (XY, x = outward on side s), root at the origin.
function wing(mats, s) {
  const K = [1.1 * s, 1.3]
  const T = [
    [2.5, 1.7],
    [2.45, 0.35],
    [1.85, -0.75],
    [0.6, -1.15],
  ].map(([x, y]) => [x * s, y])
  const outline = [[0, 0.15], [0.55, 0.95], [1.1, 1.3], [1.85, 1.62], [2.5, 1.7], [2.2, 1.18], [2.15, 0.85], [2.45, 0.35], [1.95, 0.2], [1.8, -0.15], [1.85, -0.75], [1.4, -0.55], [1.0, -0.62], [0.6, -1.15], [0.25, -0.55], [0, -0.25]].map(([x, y]) => [x * s, y])
  const g = new Group()
  g.add(mesh(G.extrude(outline, 0.04), mats.membrane))
  g.add(chain([[0, 0, 0], [0.55 * s, 0.92, 0], [K[0], K[1], 0]], 0.11, 0.07, mats.bone))
  for (const t of T) g.add(chain([[K[0], K[1], 0], [(K[0] + t[0]) / 2 + 0.05 * s, (K[1] + t[1]) / 2 + 0.06, 0], [t[0], t[1], 0]], 0.065, 0.025, mats.bone, 8))
  g.add(mesh(G.sphere(0.12, 12, 8), mats.bone, { p: [K[0], K[1], 0] }))
  g.add(spike(0.07, 0.3, mats.claw, [K[0], K[1] + 0.08, 0], [-0.3 * s, 1, 0]))
  return g
}

function parts(c) {
  const skin = M(C.skin, { rough: 0.5 })
  const skinDk = M(C.skinDk, { rough: 0.55 })
  const plate = M(C.plate, { rough: 0.35, metal: 0.55 })
  const plateDk = M(C.plateDk, { rough: 0.4, metal: 0.5 })
  const suit = M(C.suit, { rough: 0.7 })
  const black = M(C.black, { rough: 0.35, metal: 0.15 })
  const gold = M(C.gold, { rough: 0.3, metal: 0.85 })
  const bone = M(C.bone, { rough: 0.6 })
  const fur = M('#ffffff', { map: furTex(), rough: 0.9 })
  const gem = M('#ff7a1a', { emissive: '#ff5a10', glow: 0.9, rough: 0.2 })

  // ---- head ----------------------------------------------------------------------------
  c.on('Neck1', mesh(rb(1.6, 1.6, 1.6, 0.18), skin, { p: [0, 5.6, 0] }))
  c.on('Neck1', decal(faceTex(), 1.5, 1.5, { p: [0, 5.6, 0.81] }))
  c.on('Neck1', decal(eyeTex(), 1.5, 1.5, { p: [0, 5.6, 0.815], emissive: true, glow: 0.95 }))
  // brow ridge + goatee
  c.on('Neck1', mesh(rb(1.3, 0.12, 0.12, 0.05), skinDk, { p: [0, 5.96, 0.8] }))
  c.on('Neck1', mesh(G.cone(0.2, 0.6, 12), black, { p: [0, 4.75, 0.76], r: [PI + 0.25, 0, 0], s: [1, 1, 0.6] }))
  // horns
  const hornM = M('#1b1416', { rough: 0.3, metal: 0.1 })
  c.on(
    'Neck1',
    both((s) =>
      grp(
        mesh(G.cyl(0.27, 0.3, 0.12, 16), plateDk, { p: [s * 0.52, 6.42, 0.1] }),
        chain([[s * 0.52, 6.35, 0.1], [s * 0.78, 6.7, 0.12], [s * 0.98, 7.0, 0.02], [s * 1.04, 7.3, -0.14], [s * 0.94, 7.52, -0.3]], 0.24, 0.05, hornM),
        spike(0.05, 0.16, hornM, [s * 0.94, 7.52, -0.3], [-s * 0.4, 0.6, -0.6]),
        rep(3, (i) => mesh(G.torus(0.2 - i * 0.035, 0.025, PI * 2, 6, 16), plateDk, { p: [s * (0.66 + i * 0.13), 6.56 + i * 0.17, 0.11 - i * 0.03], r: [PI / 2 - s * 0.6, 0, s * 0.6] })),
      ),
    ),
  )
  // pointed ears
  c.on(
    'Neck1',
    both((s) =>
      grp(
        mesh(G.extrude([[0, -0.22], [0.62 * s, 0.22], [0, 0.22]], 0.08, 0.02), skin),
        mesh(G.extrude([[0.05 * s, -0.1], [0.42 * s, 0.16], [0.05 * s, 0.15]], 0.04), skinDk, { p: [0, 0, 0.04] }),
        { p: [s * 0.78, 5.62, -0.05], r: [0, -s * 0.5, 0] },
      ),
    ),
  )

  // ---- armoured torso --------------------------------------------------------------
  c.on('Spine2', mesh(rb(2.8, 2.2, 1.6, 0.1), suit, { p: [0, 3.7, 0] }))
  c.on('Spine2', mesh(G.cyl(0.7, 0.82, 0.24, 18), plateDk, { p: [0, 4.86, 0] }))
  // chest plate with split pecs, gold trim and a glowing gem
  c.on('Spine2', both((s) => mesh(rb(1.2, 1.0, 0.3, 0.12), plate, { p: [s * 0.62, 4.2, 0.78], r: [0, s * 0.12, 0] })))
  c.on('Spine2', mesh(rb(2.56, 0.08, 0.34, 0.03), gold, { p: [0, 4.72, 0.78] }))
  c.on('Spine2', mesh(rb(2.4, 0.08, 0.34, 0.03), gold, { p: [0, 3.68, 0.8] }))
  c.on('Spine2', mesh(G.torus(0.16, 0.04, PI * 2, 8, 20), gold, { p: [0, 4.2, 0.96] }))
  c.on('Spine2', mesh(G.sphere(0.14, 16, 12), gem, { p: [0, 4.2, 0.95] }))
  c.on('Spine2', both((s) => rep(3, (i) => mesh(G.sphere(0.05, 8, 6), gold, { p: [s * (0.28 + i * 0.35), 4.6, 0.95] }))))
  // segmented abdominal plates
  c.on('Spine2', rep(3, (i) => mesh(rb(2.0 - i * 0.2, 0.24, 0.22, 0.08), i % 2 ? plate : plateDk, { p: [0, 3.45 - i * 0.27, 0.82] })))
  // back plate with a spine ridge
  c.on('Spine2', mesh(rb(2.4, 1.3, 0.22, 0.1), plateDk, { p: [0, 4.05, -0.82] }))
  c.on('Spine2', rep(4, (i) => spike(0.08, 0.24, black, [0, 4.55 - i * 0.32, -0.92], [0, 0.4, -1])))
  // bat wings
  const wm = { membrane: M(C.membrane, { rough: 0.75, side: 2 }), bone: M('#1e1214', { rough: 0.5 }), claw: M('#e8dcc2', { rough: 0.4 }) }
  c.on('Spine2', both((s) => grp(wing(wm, s), { p: [s * 0.45, 4.4, -0.9], r: [0.05, s * 0.32, s * 0.16], s: 1.15 })))
  c.on('Spine2', both((s) => mesh(G.sphere(0.2, 12, 10), plateDk, { p: [s * 0.45, 4.3, -0.9] })))

  // ---- hips: belt with skull buckle, tassets, tail --------------------------------
  c.on('Spine1', mesh(rb(2.8, 0.55, 1.6, 0.1), suit, { p: [0, 2.6, 0] }))
  c.on('Spine1', mesh(rb(2.94, 0.36, 1.74, 0.1), M('#1a1012', { rough: 0.55 }), { p: [0, 2.86, 0] }))
  c.on('Spine1', rep(8, (i) => mesh(G.sphere(0.055, 8, 6), gold, { p: [-1.3 + i * 0.37, 2.86, 0.88] })))
  c.on(
    'Spine1',
    grp(
      mesh(rb(0.56, 0.44, 0.18, 0.14), bone),
      both((s) => mesh(G.sphere(0.08, 10, 8), M('#120a0a'), { p: [s * 0.12, 0.04, 0.08], s: [1, 1.1, 0.5] })),
      mesh(G.cone(0.05, 0.08, 3), M('#120a0a'), { p: [0, -0.08, 0.09], r: [PI, 0, 0] }),
      mesh(rb(0.36, 0.14, 0.14, 0.05), bone, { p: [0, -0.25, 0] }),
      rep(3, (i) => mesh(G.box(0.02, 0.1, 0.02), M('#5a4a3a'), { p: [-0.08 + i * 0.08, -0.25, 0.07] })),
      both((s) => spike(0.05, 0.22, hornM, [s * 0.18, 0.18, 0], [s * 0.6, 1, 0])),
      { p: [0, 2.88, 0.93] },
    ),
  )
  c.on('Spine1', both((s) => mesh(rb(0.95, 0.55, 0.12, 0.05), plate, { p: [s * 0.62, 2.42, 0.88], r: [-0.12, 0, s * 0.05] })))
  c.on('Spine1', both((s) => mesh(rb(0.95, 0.08, 0.14, 0.03), gold, { p: [s * 0.62, 2.18, 0.91], r: [-0.12, 0, s * 0.05] })))
  // tail swinging out to the right (toward the card camera) with an arrowhead tip
  const tailPts = [[-0.2, 2.75, -0.8], [-0.35, 2.2, -1.3], [-0.7, 1.4, -1.7], [-1.3, 0.95, -1.8], [-1.95, 1.05, -1.6], [-2.35, 1.45, -1.3], [-2.5, 1.9, -1.1]]
  c.on('Spine1', mesh(G.tube(tailPts, 0.1, 40), skin))
  c.on('Spine1', mesh(G.sphere(0.16, 12, 10), skin, { p: tailPts[0] }))
  c.on(
    'Spine1',
    grp(
      mesh(G.extrude([[0, 0.62], [0.34, 0.02], [0.13, 0.08], [0.07, -0.12], [-0.07, -0.12], [-0.13, 0.08], [-0.34, 0.02]], 0.08, 0.03), black),
      mesh(G.extrude([[0, 0.45], [0.18, 0.1], [-0.18, 0.1]], 0.02), plate, { p: [0, 0, 0.06] }),
      { p: [-2.52, 1.98, -1.08], r: [0.3, -0.45, 0.15] },
    ),
  )

  // ---- arms: pauldrons, bracers, clawed hands ------------------------------------
  const arm = (s) => {
    const x = s * 2.0
    const B1 = s > 0 ? 'ArmL1' : 'ArmR1'
    const B2 = s > 0 ? 'ArmL2' : 'ArmR2'
    c.on(B1, mesh(rb(1.18, 1.25, 1.55, 0.15), skin, { p: [x, 4.15, 0] }))
    c.on(B1, mesh(G.dome(0.8, PI / 2, 20, 10), plateDk, { p: [x + s * 0.06, 4.45, 0], s: [0.95, 0.75, 1.15] }))
    c.on(B1, mesh(G.cyl(0.78, 0.82, 0.14, 20), black, { p: [x + s * 0.06, 4.42, 0], s: [0.95, 1, 1.15] }))
    c.on(B1, mesh(G.cyl(0.72, 0.74, 0.12, 20), plate, { p: [x + s * 0.06, 4.28, 0], s: [0.95, 1, 1.12] }))
    c.on(B1, mesh(G.torus(0.78, 0.035, PI * 2, 6, 28), gold, { p: [x + s * 0.06, 4.49, 0], r: [PI / 2, 0, 0], s: [0.95, 1.15, 1] }))
    c.on(B1, spike(0.13, 0.5, hornM, [x + s * 0.25, 4.95, 0], [s * 0.5, 1, 0]))
    c.on(B1, spike(0.09, 0.3, hornM, [x + s * 0.1, 4.95, 0.42], [s * 0.4, 1, 0.3]))
    c.on(B1, spike(0.09, 0.3, hornM, [x + s * 0.1, 4.95, -0.42], [s * 0.4, 1, -0.3]))
    // forearm bracer
    c.on(B2, mesh(rb(1.14, 0.7, 1.5, 0.14), skin, { p: [x, 3.25, 0] }))
    c.on(B2, mesh(rb(1.28, 0.55, 1.66, 0.12), black, { p: [x, 3.22, 0] }))
    c.on(B2, mesh(rb(1.32, 0.08, 1.7, 0.03), gold, { p: [x, 3.48, 0] }))
    c.on(B2, mesh(rb(1.32, 0.08, 1.7, 0.03), gold, { p: [x, 2.96, 0] }))
    c.on(B2, rep(2, (i) => spike(0.07, 0.3, plate, [x + s * 0.64, 3.22, -0.3 + i * 0.6], [s, 0.3, 0])))
    // clawed hand
    c.on(B2, mesh(rb(1.04, 0.5, 1.36, 0.18), skin, { p: [x, 2.66, 0.05] }))
    c.on(B2, rep(4, (i) => mesh(rb(0.22, 0.26, 0.24, 0.08), skinDk, { p: [x - s * 0.05, 2.36, -0.36 + i * 0.3] })))
    c.on(B2, rep(4, (i) => spike(0.07, 0.28, bone, [x - s * 0.08, 2.26, -0.36 + i * 0.3], [-s * 0.35, -1, 0.15])))
    c.on(B2, mesh(G.capsule(0.12, 0.25, 10), skin, { p: [x - s * 0.42, 2.62, 0.68], r: [0.5, 0, s * 0.4] }))
    c.on(B2, spike(0.06, 0.22, bone, [x - s * 0.52, 2.45, 0.8], [-s * 0.5, -1, 0.4]))
  }
  arm(1)
  arm(-1)

  // ---- goat legs: furry thighs, reverse-hock shins, cloven hooves ---------------
  const leg = (s) => {
    const x = s * 0.7
    const B1 = s > 0 ? 'LegL1' : 'LegR1'
    const B2 = s > 0 ? 'LegL2' : 'LegR2'
    c.on(B1, mesh(rb(1.4, 1.3, 1.62, 0.2), fur, { p: [x, 1.82, 0] }))
    c.on(B1, mesh(rb(1.0, 0.5, 0.12, 0.05), plateDk, { p: [x, 1.9, 0.82], r: [-0.05, 0, 0] }))
    c.on(B2, mesh(rb(1.15, 0.62, 1.4, 0.2), fur, { p: [x, 1.0, -0.12] }))
    c.on(B2, mesh(G.sphere(0.4, 14, 10), fur, { p: [x, 0.9, -0.55], s: [1.3, 1, 1] }))
    c.on(B2, mesh(rb(0.82, 0.6, 0.85, 0.2), fur, { p: [x, 0.55, 0.12], r: [-0.3, 0, 0] }))
    // knee guard with a small spike
    c.on(B2, mesh(rb(0.9, 0.5, 0.18, 0.08), plate, { p: [x, 1.18, 0.72], r: [0.15, 0, 0] }))
    c.on(B2, mesh(rb(0.92, 0.06, 0.2, 0.02), gold, { p: [x, 0.95, 0.75], r: [0.15, 0, 0] }))
    c.on(B2, spike(0.07, 0.22, hornM, [x, 1.2, 0.8], [0, 0.3, 1]))
    c.on(B2, rep(10, (i) => {
      const a = (i / 10) * PI * 2
      return spike(0.1, 0.28, fur, [x + Math.sin(a) * 0.44, 0.42, 0.2 + Math.cos(a) * 0.48], [Math.sin(a) * 0.6, -1, Math.cos(a) * 0.6])
    }))
    c.on(B2, mesh(G.cyl(0.5, 0.58, 0.36, 18), black, { p: [x, 0.18, 0.22] }))
    c.on(B2, mesh(G.box(0.07, 0.34, 0.3), M('#05030a'), { p: [x, 0.18, 0.72] }))
    c.on(B2, mesh(G.cyl(0.6, 0.6, 0.04, 18), M('#3a2a2a', { rough: 0.4, metal: 0.3 }), { p: [x, 0.02, 0.22] }))
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
