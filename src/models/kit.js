// Shared modelling kit for the hand-built costume and item models (costumes/, items/).
// Everything is procedural: primitives, lathes, extrusions, tubes and small canvas
// textures. Materials and geometries are cached so 100+ models stay cheap.
//
//   import { M, G, mesh, grp, tex } from '../models/kit.js'
//   const g = grp(
//     mesh(G.rbox(1, 0.6, 0.6, 0.08), M('#c0392b'), { p: [0, 0.3, 0] }),
//     mesh(G.cyl(0.1, 0.1, 0.4), M('#222', { metal: 0.8, rough: 0.3 }), { p: [0.4, 0.7, 0], r: [0, 0, Math.PI / 2] }),
//   )
//
// Units are free for items (thumbnails auto-fit); costumes use rig units (see costumes/rig.js).
import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// --- Materials ----------------------------------------------------------------------------
// M(color, { rough, metal, emissive, glow (emissive intensity), opacity, map, side, flat })
const mats = new Map()
export function M(color, o = {}) {
  const key = o.map ? null : `${color}|${o.rough ?? 0.6}|${o.metal ?? 0}|${o.emissive ?? ''}|${o.glow ?? 1}|${o.opacity ?? 1}|${o.side ?? 0}|${o.flat ? 1 : 0}`
  if (key && mats.has(key)) return mats.get(key)
  const m = new MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.6,
    metalness: o.metal ?? 0,
    map: o.map ?? null,
    flatShading: !!o.flat,
    side: o.side === 2 ? DoubleSide : o.side ?? 0,
  })
  if (o.emissive) {
    m.emissive.set(o.emissive)
    m.emissiveIntensity = o.glow ?? 1
  }
  if (o.opacity != null && o.opacity < 1) {
    m.transparent = true
    m.opacity = o.opacity
    m.depthWrite = o.opacity > 0.6
  }
  if (key) mats.set(key, m)
  return m
}

// --- Geometry -----------------------------------------------------------------------------
const geos = new Map()
const cache = (key, make) => geos.get(key) ?? geos.set(key, make()).get(key)
const k = (...a) => a.map((n) => (typeof n === 'number' ? +n.toFixed(4) : String(n))).join(',')

export const G = {
  box: (w, h, d) => cache(k('b', w, h, d), () => new BoxGeometry(w, h, d)),
  // Rounded box: r = corner radius (keep it under half the smallest side).
  rbox: (w, h, d, r = 0.05, seg = 3) => cache(k('rb', w, h, d, r, seg), () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3))),
  cyl: (rt, rb, h, seg = 20, open = false) => cache(k('c', rt, rb, h, seg, open), () => new CylinderGeometry(rt, rb, h, seg, 1, open)),
  cone: (r, h, seg = 20) => cache(k('co', r, h, seg), () => new ConeGeometry(r, h, seg)),
  sphere: (r, ws = 24, hs = 16) => cache(k('s', r, ws, hs), () => new SphereGeometry(r, ws, hs)),
  // Part of a sphere: phi = around (0..2PI), theta = from the top (0..PI).
  dome: (r, thetaLen = Math.PI / 2, ws = 24, hs = 12) => cache(k('d', r, thetaLen, ws, hs), () => new SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, thetaLen)),
  ico: (r, detail = 0) => cache(k('i', r, detail), () => new IcosahedronGeometry(r, detail)),
  torus: (r, tube, arc = Math.PI * 2, rs = 10, ts = 28) => cache(k('t', r, tube, arc, rs, ts), () => new TorusGeometry(r, tube, rs, ts, arc)),
  capsule: (r, len, seg = 12) => cache(k('ca', r, len, seg), () => new CapsuleGeometry(r, len, 4, seg)),
  plane: (w, h) => cache(k('p', w, h), () => new PlaneGeometry(w, h)),
  // Lathe around Y from [[radius, y], ...] (bottom to top).
  lathe: (pts, seg = 28) => cache(k('l', JSON.stringify(pts), seg), () => new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), seg)),
  // Extrude a 2D outline [[x, y], ...] (in the XY plane) by `depth` along +Z, centred on z.
  extrude: (pts, depth, bevel = 0) =>
    cache(k('e', JSON.stringify(pts), depth, bevel), () => {
      const s = new Shape(pts.map(([x, y]) => new Vector2(x, y)))
      const g = new ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 12 })
      g.translate(0, 0, -depth / 2)
      return g
    }),
  // Smooth tube through 3D points [[x, y, z], ...].
  tube: (pts, r, seg = 32, closed = false) => cache(k('tu', JSON.stringify(pts), r, seg, closed), () => new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(...p)), closed), seg, r, 8, closed)),
}

// --- Meshes -------------------------------------------------------------------------------
// opts: p = [x, y, z], r = [x, y, z] radians (XYZ order), s = number | [x, y, z], shadow = true.
export function mesh(geo, mat, o = {}) {
  const m = new Mesh(geo, mat)
  if (o.p) m.position.set(...o.p)
  if (o.r) m.rotation.set(...o.r)
  if (o.s != null) Array.isArray(o.s) ? m.scale.set(...o.s) : m.scale.setScalar(o.s)
  m.castShadow = o.shadow !== false
  m.receiveShadow = o.shadow !== false
  return m
}

// Group of children, with the same p / r / s options as mesh().
export function grp(...children) {
  let o = {}
  if (children.length && !children[children.length - 1]?.isObject3D) o = children.pop()
  const g = new Group()
  for (const c of children) if (c) g.add(c)
  if (o.p) g.position.set(...o.p)
  if (o.r) g.rotation.set(...o.r)
  if (o.s != null) Array.isArray(o.s) ? g.scale.set(...o.s) : g.scale.setScalar(o.s)
  return g
}

// Mirror a builder to both sides: fn(sign) with sign = 1 (+X) then -1 (-X).
export const both = (fn) => grp(fn(1), fn(-1))

// Repeat: fn(i) for i in 0..n-1, grouped.
export const rep = (n, fn) => grp(...Array.from({ length: n }, (_, i) => fn(i)))

// --- Canvas textures ------------------------------------------------------------------------
// tex(key, w, h, (ctx, w, h) => { ... }, { repeat: [u, v] }) - painted once per key.
const texs = new Map()
export function tex(key, w, h, paint, o = {}) {
  if (texs.has(key)) return texs.get(key)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d'), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  if (o.repeat) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(...o.repeat)
  }
  texs.set(key, t)
  return t
}

// A flat decal (face, logo, label) as a textured plane: w x h, facing +Z.
export function decal(texture, w, h, o = {}) {
  const m = new MeshStandardMaterial({ map: texture, transparent: true, roughness: o.rough ?? 0.7, metalness: 0, emissive: o.emissive ? 0xffffff : 0x000000, emissiveMap: o.emissive ? texture : null, emissiveIntensity: o.glow ?? 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  return mesh(G.plane(w, h), m, { ...o, shadow: false })
}
