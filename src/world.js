import { BoxGeometry, Group, MeshStandardMaterial, PlaneGeometry } from 'three'
import { LOBBY } from './config.js'
import { RAPIER, addFixed } from './physics.js'
import { bake } from './bake.js'
import { neon, planarUV, put, solidBox, solidPole, std, studBox, studMat, studPut } from './propkit.js'
import { mulberry32 } from './textures.js'

// The lobby terrain: a green lego-stud baseplate boxed in by tall brick walls
// with a green cap. The spawn plaza is the wide square at the south end; the
// North Lane is the narrower corridor running toward -Z, with the road down
// its middle and, on each side, a pale curb, a grass verge with street lamps
// and blocky trees, and the white sidewalk the house paths lead to.
//
// Everything here is static, so it is built from many small meshes and then
// baked to one mesh per material (bake.js).

const C = LOBBY.colors

// Distances out from the road centre line (x = 0).
export function laneEdges() {
  const road = LOBBY.roadHalf
  const curb = road + LOBBY.curb
  const verge = curb + LOBBY.verge
  const walk = verge + LOBBY.sidewalk
  return { road, curb, verge, walk }
}

// A flat studded rectangle of ground at height y (x0..x1, z0..z1).
function groundRect(root, mat, x0, x1, z0, z1, y = 0) {
  const g = new PlaneGeometry(x1 - x0, z1 - z0)
  g.rotateX(-Math.PI / 2)
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2)
  planarUV(g)
  const m = put(root, g, mat, 0, 0, 0, false)
  m.receiveShadow = true
  return m
}

// A slab (thin studded box) whose top sits at `top`, spanning x0..x1, z0..z1.
function slab(root, color, x0, x1, z0, z1, top, thick = 0.3) {
  studPut(root, x1 - x0, thick, z1 - z0, color, (x0 + x1) / 2, top - thick / 2, (z0 + z1) / 2)
}

// A brick wall segment with its green cap, plus its collider.
function wall(root, x0, x1, z0, z1) {
  const { height: H, cap } = LOBBY.wall
  const w = x1 - x0
  const d = z1 - z0
  studPut(root, w, H - cap, d, C.brick, (x0 + x1) / 2, (H - cap) / 2, (z0 + z1) / 2)
  studPut(root, w + 0.6, cap, d + 0.6, C.wallCap, (x0 + x1) / 2, H - cap / 2, (z0 + z1) / 2)
  solidBox(w / 2, H / 2, d / 2, (x0 + x1) / 2, H / 2, (z0 + z1) / 2)
}

// Street lamp: dark post with an arm reaching over the road and a glowing lamp.
const lampGlow = neon(C.lampLight, 1.6)
function lamp(root, x, z) {
  const dir = -Math.sign(x) // the arm points toward the road
  const g = new Group()
  studPut(g, 0.8, 0.5, 0.8, C.lampPost, 0, 0.25, 0)
  put(g, new BoxGeometry(0.34, 7.6, 0.34), std(C.lampPost), 0, 3.8, 0)
  put(g, new BoxGeometry(2.4, 0.26, 0.26), std(C.lampPost), dir * 1.1, 7.5, 0)
  put(g, new BoxGeometry(1.2, 0.36, 0.7), std(C.lampPost), dir * 2.2, 7.36, 0)
  put(g, new BoxGeometry(0.9, 0.08, 0.5), lampGlow, dir * 2.2, 7.15, 0, false)
  g.position.set(x, 0, z)
  root.add(g)
  solidPole(0.3, 7.6, x, z)
}

// Blocky tree: brown trunk under a cluster of studded green bricks.
function tree(root, x, z, rand) {
  const g = new Group()
  const leaf = () => C.leaves[Math.floor(rand() * C.leaves.length)]
  const h = 3.6 + rand() * 1.4
  studPut(g, 0.9, h, 0.9, C.trunk, 0, h / 2, 0)
  studPut(g, 4.2, 2.4, 4.2, leaf(), 0, h + 0.9, 0)
  studPut(g, 3.0, 1.8, 3.0, leaf(), 0.2, h + 2.9, -0.2)
  studPut(g, 1.8, 1.4, 1.8, leaf(), -0.3, h + 4.4, 0.2)
  studPut(g, 2.0, 1.6, 2.0, leaf(), 2.2, h + 0.6, 0.8)
  studPut(g, 1.8, 1.4, 1.8, leaf(), -2.1, h + 1.1, -0.9)
  g.rotation.y = Math.floor(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.2
  g.position.set(x, 0, z)
  root.add(g)
  solidPole(0.5, h, x, z)
}

// Little lego bush (one or two stacked bricks).
function bush(root, x, z, rand) {
  const s = 0.9 + rand() * 0.7
  studPut(root, s * 1.6, s, s * 1.2, C.bush, x, s / 2, z)
  if (rand() > 0.5) studPut(root, s, s * 0.7, s * 0.8, C.leaves[0], x + 0.2, s + s * 0.35, z)
}

// Planter with red flowers.
function flowers(root, x, z) {
  studPut(root, 2.4, 0.4, 1.2, C.planter, x, 0.2, z)
  for (let i = 0; i < 4; i++) studPut(root, 0.4, 0.4, 0.4, C.flower, x - 0.9 + i * 0.6, 0.6, z + (i % 2 ? 0.25 : -0.25))
}

export function buildWorld(scene) {
  const root = new Group()
  const { plazaHalf: PH, plazaNorth: PN, plazaSouth: PS, laneHalf: LH, laneEnd: LE, roadStart } = LOBBY
  const T = LOBBY.wall.thickness
  const e = laneEdges()
  const grass = studMat(C.grass)

  // --- Baseplate -----------------------------------------------------------------
  groundRect(root, grass, -PH, PH, PN, PS)
  groundRect(root, grass, -LH, LH, LE, PN)
  // One collider for the whole floor (top at y = 0).
  addFixed(RAPIER.ColliderDesc.cuboid(PH + T, 1, (PS - LE) / 2 + T), { x: 0, y: -1, z: (PS + LE) / 2 }, null, { friction: 0.9 })

  // --- Walls -------------------------------------------------------------------------
  for (const s of [-1, 1]) {
    const lane = [s * LH, s * (LH + T)].sort((a, b) => a - b)
    wall(root, lane[0], lane[1], LE - T, PN) // corridor side walls
    const step = [s * LH, s * (PH + T)].sort((a, b) => a - b)
    wall(root, step[0], step[1], PN - T, PN) // where the plaza narrows into the lane
    const side = [s * PH, s * (PH + T)].sort((a, b) => a - b)
    wall(root, side[0], side[1], PN - T, PS + T) // plaza side walls
  }
  wall(root, -PH - T, PH + T, PS, PS + T) // south
  wall(root, -LH - T, LH + T, LE - T, LE) // north end of the lane

  // --- Road ------------------------------------------------------------------------------
  const roadLen = roadStart - LE
  const roadZ = (roadStart + LE) / 2
  put(root, new BoxGeometry(e.road * 2, 0.2, roadLen), new MeshStandardMaterial({ color: C.road, roughness: 0.9 }), 0, -0.05, roadZ, false).receiveShadow = true
  // White edge lines and the yellow dashed centre line.
  const line = std(C.roadLine, { roughness: 0.8 })
  for (const s of [-1, 1]) put(root, new BoxGeometry(0.3, 0.06, roadLen), line, s * (e.road - 0.6), 0.07, roadZ, false)
  const dash = std(C.roadDash, { roughness: 0.8 })
  for (let z = roadStart - 4; z > LE + 3; z -= 7) put(root, new BoxGeometry(0.32, 0.06, 3.2), dash, 0, 0.07, z, false)

  // --- Curbs, verges, sidewalks ------------------------------------------------------
  for (const s of [-1, 1]) {
    const span = (a, b) => [s * a, s * b].sort((p, q) => p - q)
    const [c0, c1] = span(e.road, e.curb)
    slab(root, C.curb, c0, c1, LE, roadStart, 0.18)
    const [w0, w1] = span(e.verge, e.walk)
    slab(root, C.sidewalk, w0, w1, LE, PN, 0.12)
  }

  // Street lamps on both verges, trees and bushes staggered between them.
  const rand = mulberry32(77)
  for (let z = PN - 6, i = 0; z > LE + 8; z -= LOBBY.lampEvery, i++) {
    for (const s of [-1, 1]) {
      lamp(root, s * (e.curb + 1.1), z)
      bush(root, s * (e.curb + 2.4), z + 1.6, rand)
      const tz = z - LOBBY.lampEvery / 2
      if (tz > LE + 8) tree(root, s * (e.curb + 3.9), tz, rand)
      if (i % 2 === 0) flowers(root, s * (e.verge - 1.2), z - 6)
    }
  }

  const baked = bake(root, true)
  baked.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true
  })
  scene.add(baked)
  return baked
}
