// Bog Beast (Horror): a bulky mossy swamp monster, wider than the base body: lumpy
// green blocks with darker patches, rows of spikes down its back, one huge yellow eye
// with a slit pupil, a wide mouth of jagged teeth, two antenna stalks with glowing tips,
// dripping slime, cattail reeds and lily pads growing on it, webbed clawed hands and
// big webbed feet.
import { Group, Vector3 } from 'three'
import { G, M, both, grp, mesh, rep, tex } from '../models/kit.js'
import { bake } from '../bake.js'

const PI = Math.PI
// Rounded boxes with 2 bevel segments: ~half the triangles of the default.
const rb = (w, h, d, r) => G.rbox(w, h, d, r, 2)
const UP = new Vector3(0, 1, 0)

const C = {
  moss: '#4f8f37',
  mossDk: '#2f5a22',
  mossLt: '#6fae48',
  belly: '#a6c95a',
  spike: '#6b6a3a',
  claw: '#2b2617',
  tooth: '#ece3b4',
  mouth: '#3a0d0d',
  eye: '#f2d23a',
  iris: '#ff9a1a',
  slime: '#9be35a',
  web: '#8ccf5a',
  lily: '#5fb53c',
  reed: '#6f8a3a',
  cattail: '#6b3e1e',
}

let seed = 4
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

function spike(r, h, mat, p, dir, seg = 10) {
  const m = mesh(G.cone(r, h, seg), mat)
  const d = new Vector3(...dir).normalize()
  m.quaternion.setFromUnitVectors(UP, d)
  m.position.set(...p).addScaledVector(d, h / 2)
  return m
}
// Hanging slime drip: a stretched blob and a bead under it.
const drip = (mat, p, len = 1) => grp(mesh(G.sphere(0.075, 10, 8), mat, { p: [0, -0.1 * len, 0], s: [1, 2.2 * len, 1], shadow: false }), mesh(G.sphere(0.06, 10, 8), mat, { p: [0, -0.26 * len, 0], shadow: false }), { p })
// A lily pad (notched disc) lying flat.
const lilyGeo = (r) => {
  const pts = [[0, 0]]
  for (let i = 0; i <= 20; i++) {
    const a = 0.35 + (i / 20) * (PI * 2 - 0.7)
    pts.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return G.extrude(pts, 0.04, 0.015)
}

const mossTex = () =>
  tex('bog-moss', 128, 128, (x, w, h) => {
    x.fillStyle = C.moss
    x.fillRect(0, 0, w, h)
    seed = 21
    for (let i = 0; i < 60; i++) {
      x.fillStyle = rnd() > 0.5 ? 'rgba(34,70,24,0.45)' : 'rgba(120,180,70,0.35)'
      x.beginPath()
      x.arc(rnd() * w, rnd() * h, 3 + rnd() * 12, 0, PI * 2)
      x.fill()
    }
    for (let i = 0; i < 400; i++) {
      x.fillStyle = rnd() > 0.5 ? 'rgba(20,45,15,0.5)' : 'rgba(170,220,110,0.4)'
      x.fillRect(rnd() * w, rnd() * h, 2, 2)
    }
  })
const bellyTex = () =>
  tex('bog-belly', 128, 128, (x, w, h) => {
    x.fillStyle = C.belly
    x.fillRect(0, 0, w, h)
    x.fillStyle = 'rgba(70,100,30,0.45)'
    for (let i = 14; i < h; i += 22) x.fillRect(0, i, w, 5)
    seed = 31
    for (let i = 0; i < 150; i++) {
      x.fillStyle = 'rgba(80,110,40,0.3)'
      x.fillRect(rnd() * w, rnd() * h, 2, 2)
    }
  })

function parts(c) {
  const moss = M('#ffffff', { map: mossTex(), rough: 0.85 })
  const belly = M('#ffffff', { map: bellyTex(), rough: 0.7 })
  const mossDk = M(C.mossDk, { rough: 0.9, flat: true })
  const mossLt = M(C.mossLt, { rough: 0.85, flat: true })
  const spikeM = M(C.spike, { rough: 0.6 })
  const claw = M(C.claw, { rough: 0.4 })
  const tooth = M(C.tooth, { rough: 0.5 })
  const slime = M(C.slime, { rough: 0.12, opacity: 0.85, emissive: '#2f7a10', glow: 0.35 })
  const web = M(C.web, { rough: 0.4, opacity: 0.8, side: 2 })
  const lily = M(C.lily, { rough: 0.55 })
  const stalkM = M('#3f6e2a', { rough: 0.9 })
  seed = 4 // after the textures: same lumps on every build

  // ---- head ----------------------------------------------------------------------------
  c.on('Neck1', mesh(rb(2.0, 1.75, 1.9, 0.35), moss, { p: [0, 5.62, 0.05] }))
  c.on('Neck1', rep(7, (i) => mesh(G.ico(0.2 + rnd() * 0.15, 1), i % 2 ? mossDk : mossLt, { p: [(rnd() - 0.5) * 1.8, 6.4 + rnd() * 0.08, (rnd() - 0.5) * 1.6], s: [1, 0.6, 1] })))
  c.on('Neck1', both((s) => mesh(G.ico(0.32, 1), mossDk, { p: [s * 0.98, 5.4, -0.2], s: [0.5, 1, 1] })))
  // brow ridge + the huge eye (sclera, iris cap, slit pupil, heavy lid, lower bag)
  c.on('Neck1', mesh(rb(1.45, 0.3, 0.42, 0.13), mossDk, { p: [0, 6.27, 0.88], r: [0.25, 0, 0] }))
  const eyeP = [0, 5.86, 0.86]
  c.on('Neck1', mesh(G.sphere(0.54, 24, 16), M(C.eye, { rough: 0.25, emissive: '#8a6a00', glow: 0.35 }), { p: eyeP }))
  c.on('Neck1', mesh(G.dome(0.545, 0.62, 24, 8), M(C.iris, { rough: 0.2, emissive: '#7a3000', glow: 0.35 }), { p: eyeP, r: [PI / 2, 0, 0] }))
  c.on('Neck1', mesh(G.sphere(0.1, 12, 10), M('#0a0604', { rough: 0.15 }), { p: [0, 5.86, 1.37], s: [0.45, 3.0, 0.45] }))
  c.on('Neck1', mesh(G.sphere(0.06, 10, 8), M('#ffffff', { rough: 0.1 }), { p: [-0.17, 6.04, 1.34] }))
  c.on('Neck1', mesh(G.dome(0.59, PI / 2, 24, 8), moss, { p: eyeP, r: [-0.5, 0, 0] }))
  c.on('Neck1', mesh(G.torus(0.58, 0.05, PI, 6, 20), mossDk, { p: eyeP, r: [-0.5 + PI / 2, 0, 0] }))
  c.on('Neck1', mesh(rb(0.9, 0.16, 0.3, 0.07), mossDk, { p: [0, 5.38, 1.0] }))
  // wide mouth with jagged teeth
  c.on('Neck1', mesh(rb(1.6, 0.5, 0.3, 0.12), M(C.mouth, { rough: 0.6 }), { p: [0, 5.12, 0.93] }))
  c.on('Neck1', mesh(rb(1.82, 0.14, 0.4, 0.06), mossDk, { p: [0, 5.38, 0.95] }))
  c.on('Neck1', mesh(rb(1.82, 0.18, 0.42, 0.07), mossDk, { p: [0, 4.86, 0.95] }))
  c.on('Neck1', rep(7, (i) => mesh(G.cone(0.075 + (i % 2) * 0.03, 0.2 + (i % 3) * 0.06, 6), tooth, { p: [-0.7 + i * 0.233, 5.24 - (i % 3) * 0.03, 1.04], r: [PI, 0, 0] })))
  c.on('Neck1', rep(6, (i) => mesh(G.cone(0.075 + ((i + 1) % 2) * 0.025, 0.18 + (i % 2) * 0.07, 6), tooth, { p: [-0.6 + i * 0.24, 5.02, 1.04] })))
  c.on('Neck1', both((s) => spike(0.08, 0.32, tooth, [s * 0.78, 4.92, 1.05], [s * 0.15, 1, 0])))
  c.on('Neck1', drip(slime, [0.55, 4.8, 1.08], 1.2))
  c.on('Neck1', drip(slime, [-0.3, 4.78, 1.1], 0.8))
  // antenna stalks with glowing tips
  const stalk = M(C.mossDk, { rough: 0.7 })
  const tip = M('#d6ff5a', { emissive: '#b8ff30', glow: 0.9, rough: 0.3 })
  const tipHalo = M('#d6ff5a', { emissive: '#a8ff30', glow: 0.6, opacity: 0.3 })
  c.on(
    'Neck1',
    both((s) => {
      const pts = [[s * 0.5, 6.4, -0.1], [s * 0.7, 6.8, -0.05], [s * 0.95, 7.05, 0.15], [s * 1.1, 7.12, 0.42]]
      return grp(
        mesh(G.tube(pts, 0.06, 20), stalk),
        mesh(G.sphere(0.13, 14, 10), tip, { p: pts[3] }),
        mesh(G.sphere(0.21, 14, 10), tipHalo, { p: pts[3], shadow: false }),
        mesh(G.cyl(0.13, 0.16, 0.12, 12), mossDk, { p: pts[0] }),
      )
    }),
  )
  // lily pad + flower on the head
  c.on(
    'Neck1',
    grp(
      mesh(lilyGeo(0.55), lily, { r: [-PI / 2, 0, 0] }),
      rep(6, (i) => mesh(G.cone(0.07, 0.22, 5), M('#f39ac0', { rough: 0.5 }), { p: [Math.cos((i / 6) * PI * 2) * 0.08, 0.1, Math.sin((i / 6) * PI * 2) * 0.08], r: [Math.sin((i / 6) * PI * 2) * 0.6, 0, -Math.cos((i / 6) * PI * 2) * 0.6] })),
      mesh(G.sphere(0.06, 10, 8), M('#ffe14a', { rough: 0.5 }), { p: [0, 0.12, 0] }),
      { p: [0.45, 6.6, 0.15], r: [0.18, 0.6, 0.1] },
    ),
  )
  // head spikes
  c.on('Neck1', rep(3, (i) => spike(0.16 - i * 0.02, 0.5 - i * 0.08, spikeM, [0, 6.35 - i * 0.45, -0.85], [0, 0.5, -1])))

  // ---- hulking torso -----------------------------------------------------------------
  c.on('Spine2', mesh(rb(3.3, 2.35, 2.0, 0.38), moss, { p: [0, 3.85, -0.05] }))
  c.on('Spine2', mesh(rb(2.1, 1.75, 0.2, 0.1), belly, { p: [0, 3.65, 0.9] }))
  c.on('Spine2', rep(9, (i) => mesh(G.ico(0.22 + rnd() * 0.2, 1), i % 3 ? mossDk : mossLt, { p: [(rnd() > 0.5 ? 1 : -1) * (1.25 + rnd() * 0.35), 3.0 + rnd() * 1.9, (rnd() - 0.5) * 1.7], s: [0.7, 1, 1] })))
  c.on('Spine2', rep(4, (i) => mesh(G.ico(0.3, 1), mossDk, { p: [-1.2 + i * 0.8, 4.98, -0.3 + (i % 2) * 0.4], s: [1, 0.45, 1] })))
  // two rows of back spikes
  c.on('Spine2', both((s) => rep(4, (i) => spike(0.2 - i * 0.02, 0.62 - i * 0.06, spikeM, [s * 0.45, 4.7 - i * 0.48 - (s > 0 ? 0 : 0.22), -1.02], [s * 0.2, 0.45, -1]))))
  c.on('Spine2', rep(3, (i) => spike(0.12, 0.35, spikeM, [0, 4.5 - i * 0.5, -1.05], [0, 0.4, -1])))
  c.on('Spine2', drip(slime, [0.6, 2.78, 0.98], 1.3))
  c.on('Spine2', drip(slime, [-0.75, 2.8, 0.96]))
  // cattail reeds + leaf growing from the back-left shoulder
  const reed = M(C.reed, { rough: 0.7 })
  const cat = M(C.cattail, { rough: 0.9 })
  c.on(
    'Spine2',
    grp(
      ...[
        [0, 0, 0, 1.9, 0.12],
        [0.22, 0.05, 0.1, 1.6, -0.18],
        [-0.2, -0.05, -0.15, 1.35, 0.3],
      ].map(([dx, dz, rx, h, rz]) => grp(mesh(G.cyl(0.03, 0.04, h, 6), reed, { p: [0, h / 2, 0] }), mesh(G.capsule(0.1, 0.38, 8), cat, { p: [0, h - 0.35, 0] }), mesh(G.cyl(0.012, 0.02, 0.25, 4), reed, { p: [0, h + 0.05, 0] }), { p: [dx, 0, dz], r: [rx, 0, rz] })),
      mesh(G.extrude([[0, 0], [0.08, 0.6], [0.02, 1.4], [-0.05, 0.6]], 0.02), reed, { p: [0.1, 0, 0.1], r: [0, 0.6, -0.35] }),
      { p: [-1.2, 4.9, -0.6], r: [-0.25, 0, 0.22] },
    ),
  )

  // ---- hips ---------------------------------------------------------------------------
  c.on('Spine1', mesh(rb(3.1, 0.75, 1.9, 0.28), moss, { p: [0, 2.62, -0.02] }))
  c.on('Spine1', rep(6, (i) => mesh(G.cone(0.11, 0.55 + (i % 3) * 0.2, 6), i % 2 ? mossDk : stalkM, { p: [-1.0 + i * 0.4, 2.1 - (i % 3) * 0.1, 0.96], r: [PI + 0.08, 0, (i - 2.5) * 0.08], s: [1, 1, 0.4] })))
  c.on('Spine1', rep(2, (i) => spike(0.14, 0.4, spikeM, [i ? 0.3 : -0.3, 2.85, -0.96], [0, 0.3, -1])))
  // stubby tail
  c.on('Spine1', mesh(G.cone(0.4, 1.0, 12), moss, { p: [0, 2.4, -1.25], r: [-2.0, 0, 0] }))

  // ---- arms: bulky, webbed clawed hands -------------------------------------------
  const arm = (s) => {
    const x = s * 2.25
    const B1 = s > 0 ? 'ArmL1' : 'ArmR1'
    const B2 = s > 0 ? 'ArmL2' : 'ArmR2'
    c.on(B1, mesh(rb(1.45, 1.35, 1.8, 0.32), moss, { p: [x, 4.15, 0] }))
    c.on(B1, mesh(G.ico(0.55, 1), mossDk, { p: [x + s * 0.05, 4.82, 0], s: [1, 0.55, 1.15] }))
    c.on(B1, rep(2, (i) => spike(0.12, 0.38, spikeM, [x + s * 0.45, 4.85, -0.35 + i * 0.55], [s * 0.7, 1, 0])))
    c.on(B2, mesh(rb(1.58, 0.9, 1.88, 0.32), moss, { p: [x + s * 0.03, 3.12, 0.05] }))
    c.on(B2, mesh(G.ico(0.3, 1), mossLt, { p: [x + s * 0.72, 3.25, -0.2], s: [0.5, 1, 1] }))
    c.on(B2, drip(slime, [x + s * 0.3, 2.66, -0.6], 0.9))
    // palm, three webbed fingers along z, a thumb, claws
    c.on(B2, mesh(rb(1.2, 0.46, 1.3, 0.18), mossLt, { p: [x, 2.48, 0.1] }))
    c.on(B2, mesh(rb(0.05, 0.42, 1.05, 0.02), web, { p: [x, 2.12, 0.1], shadow: false }))
    for (let i = 0; i < 3; i++) {
      const z = -0.32 + i * 0.42
      c.on(B2, mesh(G.capsule(0.13, 0.32, 10), moss, { p: [x, 2.08, z] }))
      c.on(B2, spike(0.08, 0.26, claw, [x, 1.86, z], [-s * 0.15, -1, 0.1]))
    }
    c.on(B2, mesh(G.capsule(0.13, 0.28, 10), moss, { p: [x - s * 0.5, 2.38, 0.72], r: [0.6, 0, s * 0.6] }))
    c.on(B2, spike(0.07, 0.22, claw, [x - s * 0.64, 2.24, 0.88], [-s * 0.6, -1, 0.5]))
  }
  arm(1)
  arm(-1)

  // ---- legs: thick and short, big webbed feet ---------------------------------------
  const leg = (s) => {
    const x = s * 0.8
    const B1 = s > 0 ? 'LegL1' : 'LegR1'
    const B2 = s > 0 ? 'LegL2' : 'LegR2'
    c.on(B1, mesh(rb(1.58, 1.3, 1.86, 0.3), moss, { p: [x, 1.8, 0] }))
    c.on(B1, mesh(G.ico(0.3, 1), mossDk, { p: [x + s * 0.7, 1.9, 0.2], s: [0.45, 1, 1] }))
    c.on(B2, mesh(rb(1.48, 0.85, 1.76, 0.28), moss, { p: [x, 0.86, 0] }))
    c.on(B2, mesh(G.ico(0.28, 1), mossLt, { p: [x, 1.08, 0.82], s: [1, 0.8, 0.45] }))
    // foot: flat block, three long toes with webbing, claws
    c.on(B2, mesh(rb(1.5, 0.36, 1.55, 0.14), mossLt, { p: [x, 0.18, 0.25] }))
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 0.5
      c.on(B2, mesh(G.capsule(0.17, 0.5, 10), moss, { p: [x + dx, 0.17, 1.15], r: [PI / 2, (i - 1) * 0.25, 0] }))
      c.on(B2, spike(0.08, 0.26, claw, [x + dx * 1.25, 0.17, 1.55], [(i - 1) * 0.25, -0.2, 1]))
    }
    c.on(B2, both((t) => mesh(G.extrude([[0, 0], [t * 0.55, 0.0], [t * 0.62, 0.5], [0.0, 0.6]], 0.03), web, { p: [x, 0.08, 0.9], r: [PI / 2, 0, 0], shadow: false })))
  }
  leg(1)
  leg(-1)

  // a lily pad stuck on the right shoulder
  c.on('ArmR1', mesh(lilyGeo(0.5), lily, { p: [-2.3, 5.14, 0.2], r: [-PI / 2 + 0.2, 0, 0.3] }))
  c.on('ArmR1', drip(slime, [-2.55, 5.02, 0.62], 0.7))
}

// Thumbnail: arms hanging a bit wider (it is a big beast).
const deg = (d) => (d * PI) / 180
export const pose = {
  ArmL1: { x: deg(-8), z: deg(18) },
  ArmR1: { x: deg(-8), z: deg(-18) },
  ArmL2: { x: deg(-18) },
  ArmR2: { x: deg(-18) },
}

// Every part is merged per bone and material, so the whole costume is a few dozen
// draw calls (phones) while it is authored as many small pieces.
export function build(c) {
  const byBone = {}
  parts({ on: (bone, o) => ((byBone[bone] ??= new Group()).add(o), o) })
  for (const [bone, g] of Object.entries(byBone)) c.on(bone, bake(g, true))
}
