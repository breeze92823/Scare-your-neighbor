// Card art for the shops and the Index: each costume, aura figure and item model is
// rendered once to a small transparent PNG (object URL) by an offscreen renderer of
// its own, then reused by every <img>. Renders are queued one per frame so opening a
// window never stalls the game, and the renderer is dropped again after a few idle
// seconds (one less WebGL context on phones).
//
//   thumb(key, () => object3D, { yaw, pitch, fit, size, ink }) -> Promise<{ url, ink }>
// `ink` (a colour) also makes a silhouette version: the same alpha, filled flat.
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { THUMBS } from './config.js'

let renderer = null
let scene = null
let camera = null
let envTex = null
let idleTimer = 0

function setup() {
  if (renderer) return
  renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)
  scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.environment = envTex
  scene.environmentIntensity = 0.55
  scene.add(new HemisphereLight(0xffffff, 0x50586a, 1.2))
  const key = new DirectionalLight(0xffffff, 2.4)
  key.position.set(-3, 5, 6)
  const rim = new DirectionalLight(0xdfe8ff, 1.4)
  rim.position.set(4, 3, -5)
  scene.add(key, rim)
  camera = new PerspectiveCamera(THUMBS.fov, 1, 0.01, 500)
}

function teardown() {
  if (!renderer) return
  envTex?.dispose()
  renderer.dispose()
  renderer.forceContextLoss?.()
  renderer = scene = camera = envTex = null
}

const box = new Box3()
const sphere = new Sphere()
const dir = new Vector3()

// fit: 'auto' frames the object's bounds; or { target: [x, y, z], dist } for a fixed
// framing (costumes: every character the same size on its card).
function draw(obj, o) {
  const w = o.w ?? o.size ?? THUMBS.size
  const h = o.h ?? o.size ?? THUMBS.size
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.fov = o.fov ?? THUMBS.fov
  camera.updateProjectionMatrix()
  scene.add(obj)
  obj.updateMatrixWorld(true)
  const yaw = o.yaw ?? THUMBS.yaw
  const pitch = o.pitch ?? THUMBS.pitch
  dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
  let target
  let dist
  if (o.fit && o.fit !== 'auto') {
    target = new Vector3(...o.fit.target)
    dist = o.fit.dist
  } else {
    box.setFromObject(obj, true)
    box.getBoundingSphere(sphere)
    target = sphere.center
    const half = ((camera.fov * Math.PI) / 360) * Math.min(1, camera.aspect)
    dist = (sphere.radius * (o.margin ?? THUMBS.margin)) / Math.sin(half)
  }
  camera.position.copy(target).addScaledVector(dir, dist)
  camera.lookAt(target)
  renderer.render(scene, camera)
  scene.remove(obj)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d').drawImage(renderer.domElement, 0, 0)
  return c
}

function toUrl(canvas) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ? URL.createObjectURL(b) : canvas.toDataURL()), 'image/png'))
}

function silhouette(src, color) {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const x = c.getContext('2d')
  x.drawImage(src, 0, 0)
  x.globalCompositeOperation = 'source-in'
  x.fillStyle = color
  x.fillRect(0, 0, c.width, c.height)
  return c
}

// Next job on the next frame, or after 60 ms when no frames come (a hidden or throttled
// tab), so the queue never stalls.
function later(fn) {
  let fired = false
  const go = () => {
    if (fired) return
    fired = true
    fn()
  }
  requestAnimationFrame(go)
  setTimeout(go, 60)
}

const done = new Map() // key -> Promise<{ url, ink }>
const queue = []
let pumping = false

function pump() {
  if (!queue.length) {
    pumping = false
    clearTimeout(idleTimer)
    idleTimer = setTimeout(teardown, THUMBS.idleMs)
    return
  }
  pumping = true
  const job = queue.shift()
  Promise.resolve()
    .then(job.make)
    .then(async (obj) => {
      setup()
      const canvas = draw(obj, job.o)
      job.o.dispose?.(obj)
      const out = { url: await toUrl(canvas), ink: null }
      if (job.o.ink) out.ink = await toUrl(silhouette(canvas, job.o.ink))
      job.resolve(out)
    })
    .catch((err) => {
      console.warn('[thumbs] failed', job.key, err)
      job.resolve({ url: '', ink: '' })
    })
    .finally(() => later(pump))
}

export function thumb(key, make, o = {}) {
  if (done.has(key)) return done.get(key)
  const p = new Promise((resolve) => queue.push({ key, make, o, resolve }))
  done.set(key, p)
  clearTimeout(idleTimer)
  if (!pumping) {
    pumping = true
    later(pump)
  }
  return p
}

// Front of the queue: what the player is looking at right now renders first.
export function prioritize(keys) {
  const set = new Set(keys)
  queue.sort((a, b) => (set.has(b.key) ? 1 : 0) - (set.has(a.key) ? 1 : 0))
}

// Sets an <img> to a thumb once it is ready (silhouette when `dark`).
export function fillImg(img, p, dark = false) {
  p.then((t) => {
    const src = dark ? t.ink : t.url
    if (src && img.isConnected !== false) img.src = src
  })
}

// Dev helper: a contact sheet of thumbs over the game, e.g. __game.thumbSheet('costume').
export function showSheet(entries, bg = '#2b2f3c') {
  document.getElementById('thumb-sheet')?.remove()
  const d = document.createElement('div')
  d.id = 'thumb-sheet'
  d.style.cssText = `position:fixed;inset:0;z-index:999;overflow:auto;background:${bg};display:flex;flex-wrap:wrap;gap:6px;padding:8px;align-content:flex-start;font:12px sans-serif;color:#fff`
  d.addEventListener('pointerdown', (e) => e.target === d && d.remove())
  for (const [label, p] of entries) {
    const cell = document.createElement('div')
    cell.style.cssText = 'width:180px;text-align:center'
    const img = document.createElement('img')
    img.style.cssText = 'width:180px;height:180px;object-fit:contain;background:#ffffff14;border-radius:6px'
    fillImg(img, p)
    cell.append(img, document.createTextNode(label))
    d.append(cell)
  }
  document.body.append(d)
  return d
}
