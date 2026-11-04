import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
} from 'three'
import { NEON, STUD } from './config.js'
import { RAPIER, addFixed } from './physics.js'
import { paintStuds, paintText, toTexture } from './textures.js'

// Shared building blocks for hand-built props: material shorthands, a mesh
// placer, fixed-collider helpers, neon (glowing) materials and outlined text sprites.

export const std = (color, extra) => new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...extra })
export const glow = (color, opacity = 0.85) => new MeshBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })

export function put(parent, geo, mat, x = 0, y = 0, z = 0, shadows = true) {
  const m = new Mesh(geo, mat)
  m.position.set(x, y, z)
  if (shadows) {
    m.castShadow = true
    m.receiveShadow = true
  }
  parent.add(m)
  return m
}

export const yawQuat = (yaw) => ({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) })
export function solidBox(hx, hy, hz, x, y, z, yaw = 0) {
  addFixed(RAPIER.ColliderDesc.cuboid(hx, hy, hz), { x, y, z }, yawQuat(yaw))
}
export function solidPole(radius, height, x, z) {
  addFixed(RAPIER.ColliderDesc.cylinder(height / 2, radius), { x, y: height / 2, z })
}

// --- Neon: unlit materials that glow ----------------------------------------------
// With bloom on, a neon material's colour is pushed to `k` times its base so
// it clears the bloom threshold (bloom measures luminance, so blues need a
// bigger k than greens to glow). With bloom off the same k would just tone-map
// to a washed-out white, so it is capped at NEON.plainMax. main.js flips this
// with the graphics preset via setNeonBloom.
const neonMats = new Set() // dropped again when a material is disposed
let neonBloom = false
function applyNeon(m) {
  const { base, k } = m.userData
  m.color.copy(base).multiplyScalar(neonBloom ? k : Math.min(k, NEON.plainMax))
}
// `extra` takes MeshBasicMaterial options (e.g. additive, transparent flames).
export function neon(color, k = NEON.k, extra = {}) {
  const m = new MeshBasicMaterial(extra)
  m.userData.base = new Color(color)
  m.userData.k = k
  applyNeon(m)
  neonMats.add(m)
  m.addEventListener('dispose', () => neonMats.delete(m))
  return m
}
export function setNeonBloom(on) {
  neonBloom = on
  for (const m of neonMats) applyNeon(m)
}

// --- Labels: outlined text sprites, repainted once Fredoka has loaded --------
export const fontReady = document.fonts?.load ? document.fonts.load('700 96px Fredoka').catch(() => null) : Promise.resolve()
export function label(text, height, opts) {
  const t = paintText(text, opts)
  const tex = new CanvasTexture(t.canvas)
  tex.colorSpace = SRGBColorSpace
  const sprite = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }))
  const fit = () => sprite.scale.set((height * t.canvas.width) / t.canvas.height, height, 1)
  fit()
  fontReady.then(() => {
    t.draw()
    tex.dispose() // the canvas may have changed size
    tex.needsUpdate = true
    fit()
  })
  return sprite
}

// --- Lego studs ------------------------------------------------------------------
// One shared stud texture; every studded surface tints it with its colour. Geometry
// gets UVs in stud tiles (studBox / planarUV), so the texture repeat stays 1 and any
// number of boxes can be baked together.
let studTex = null
function studTexture() {
  if (!studTex) studTex = toTexture(paintStuds(256, STUD.perTile), { srgb: true, anisotropy: 8 })
  return studTex
}
const studMats = new Map()
export function studMat(color) {
  let m = studMats.get(color)
  if (!m) studMats.set(color, (m = new MeshStandardMaterial({ color, map: studTexture(), roughness: 0.75, metalness: 0 })))
  return m
}
// A box whose UVs are in stud tiles on every face.
export function studBox(w, h, d) {
  const g = new BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  const t = STUD.tile
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]] // +x -x +y -y +z -z
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / t, (uv.getY(k) * dims[f][1]) / t)
    }
  }
  return g
}
// Top-down UVs in stud tiles (roofs, discs, anything seen mostly from above).
export function planarUV(geo) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / STUD.tile, pos.getZ(i) / STUD.tile)
  return geo
}
// A studded box, placed: centre at (x, y, z).
export const studPut = (parent, w, h, d, color, x, y, z) => put(parent, studBox(w, h, d), studMat(color), x, y, z)
