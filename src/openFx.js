// The burst when you open a package in your base, scaled by the item's rarity
// (BASE_FLOOR.fx level, see config):
//   0  cardboard bits + a puff of sparkles in the rarity colour
//   1  + a sparkle fountain that keeps rising and a ground shockwave ring
//   2  + a light pillar standing on the spot, more and bigger sparkles
//   3  + a second, wider spinning pillar, a double ring and a coloured screen flash
// Everything is additive / unlit and lives a couple of seconds; nothing allocates per frame
// except at the burst itself.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  RingGeometry,
  SRGBColorSpace,
} from 'three'
import { paintSoftDot, paintSparkle } from './textures.js'

const tex = (canvas) => {
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  return t
}
let sparkTex = null
let dotTex = null
let beamTex = null
// Vertical fade for the pillars: bright at the bottom, gone at the top.
function paintBeam() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 128, 0, 0)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 128)
  return c
}

const ringGeo = new RingGeometry(0.8, 1, 48)
ringGeo.rotateX(-Math.PI / 2)

export function createOpenFx(scene) {
  const live = [] // { t, life, update(k, dt), dispose() }
  sparkTex ??= tex(paintSparkle(64))
  dotTex ??= tex(paintSoftDot(32))
  beamTex ??= tex(paintBeam())

  // n particles from (x, y, z): speed range, gravity, size, colour, life.
  function particles(x, y, z, o) {
    const n = o.n
    const pos = new Float32Array(n * 3)
    const vel = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const up = o.up[0] + Math.random() * (o.up[1] - o.up[0])
      const out = o.out[0] + Math.random() * (o.out[1] - o.out[0])
      pos.set([x + (Math.random() - 0.5) * 0.4, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.4], i * 3)
      vel.set([Math.cos(a) * out, up, Math.sin(a) * out], i * 3)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    const mat = new PointsMaterial({
      map: o.additive ? sparkTex : dotTex,
      color: o.color,
      size: o.size,
      transparent: true,
      depthWrite: false,
      ...(o.additive ? { blending: AdditiveBlending } : {}),
    })
    const pts = new Points(geo, mat)
    pts.frustumCulled = false
    pts.visible = !o.delay
    scene.add(pts)
    live.push({
      t: -(o.delay ?? 0),
      life: o.life,
      update(k, dt) {
        pts.visible = true
        const p = geo.attributes.position.array
        const drag = Math.exp(-o.drag * dt)
        for (let i = 0; i < n; i++) {
          const j = i * 3
          vel[j] *= drag
          vel[j + 2] *= drag
          vel[j + 1] = vel[j + 1] * drag - o.gravity * dt
          p[j] += vel[j] * dt
          p[j + 1] = Math.max(y - 0.1, p[j + 1] + vel[j + 1] * dt)
          p[j + 2] += vel[j + 2] * dt
        }
        geo.attributes.position.needsUpdate = true
        mat.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3
        mat.size = o.size * (o.additive ? 0.8 + 0.4 * Math.sin(k * 30) ** 2 : 1)
      },
      dispose() {
        scene.remove(pts)
        geo.dispose()
        mat.dispose()
      },
    })
  }

  function ring(x, y, z, color, size, life, delay = 0) {
    const mat = new MeshBasicMaterial({ color, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })
    const m = new Mesh(ringGeo, mat)
    m.position.set(x, y + 0.05, z)
    m.visible = false
    scene.add(m)
    live.push({
      t: -delay,
      life,
      update(k) {
        m.visible = true
        m.scale.setScalar(0.3 + size * (1 - (1 - k) ** 3))
        mat.opacity = 1 - k
      },
      dispose() {
        scene.remove(m)
        mat.dispose()
      },
    })
  }

  function pillar(x, y, z, color, radius, height, life, spin = 0) {
    const geo = new CylinderGeometry(radius, radius * 0.7, height, 24, 1, true)
    geo.translate(0, height / 2, 0)
    const mat = new MeshBasicMaterial({ color, map: beamTex, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })
    const m = new Mesh(geo, mat)
    m.position.set(x, y, z)
    scene.add(m)
    live.push({
      t: 0,
      life,
      update(k, dt) {
        const grow = Math.min(1, k / 0.12)
        m.scale.set(1 + 0.15 * Math.sin(k * 20), grow, 1 + 0.15 * Math.sin(k * 20))
        m.rotation.y += spin * dt
        mat.opacity = (k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25) * 0.85
      },
      dispose() {
        scene.remove(m)
        geo.dispose()
        mat.dispose()
      },
    })
  }

  let flashEl = null
  function flash(color) {
    flashEl ??= Object.assign(document.createElement('div'), { className: 'fx-flash' })
    if (!flashEl.isConnected) document.body.append(flashEl)
    flashEl.style.setProperty('--fc', color)
    flashEl.classList.remove('on')
    void flashEl.offsetWidth
    flashEl.classList.add('on')
  }

  return {
    // World point (the package's floor centre), rarity colour, level 0..3.
    burst(x, y, z, color, level) {
      const c = new Color(color)
      const white = new Color('#ffffff').lerp(c, 0.35)
      particles(x, y + 0.4, z, { n: 26, up: [2, 5], out: [1.2, 3], gravity: 14, drag: 1.5, size: 0.2, color: '#b98a52', life: 1.1 })
      particles(x, y + 0.5, z, { n: 24 + level * 30, up: [1.5, 4 + level], out: [1, 2.5 + level * 0.6], gravity: 3, drag: 2, size: 0.35 + level * 0.06, color: c, life: 1.2 + level * 0.3, additive: true })
      ring(x, y, z, c, 2.2 + level * 0.8, 0.7)
      if (level >= 1) {
        particles(x, y + 0.3, z, { n: 40 + level * 30, up: [4, 7 + level * 1.5], out: [0.2, 1], gravity: 2.5, drag: 0.8, size: 0.3, color: white, life: 1.8 + level * 0.3, additive: true, delay: 0.1 })
        ring(x, y, z, white, 3 + level, 0.9, 0.12)
      }
      if (level >= 2) pillar(x, y, z, c, 0.75, 14, 2.2 + level * 0.3)
      if (level >= 3) {
        pillar(x, y, z, white, 1.4, 20, 3, 2)
        ring(x, y, z, c, 7, 1.2, 0.3)
        particles(x, y + 1, z, { n: 120, up: [3, 9], out: [3, 6], gravity: 4, drag: 1, size: 0.45, color: c, life: 2.6, additive: true, delay: 0.25 })
        flash(color)
      }
    },
    update(dt) {
      for (let i = live.length - 1; i >= 0; i--) {
        const f = live[i]
        f.t += dt
        if (f.t < 0) continue
        const k = Math.min(1, f.t / f.life)
        f.update(k, dt)
        if (k >= 1) {
          f.dispose()
          live.splice(i, 1)
        }
      }
    },
  }
}
