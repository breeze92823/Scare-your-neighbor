// What happens on your own plot (BASES.mine), after the reference screenshots:
//   placing  - standing on your plot with a package in hand, click (tap) the floor: it is
//              tossed there (a green / red ghost under the cursor shows where it fits).
//   breaking - minions (base.minions(): 1 at base level 1) walk out of the Minions hut,
//              stand beside a package and punch it ("-1" pops, the box shudders) until its
//              HP bar ("11 / 11") is empty. Then it waits: "READY!".
//   opening  - E (or tap the "Package / Open" prompt) next to a broken package opens it with
//              an effect that grows with the item's rarity (openFx.js, sfx.reveal), and the
//              item rises out and stands where the package was.
//   items    - every item on the floor earns (rarity / name / "$N/s" tag, "+$N" each
//              second). E next to one picks it up into your hotbar; E with it in hand puts
//              it down in front of you.
// Also the live labels over the plot: "⛏ 1/s" on the Minions hut, "2/7" (items on the
// floor / slots) over the Upgrade Base sign. The store is base.js; this file draws.
import './baseFloor.css'
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Plane, Raycaster, RingGeometry, Vector2, Vector3 } from 'three'
import { BASE_FLOOR as F, BASES, RARITY } from './config.js'
import { packageModel } from './carry.js'
import { itemModel } from './items/index.js'
import { createOpenFx } from './openFx.js'
import { isLocked } from './input.js'
import { std } from './propkit.js'
import { formatMoney } from './state.js'
import { at, sfx } from './audio/index.js'

const FLOOR_Y = 0.16 // top of the plot's studded floor
const W = BASES.width
const D = BASES.depth
const mats = new Map()
const mat = (c) => mats.get(c) ?? mats.set(c, std(c, { roughness: 0.7 })).get(c)
const isTouch = () => document.body.classList.contains('touch-ui')

// A small blocky worker in a hard hat, feet at y = 0, facing +Z. ~1.55 m tall.
function minionModel() {
  const c = F.minion
  const g = new Group()
  const box = (w, h, d, color, parent, x, y, z) => {
    const m = new Mesh(new BoxGeometry(w, h, d), mat(color))
    m.position.set(x, y, z)
    m.castShadow = true
    parent.add(m)
    return m
  }
  const pivot = (x, y) => {
    const p = new Group()
    p.position.set(x, y, 0)
    g.add(p)
    return p
  }
  const legs = [-1, 1].map((s) => {
    const hip = pivot(s * 0.13, 0.52)
    box(0.23, 0.44, 0.25, c.pants, hip, 0, -0.24, 0)
    box(0.25, 0.1, 0.32, c.shoe, hip, 0, -0.47, 0.03)
    return hip
  })
  box(0.52, 0.5, 0.3, c.shirt, g, 0, 0.78, 0)
  box(0.53, 0.08, 0.31, c.pants, g, 0, 0.56, 0) // belt line
  box(0.3, 0.2, 0.02, c.pants, g, 0, 0.9, 0.16) // bib pocket
  const arms = [-1, 1].map((s) => {
    const sh = pivot(s * 0.35, 0.98)
    box(0.18, 0.4, 0.2, c.shirt, sh, 0, -0.16, 0)
    box(0.17, 0.12, 0.19, c.skin, sh, 0, -0.42, 0) // fist
    return sh
  })
  box(0.42, 0.4, 0.4, c.skin, g, 0, 1.24, 0)
  for (const s of [-1, 1]) box(0.07, 0.1, 0.02, '#1d1f26', g, s * 0.1, 1.27, 0.205)
  box(0.18, 0.04, 0.02, '#1d1f26', g, 0, 1.15, 0.205) // grin
  box(0.48, 0.14, 0.48, c.hat, g, 0, 1.5, 0)
  box(0.5, 0.04, 0.62, c.hat, g, 0, 1.44, 0.05) // brim
  return { obj: g, legs, arms }
}

// Scale an item model so its largest side is `h` and stand it centred on y = 0.
// Returns its height after scaling.
function fit(model, h) {
  const box = new Box3().setFromObject(model)
  const size = box.getSize(new Vector3())
  const k = h / Math.max(size.x, size.y, size.z, 1e-3)
  model.scale.multiplyScalar(k)
  const centre = box.getCenter(new Vector3())
  model.position.set(-centre.x * k, -box.min.y * k, -centre.z * k)
  model.traverse((o) => {
    if (o.isMesh) o.castShadow = true
  })
  return size.y * k
}

const ease = (t) => 1 - (1 - t) * (1 - t)
const rarityRank = (r) => F.fx[r] ?? 0

// deps: { carry, camera, canvas, isStunned }
export function createBaseFloor(scene, base, ui, deps) {
  const { carry, camera, canvas } = deps
  const plotCfg = BASES.plots[BASES.mine]
  const L = BASES.layout
  const plot = new Group() // plot-local space: +Z = the open front
  plot.position.set(plotCfg.x, FLOOR_Y, plotCfg.z)
  plot.rotation.y = plotCfg.yaw
  scene.add(plot)
  plot.updateMatrixWorld(true)
  const fx = createOpenFx(scene)
  const tmp = new Vector3()
  const world = (x, y, z, out = tmp) => plot.localToWorld(out.set(x, y, z))
  const sound = (x, z) => {
    world(x, 0, z)
    return at(tmp.x, tmp.z)
  }

  // --- Floor rules -------------------------------------------------------------------------
  // Can something stand at plot-local (x, z)? `ignore` = an entry id to skip.
  function fits(x, z, ignore = null) {
    if (Math.abs(x) > W / 2 - F.edge || Math.abs(z) > D / 2 - F.edge) return false
    if (x < -7.6 && z < -6.2) return false // the Minions hut and its door
    if (Math.abs(x + 3) < 2.7 && Math.abs(z - 6) < 1.7) return false // the offline-money pile
    for (const p of base.packages) if (p.id !== ignore && Math.hypot(p.x - x, p.z - z) < F.clearance) return false
    for (const it of base.items) if (it.active && it.id !== ignore && Math.hypot(it.x - x, it.z - z) < F.clearance) return false
    return true
  }
  base.setSpotFinder((it) => F.itemSpots.find(([x, z]) => fits(x, z, it.id)) ?? null)

  // --- Floating numbers ("-1" on a punch, "+$18" on a payout) ----------------------------
  const pops = []
  function pop(kind, text, x, y, z, size) {
    let a = pops.find((p) => p.life <= 0 && p.kind === kind)
    if (!a) {
      a = { kind, anchor: ui.anchor(kind, size), life: 0 }
      pops.push(a)
    }
    a.anchor.set(text).show(true)
    world(x, y, z, a.anchor.pos)
    a.life = kind === 'dmg' ? 0.75 : 1.1
    const e = a.anchor.el
    e.style.animation = 'none'
    void e.offsetWidth
    e.style.animation = ''
  }

  // --- Packages on the floor ---------------------------------------------------------------
  const placed = new Map() // package id -> entry
  const dropFrom = new Vector3()
  let dropPending = false
  const revealing = new Map() // item id -> fx level, for items that just came out of a package

  function paintTag(e) {
    const { hp, maxHp } = e.pkg
    if (e.shownHp === hp) return
    e.shownHp = hp
    e.tag.el.classList.toggle('ready', hp === 0)
    e.fill.style.width = `${(100 * hp) / maxHp}%`
    e.count.textContent = hp === 0 ? 'READY!' : `${hp} / ${maxHp}`
  }

  function place(pkg) {
    const obj = packageModel(pkg.tier.pkg.kind)
    plot.add(obj)
    const tag = ui.anchor('pkghp', 0.42)
    tag.el.innerHTML = '<div class="pk-name">Package</div><div class="pk-bar"><i></i><span></span></div>'
    const e = { pkg, obj, tag, fill: tag.el.querySelector('i'), count: tag.el.querySelector('span'), shownHp: -1, shake: 0, minions: 0, opening: -1, landed: true, t: 0, from: null, bob: Math.random() * 6 }
    paintTag(e)
    if (dropPending) {
      // Tossed out of your hands in a short arc from where you stand.
      e.from = plot.worldToLocal(dropFrom.clone())
      e.landed = false
      dropPending = false
    }
    obj.position.set(e.from?.x ?? pkg.x, e.from ? e.from.y : 0, e.from?.z ?? pkg.z)
    placed.set(pkg.id, e)
  }

  function syncPackages() {
    const live = new Set(base.packages.map((p) => p.id))
    for (const [id, e] of placed) {
      if (live.has(id) || e.opening >= 0) continue
      // Opened (E here, or Break in the Packages panel): it bursts, the item comes out.
      e.opening = 0
      e.tag.remove()
      const item = base.items.findLast((it) => it.x === e.pkg.x && it.z === e.pkg.z)
      sfx.packageOpen(sound(e.pkg.x, e.pkg.z))
      if (item) {
        const level = rarityRank(item.rarity)
        revealing.set(item.id, level)
        world(e.pkg.x, 0, e.pkg.z)
        fx.burst(tmp.x, tmp.y, tmp.z, RARITY[item.rarity].text, level)
        sfx.reveal(level, sound(e.pkg.x, e.pkg.z))
      }
    }
    for (const pkg of base.packages) if (!placed.has(pkg.id)) place(pkg)
  }

  function landed(e, res) {
    if (!res) return
    sfx.packageHit(sound(e.pkg.x, e.pkg.z))
    pop('dmg', `-${F.damage}`, e.pkg.x + (Math.random() - 0.5) * 0.6, 1.25, e.pkg.z + (Math.random() - 0.5) * 0.6, 0.38)
    e.shake = 0.2
    paintTag(e)
    if (res.hp === 0) {
      sfx.packageDrop(sound(e.pkg.x, e.pkg.z))
      ui.toast(isTouch() ? 'Package broken! Tap Open next to it.' : 'Package broken! Press E next to it to open it.', '#ffd23f', 2.5, '#3b2a00')
    }
  }
  const breakable = (e) => e.landed && e.opening < 0 && e.pkg.hp > 0
  const openable = (e) => e.landed && e.opening < 0 && e.pkg.hp === 0

  function updatePackages(dt) {
    for (const [id, e] of placed) {
      const o = e.obj
      if (e.opening >= 0) {
        // Lid pops: swell, then shrink away.
        e.opening += dt
        const t = e.opening / 0.35
        o.scale.setScalar(t < 0.4 ? 1 + 0.5 * (t / 0.4) : Math.max(0, 1.2 * (1 - (t - 0.4) / 0.6)))
        o.position.y = 0.3 * Math.sin(Math.min(1, t) * Math.PI)
        if (t >= 1) {
          plot.remove(o)
          placed.delete(id)
        }
        continue
      }
      if (!e.landed) {
        e.t += dt
        const k = Math.min(1, e.t / F.dropTime)
        const s = ease(k)
        o.position.set(e.from.x + (e.pkg.x - e.from.x) * s, e.from.y * (1 - k) + Math.sin(k * Math.PI) * 1.1, e.from.z + (e.pkg.z - e.from.z) * s)
        o.rotation.y = (1 - k) * 2.4
        if (k >= 1) {
          e.landed = true
          o.position.set(e.pkg.x, 0, e.pkg.z)
          o.rotation.y = 0
          sfx.packageDrop(sound(e.pkg.x, e.pkg.z))
        }
      } else if (e.shake > 0) {
        e.shake = Math.max(0, e.shake - dt)
        const k = e.shake / 0.2
        o.scale.set(1 + 0.12 * k, 1 - 0.14 * k, 1 + 0.12 * k)
        o.rotation.z = Math.sin(e.shake * 70) * 0.08 * k
      } else if (e.pkg.hp === 0) {
        // Broken: it rattles now and then, asking to be opened.
        e.bob += dt
        const k = Math.max(0, Math.sin(e.bob * 2.2)) ** 8
        o.rotation.z = Math.sin(e.bob * 40) * 0.07 * k
        o.position.y = 0.06 * k
        o.scale.setScalar(1)
      } else if (o.scale.x !== 1) {
        o.scale.setScalar(1)
        o.rotation.z = 0
      }
      e.tag.show(true)
      world(o.position.x, o.position.y + 0.95, o.position.z, e.tag.pos)
    }
  }

  // --- Minions -------------------------------------------------------------------------------
  const [doorX, doorZ] = F.door
  const minions = []
  function addMinion() {
    const m = minionModel()
    m.obj.visible = false
    m.obj.position.set(doorX, 0, doorZ)
    plot.add(m.obj)
    minions.push({ ...m, state: 'home', target: null, sx: 0, sz: 0, phase: 0, cycle: 0, arm: 0, delay: minions.length * 0.5 })
  }

  function assign(m) {
    let best = null
    let bestScore = Infinity
    for (const e of placed.values()) {
      if (!breakable(e)) continue
      const d = Math.hypot(e.pkg.x - m.obj.position.x, e.pkg.z - m.obj.position.z)
      const score = e.minions * 100 + d
      if (score < bestScore) {
        bestScore = score
        best = e
      }
    }
    if (m.target) m.target.minions--
    m.target = best
    if (!best) return false
    // Stand on a side of the box: the first one on the side toward the hut, the next around it.
    const toward = Math.atan2(doorZ - best.pkg.z, doorX - best.pkg.x)
    const a = toward + best.minions * 2.1
    best.minions++
    m.sx = best.pkg.x + Math.cos(a) * F.standOff
    m.sz = best.pkg.z + Math.sin(a) * F.standOff
    m.state = 'walk'
    return true
  }

  // Walk toward (x, z); true on arrival.
  function walk(m, x, z, dt) {
    const p = m.obj.position
    const dx = x - p.x
    const dz = z - p.z
    const d = Math.hypot(dx, dz)
    const step = F.minionSpeed * dt
    m.obj.rotation.y = Math.atan2(dx, dz)
    m.phase += dt * 11
    const swing = Math.sin(m.phase) * 0.7
    m.legs[0].rotation.x = swing
    m.legs[1].rotation.x = -swing
    m.arms[0].rotation.x = -swing * 0.8
    m.arms[1].rotation.x = swing * 0.8
    p.y = Math.abs(Math.cos(m.phase)) * 0.05
    if (d <= step) {
      p.set(x, 0, z)
      return true
    }
    p.x += (dx / d) * step
    p.z += (dz / d) * step
    return false
  }

  function rest(m) {
    for (const l of m.legs) l.rotation.x = 0
    for (const a of m.arms) a.rotation.x = 0
  }

  function updateMinions(dt) {
    while (minions.length < base.minions()) addMinion()
    for (const m of minions) {
      if (m.delay > 0) {
        m.delay -= dt
        continue
      }
      if (m.target && !breakable(m.target)) {
        m.target.minions--
        m.target = null
        rest(m)
      }
      if (!m.target && m.state !== 'home' && !assign(m)) m.state = 'return'
      if (m.state === 'home') {
        if (assign(m)) {
          m.obj.position.set(doorX, 0, doorZ)
          m.obj.visible = true
        }
        continue
      }
      if (m.state === 'return') {
        if (walk(m, doorX, doorZ, dt)) {
          m.state = 'home'
          m.obj.visible = false
          m.delay = 0.3
          rest(m)
        }
        continue
      }
      const e = m.target
      if (m.state === 'walk') {
        if (walk(m, m.sx, m.sz, dt)) {
          m.state = 'punch'
          m.cycle = 0
          rest(m)
        }
        continue
      }
      // Punching: face the box, one fist out per cycle (left, right, ...), the hit at full reach.
      m.obj.rotation.y = Math.atan2(e.pkg.x - m.obj.position.x, e.pkg.z - m.obj.position.z)
      const prev = m.cycle
      m.cycle += dt
      const hitAt = Math.min(0.25, F.hitEvery * 0.3)
      if (prev < hitAt && m.cycle >= hitAt) landed(e, base.hit(e.pkg.id, F.damage))
      if (m.cycle >= F.hitEvery) {
        m.cycle -= F.hitEvery
        m.arm ^= 1
      }
      const reach = m.cycle < hitAt ? m.cycle / hitAt : Math.max(0, 1 - (m.cycle - hitAt) / 0.35)
      m.arms[m.arm].rotation.x = -1.55 * ease(reach)
      m.arms[m.arm ^ 1].rotation.x = -0.5
      m.obj.position.y = 0
    }
  }

  // --- Items on the floor --------------------------------------------------------------------
  const shown = new Map() // item id -> { item, holder, model, tag, t, top, reveal }

  function syncItems() {
    const onFloor = base.items.filter((it) => it.active && !it.held)
    const keep = new Set(onFloor.map((it) => it.id))
    for (const [id, s] of shown) {
      if (keep.has(id) && s.item.x === s.x && s.item.z === s.z) continue
      plot.remove(s.holder)
      s.tag.remove()
      shown.delete(id)
    }
    for (const it of onFloor) {
      if (shown.has(it.id)) continue
      const holder = new Group()
      holder.position.set(it.x, 0, it.z)
      holder.scale.setScalar(0.01)
      plot.add(holder)
      const r = RARITY[it.rarity]
      const tag = ui.anchor('itag', 0.3)
      tag.el.innerHTML = `<span class="it-r"></span><span class="it-n"></span><span class="it-v"></span>`
      const [rEl, nEl, vEl] = tag.el.children
      rEl.textContent = r.label
      rEl.style.color = r.text
      nEl.textContent = it.name
      vEl.textContent = `${formatMoney(it.rate)}/s`
      // Out of a package: rises and spins (longer for rarer); put down: just pops in.
      const level = revealing.get(it.id)
      revealing.delete(it.id)
      const s = { item: it, x: it.x, z: it.z, holder, tag, t: 0, top: F.itemHeight, reveal: level == null ? null : 1.1 + level * 0.45 }
      shown.set(it.id, s)
      itemModel(it.name)
        .then((model) => {
          if (shown.get(it.id) !== s) return
          s.top = fit(model, F.itemHeight)
          holder.add(model)
        })
        .catch(() => {})
    }
  }

  let payT = 0
  function updateItems(dt) {
    payT += dt
    const pay = payT >= 1
    if (pay) payT -= 1
    for (const s of shown.values()) {
      const h = s.holder
      s.t += dt
      if (s.reveal) {
        // Up out of the box to ~1.5 m with a spin, hang there, then settle on the floor.
        const T = s.reveal
        const k = Math.min(1, s.t / T)
        const up = k < 0.3 ? ease(k / 0.3) : k < 0.75 ? 1 : 1 - ease((k - 0.75) / 0.25)
        h.position.y = up * 1.5
        h.rotation.y = (1 - (1 - k) ** 2) * Math.PI * 4
        h.scale.setScalar(Math.min(1, 0.2 + k * 3) * (1 + 0.15 * up))
        if (k >= 1) {
          s.reveal = null
          h.position.y = 0
          h.rotation.y = 0
          h.scale.setScalar(1)
        }
      } else if (s.t < 0.35) {
        const k = s.t / 0.35
        h.scale.setScalar(k < 0.7 ? (k / 0.7) * 1.15 : 1.15 - 0.15 * ((k - 0.7) / 0.3))
      } else if (h.scale.x !== 1) h.scale.setScalar(1)
      s.tag.show(!s.reveal)
      world(s.x, s.top + 0.35, s.z, s.tag.pos)
      if (pay && !s.reveal) pop('cash', `+${formatMoney(s.item.rate)}`, s.x, s.top + 1.0, s.z, 0.36)
    }
  }

  function updatePops(dt) {
    for (const p of pops) {
      if (p.life <= 0) continue
      p.life -= dt
      p.anchor.pos.y += dt * (p.kind === 'dmg' ? 1.3 : 0.9)
      if (p.life <= 0) p.anchor.show(false)
    }
  }

  // --- Click / tap to place the package in your hands -----------------------------------------
  const ray = new Raycaster()
  const ndc = new Vector2()
  const floorPlane = new Plane(new Vector3(0, 1, 0), -FLOOR_Y)
  const hit = new Vector3()
  let mouse = null // last cursor position (client px), mouse only
  // Plot-local [x, z] under a screen point (the centre while the cursor is locked), or null.
  function floorAt(cx, cy) {
    if (isLocked()) {
      cx = window.innerWidth / 2
      cy = window.innerHeight / 2
    }
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    if (!ray.ray.intersectPlane(floorPlane, hit)) return null
    if (!base.contains(hit.x, hit.z)) return null
    return base.toLocal(hit.x, hit.z)
  }
  const onPlot = (pos) => base.contains(pos.x, pos.z)
  let player = null // { pos, facing } from the last update

  function tryPlace(cx, cy) {
    const entry = carry.equippedEntry()
    if (!entry?.tier || !player || deps.isStunned() || !onPlot(player.pos)) return
    const spot = floorAt(cx, cy)
    if (!spot) return
    if (entry.home) {
      sfx.deny()
      ui.toast("You can't put it down while they're chasing you!")
      return
    }
    if (!fits(spot[0], spot[1])) {
      sfx.deny()
      ui.toast('No room there! Pick a clear spot on your floor.')
      return
    }
    carry.takeEquipped()
    dropFrom.set(player.group.x, player.group.y + 1.2, player.group.z)
    dropPending = true
    base.addPackage(entry.tier, spot[0], spot[1])
  }

  // A click is a short press that barely moved: on the world (mouse) or the touch look zone.
  let down = null
  const clickTarget = (t) => t === canvas || t?.closest?.('.touch-right')
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button > 0 || !clickTarget(e.target)) return
      down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, locked: isLocked() }
    },
    { capture: true },
  )
  window.addEventListener(
    'pointerup',
    (e) => {
      const d = down
      down = null
      if (!d || d.id !== e.pointerId) return
      if (performance.now() - d.t > 400 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return
      // The first click on the world only grabs the cursor (input.js); place from where it was.
      tryPlace(d.x, d.y)
    },
    { capture: true },
  )
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY }
  })

  // The ghost: a see-through box where a click would put the package (mouse only).
  const ghostOk = new MeshBasicMaterial({ color: '#4dff6a', transparent: true, opacity: 0.35, depthWrite: false })
  const ghostNo = new MeshBasicMaterial({ color: '#ff4040', transparent: true, opacity: 0.35, depthWrite: false })
  const ghost = new Group()
  const ghostBox = new Mesh(new BoxGeometry(0.85, 0.68, 0.85), ghostOk)
  ghostBox.position.y = 0.34
  const ghostRing = new Mesh(new RingGeometry(0.62, 0.78, 32).rotateX(-Math.PI / 2), ghostOk)
  ghostRing.position.y = 0.02
  ghost.add(ghostBox, ghostRing)
  ghost.visible = false
  plot.add(ghost)
  function updateGhost() {
    const entry = carry.equippedEntry()
    const want = entry?.tier && player && onPlot(player.pos) && !isTouch() && (mouse || isLocked())
    const spot = want ? floorAt(mouse?.x ?? 0, mouse?.y ?? 0) : null
    ghost.visible = !!spot
    if (!spot) return
    ghost.position.set(spot[0], 0, spot[1])
    const m = fits(spot[0], spot[1]) && !entry.home ? ghostOk : ghostNo
    ghostBox.material = ghostRing.material = m
  }

  // --- Live labels: minion rate on the hut, items / slots on the Upgrade Base sign -----------
  const hutTag = ui.anchor('tag hut-rate', 0.55)
  const slotTag = ui.anchor('tag slot-count', 1.15)
  world(-W / 2 + 2.4, 5.5, -D / 2 + 1.2, hutTag.pos)
  world(L.upgrade[0], 4.3, L.upgrade[1], slotTag.pos)
  hutTag.show(true)
  slotTag.show(true)
  function updateLabels() {
    const rate = (base.minions() * F.damage) / F.hitEvery
    hutTag.set(`⛏ ${Number(rate.toFixed(1))}/s`)
    slotTag.set(`${base.activeCount()}/${base.slots()}`)
  }

  // --- E: open a broken package, put down the item in hand, pick an item up ---------------------
  const promptAt = new Vector3()
  let wasOn = false
  function nearest(list, pos, test) {
    let best = null
    let bestD = F.useRange
    for (const e of list) {
      if (!test(e)) continue
      world(e.x ?? e.pkg.x, 0, e.z ?? e.pkg.z)
      const d = Math.hypot(tmp.x - pos.x, tmp.z - pos.z)
      if (d < bestD) {
        bestD = d
        best = e
      }
    }
    return best
  }

  function openPackage(e) {
    if (!openable(e)) return
    const item = base.openPackage(e.pkg.id) // syncPackages plays the burst
    if (!item) return
    const r = RARITY[item.rarity]
    if (item.active) ui.toast(`You got a ${r.label} ${item.name}! (${formatMoney(item.rate)}/s)`, r.text, 3.2)
    else ui.toast(`You got a ${r.label} ${item.name}! Your base is full, so it went to your Briefcase.`, r.text, 3.5)
  }

  function pickUp(s) {
    if (carry.count() >= deps.maxCarry) {
      sfx.deny()
      ui.toast('Your hands are full!')
      return
    }
    const it = base.pickUp(s.item.id)
    if (!it) return
    carry.addItem(it)
    sfx.steal()
  }

  function putDown(entry, spot) {
    if (!spot) {
      sfx.deny()
      ui.toast('No room there! Step to a clear spot.')
      return
    }
    if (base.activeCount() >= base.slots()) {
      sfx.deny()
      ui.toast(`All ${base.slots()} slots are full! Buy more slots or pick something up.`)
      return
    }
    carry.takeEquipped()
    base.putDown(entry.item.id, spot[0], spot[1])
    sfx.packageDrop(sound(spot[0], spot[1]))
  }

  function promptFor(pos, facing) {
    const brokenPkg = nearest(placed.values(), pos, openable)
    if (brokenPkg) {
      world(brokenPkg.pkg.x, 0.5, brokenPkg.pkg.z, promptAt)
      return { object: 'Package', action: 'Open', at: promptAt, fn: () => openPackage(brokenPkg) }
    }
    const entry = carry.equippedEntry()
    if (entry?.item) {
      const [lx, lz] = base.toLocal(pos.x + Math.sin(facing) * F.dropAhead, pos.z + Math.cos(facing) * F.dropAhead)
      const spot = fits(lx, lz, entry.item.id) ? [lx, lz] : null
      world(lx, 0.6, lz, promptAt)
      return { object: entry.item.name, action: 'Place', at: promptAt, fn: () => putDown(entry, spot) }
    }
    const item = nearest(shown.values(), pos, (s) => !s.reveal)
    if (item) {
      world(item.x, Math.min(item.top, 1) * 0.5, item.z, promptAt)
      return { object: item.item.name, action: 'Pick Up', at: promptAt, fn: () => pickUp(item) }
    }
    return null
  }

  base.subscribe(() => {
    syncPackages()
    syncItems()
  })
  syncPackages()
  syncItems()

  return {
    // After neighbours.update (which clears the prompt each frame it has none of its own).
    // pos = player feet, facing = player yaw, group = the drawn player position.
    update(dt, pos, facing, group) {
      player = { pos, facing, group }
      updatePackages(dt)
      updateMinions(dt)
      updateItems(dt)
      updatePops(dt)
      updateGhost()
      updateLabels()
      fx.update(dt)
      const on = onPlot(pos)
      if (on && !wasOn && carry.equippedEntry()?.tier) {
        ui.toast(isTouch() ? 'Tap your floor to place the Package!' : 'Click your floor to place the Package!', '#ffd23f', 2.5, '#3b2a00')
      }
      wasOn = on
      if (!on || deps.isStunned()) return
      const p = promptFor(pos, facing)
      if (p) ui.setPrompt(p)
    },
    // Dev: place the equipped package at plot-local (x, z) as if clicked there.
    placeAt(x, z) {
      const entry = carry.equippedEntry()
      if (!entry?.tier || !fits(x, z)) return false
      carry.takeEquipped()
      base.addPackage(entry.tier, x, z)
      return true
    },
    debug: () => ({
      packages: [...placed.values()].map((e) => ({ id: e.pkg.id, hp: e.pkg.hp, x: e.pkg.x, z: e.pkg.z, landed: e.landed })),
      minions: minions.map((m) => m.state),
      items: [...shown.values()].map((s) => s.item.name),
    }),
  }
}
