// Packages: the models (one per tier `pkg.kind`), what you carry (hotbar slots: stolen
// packages and items picked up off your base floor, the equipped one held out in your
// right hand with its name tag) and selling the packages at the Sell Items stall (walk
// into its ring; items in hand are not sold there).
import { Box3, BoxGeometry, Group, Mesh, Vector3 } from 'three'
import { SCARE, STALLS } from './config.js'
import { itemModel, itemThumb } from './items/index.js'
import { std } from './propkit.js'
import { formatMoney, state } from './state.js'
import { sfx } from './audio/index.js'

export const KINDS = {
  box: { body: '#c99a5e', band: '#a87a42', size: 0.78 },
  crate: { body: '#8a5632', band: '#5e3519', size: 0.9 },
  safe: { body: '#6d7480', band: '#3c424c', size: 0.82 },
  chest: { body: '#8a4a22', band: '#f2c13a', size: 0.86 },
}
const mats = new Map()
const mat = (c) => mats.get(c) ?? mats.set(c, std(c, { roughness: 0.75 })).get(c)

// A package resting on its bottom face, centred on x/z (local y = 0 at the bottom).
export function packageModel(kind) {
  const k = KINDS[kind] ?? KINDS.box
  const s = k.size
  const g = new Group()
  const add = (w, h, d, c, x, y, z) => {
    const m = new Mesh(new BoxGeometry(w, h, d), mat(c))
    m.position.set(x, y, z)
    m.castShadow = true
    g.add(m)
    return m
  }
  add(s, s * 0.8, s, k.body, 0, s * 0.4, 0)
  if (kind === 'crate') {
    // Plank frame and a diagonal brace on the front and back.
    for (const z of [-1, 1]) {
      add(s * 1.02, s * 0.12, 0.04, k.band, 0, s * 0.08, (z * s) / 2)
      add(s * 1.02, s * 0.12, 0.04, k.band, 0, s * 0.72, (z * s) / 2)
      add(s * 1.05, s * 0.1, 0.04, k.band, 0, s * 0.4, (z * s) / 2).rotation.z = 0.6
    }
  } else if (kind === 'safe') {
    add(s * 0.26, s * 0.26, 0.06, k.band, 0, s * 0.42, s / 2)
  } else if (kind === 'chest') {
    for (const x of [-0.3, 0.3]) add(s * 0.12, s * 0.82, s * 1.02, k.band, x * s, s * 0.4, 0)
  } else {
    // Cardboard: tape across the top seam and down the front.
    add(s * 0.22, 0.02, s * 1.01, k.band, 0, s * 0.8, 0)
    add(s * 0.22, s * 0.3, 0.02, k.band, 0, s * 0.65, s / 2)
    add(s * 0.3, s * 0.2, 0.02, '#f2f2f2', s * 0.24, s * 0.3, s / 2)
  }
  return g
}

// An item model sized to `h` (largest side) with its middle at the origin (the grip).
export function gripModel(model, h) {
  const box = new Box3().setFromObject(model)
  const size = box.getSize(new Vector3())
  const k = h / Math.max(size.x, size.y, size.z, 1e-3)
  model.scale.multiplyScalar(k)
  const c = box.getCenter(new Vector3())
  model.position.set(-c.x * k, -c.y * k, -c.z * k)
  const g = new Group()
  g.add(model)
  return g
}

export function createCarry(ui, playerGroup) {
  // { tier, home } = a package (home = the house still chasing you for it),
  // { item, img } = a base item in your hands (img = its hotbar thumbnail once rendered).
  const items = []
  let equipped = -1
  const H = SCARE.hold
  const hand = new Group() // the grip in the right fist, player-group space (+Z = forward)
  hand.position.set(-0.56, 1.24, 0.7) // until the first place(): roughly where the fist is
  hand.scale.setScalar(H.scale)
  playerGroup.add(hand)
  const shoulder = new Vector3()
  const pitch = (H.armPitch * Math.PI) / 180
  const armY = -Math.cos(pitch) // unit arm direction, character space (hangs along -Y at rest)
  const armZ = -Math.sin(pitch)
  const models = new Map()
  const tag = ui.anchor('pkg', 0.3).set('Package')

  const itemModels = new Map() // item id -> grip group (loaded async)
  function refresh() {
    hand.clear()
    const item = items[equipped]
    if (item?.item) {
      const id = item.item.id
      const ready = itemModels.get(id)
      if (ready) hand.add(ready)
      else if (!itemModels.has(id)) {
        itemModels.set(id, null)
        itemModel(item.item.name)
          .then((m) => {
            itemModels.set(id, gripModel(m, 0.95 / H.scale))
            if (items[equipped]?.item?.id === id) refresh()
          })
          .catch(() => {})
      }
    } else if (item) {
      const kind = item.tier.pkg.kind
      if (!models.has(kind)) {
        // Grip at the middle of the package, so the fist closes around it.
        const m = packageModel(kind)
        m.position.y = -(KINDS[kind] ?? KINDS.box).size * 0.4
        models.set(kind, m)
      }
      hand.add(models.get(kind))
    }
    tag.set(item?.item ? item.item.name : 'Package').show(!!item)
    ui.setHotbar(
      items.map((it) => (it.item ? { name: it.item.name, img: it.img } : { name: 'Package' })),
      equipped,
      (i) => {
        equipped = equipped === i ? -1 : i
        refresh()
      },
    )
  }
  refresh()

  // Sell Items stall: its ring (plaza.js draws it 0.6 m in front of the stall).
  const sell = STALLS.find((s) => s.goods === 'sell')
  let inRing = false

  return {
    count: () => items.length,
    // A stolen package goes straight into your hands. False when the hotbar is full.
    add(tier, home) {
      if (items.length >= SCARE.maxCarry) return false
      items.push({ tier, home })
      equipped = items.length - 1
      refresh()
      return true
    },
    // An item off your base floor into your hands (equipped). False when the hotbar is full.
    addItem(item) {
      if (items.length >= SCARE.maxCarry) return false
      const entry = { item, img: null }
      items.push(entry)
      equipped = items.length - 1
      itemThumb(item.name)
        .then((t) => {
          entry.img = t.url
          if (items.includes(entry)) refresh()
        })
        .catch(() => {})
      refresh()
      return true
    },
    // The equipped entry ({ tier, home } or { item }), or null.
    equippedEntry: () => items[equipped] ?? null,
    // Takes the equipped entry out of your hands; returns it.
    takeEquipped() {
      const it = items[equipped]
      if (!it) return null
      items.splice(equipped, 1)
      if (it.item) itemModels.delete(it.item.id)
      equipped = -1
      refresh()
      return it
    },
    // Drops hotbar items that are no longer yours in hand (sold from the Sell window).
    prune(isHeld) {
      let n = 0
      for (let i = items.length - 1; i >= 0; i--) {
        if (!items[i].item || isHeld(items[i].item)) continue
        itemModels.delete(items[i].item.id)
        items.splice(i, 1)
        equipped = equipped === i ? -1 : equipped > i ? equipped - 1 : equipped
        n++
      }
      if (n) refresh()
    },
    // Caught: the package taken from that house is gone.
    loseFrom(home) {
      const i = items.findIndex((it) => it.home === home)
      if (i < 0) return
      items.splice(i, 1)
      equipped = equipped === i ? -1 : equipped > i ? equipped - 1 : equipped
      refresh()
    },
    // They gave up: the package is yours now.
    keepFrom(home) {
      for (const it of items) if (it.home === home) it.home = null
    },
    holding: () => !!items[equipped],
    // What the right hand holds, for the room (net.js hold): "" | "pkg:<kind>" | "item:<name>".
    holdKey() {
      const it = items[equipped]
      return !it ? '' : it.item ? `item:${it.item.name}` : `pkg:${it.tier.pkg.kind}`
    },
    // After the animator has posed the arm: move the item to the right fist.
    place(avatar) {
      const bone = avatar?.nodes?.ArmR1
      if (!items[equipped] || !bone) return
      playerGroup.updateMatrixWorld(true)
      playerGroup.worldToLocal(bone.getWorldPosition(shoulder))
      const s = avatar.scale.y
      hand.position.set(shoulder.x, shoulder.y + (armY * H.reach - H.drop) * s, shoulder.z + armZ * H.reach * s)
    },
    toggle(i) {
      if (i >= items.length) return
      equipped = equipped === i ? -1 : i
      refresh()
    },
    update(pos, worldPos) {
      // The name floats over the item in your hand (falls back to over your head).
      if (tag.shown) {
        if (hand.parent?.visible) hand.getWorldPosition(tag.pos).y += 0.55
        else tag.pos.set(worldPos.x, worldPos.y + 1.6, worldPos.z)
      }
      const inside = Math.hypot(pos.x - sell.x, pos.z - (sell.z + 0.6)) < 4.2
      const pkgs = items.filter((it) => it.tier)
      if (inside && !inRing && pkgs.length) {
        const total = pkgs.reduce((sum, it) => sum + it.tier.pkg.value, 0)
        const n = pkgs.length
        const held = items[equipped]
        for (let i = items.length - 1; i >= 0; i--) if (items[i].tier) items.splice(i, 1)
        equipped = held?.item ? items.indexOf(held) : -1
        refresh()
        state.add('money', total)
        sfx.sell(n)
        ui.toast(`Sold ${n} Package${n > 1 ? 's' : ''} for ${formatMoney(total)}!`, '#4dff5a', 2.5, '#08360c')
      }
      inRing = inside
    },
  }
}
