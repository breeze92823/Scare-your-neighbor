// What is stored in your base. Packages are set down on the plot floor by clicking
// (baseFloor.js), the minions break them (hp -> 0, `broken`), and you open a broken one
// with E: its item appears where the package stood. Items on the floor are the active
// ones (they earn their $/s, at most `slots` of them); an item can be picked up into
// your hotbar (`held`) and put down again, or sit in the Briefcase (not placed, not held).
// The panels and the floor redraw through subscribe(fn).
import { BASE_FLOOR, BASE_STORAGE, BASES, INDEX, PACKAGE_ODDS } from './config.js'
import { state } from './state.js'

let nextId = 1

// [key, weight] list -> one key.
function pick(table) {
  let r = Math.random() * table.reduce((s, [, w]) => s + w, 0)
  for (const [key, w] of table) {
    r -= w
    if (r <= 0) return key
  }
  return table[table.length - 1][0]
}

// One item out of a package from a house of `tier`: its rarity by PACKAGE_ODDS, then any
// item of that rarity. Later items in a rarity's list are worth INDEX.step more each.
function rollItem(tier) {
  const rarity = pick(PACKAGE_ODDS[tier.name] ?? PACKAGE_ODDS.common)
  const r = INDEX.rarities[rarity]
  const i = Math.floor(Math.random() * r.items.length)
  const value = r.value * (1 + INDEX.step * i)
  return { name: r.items[i], rarity, value, rate: Math.max(1, Math.round(value * BASE_STORAGE.ratePerValue)) }
}

const rank = (rarity) => INDEX.order.indexOf(rarity)
// Best first: highest $/s, then the rarer item.
const byValue = (a, b) => b.rate - a.rate || rank(b.rarity) - rank(a.rarity)

export function createBase() {
  const packages = [] // { id, tier, hp, maxHp, x, z } plot-local position
  const items = [] // { id, name, rarity, value, rate, active, held, x, z }
  let slots = BASE_STORAGE.slots
  let bought = 0 // slot purchases so far
  let level = 1 // base level (Upgrade Base): sets the minion count
  let bank = 0 // earned but not paid out yet ($, fractional)
  let payTimer = 0
  const listeners = new Set()
  const changed = () => {
    for (const fn of listeners) fn()
  }
  const activeCount = () => items.reduce((n, it) => n + (it.active ? 1 : 0), 0)
  // A free floor point for an item that has none (baseFloor.js sets this).
  let findSpot = () => null

  // Opens package `pkg`: the item stands where it was (if a slot is free), else it goes
  // to the Briefcase.
  function open(pkg) {
    const item = { id: nextId++, ...rollItem(pkg.tier), active: false, held: false, x: pkg.x, z: pkg.z }
    item.active = activeCount() < slots
    items.push(item)
    return item
  }

  const base = {
    packages,
    items,
    slots: () => slots,
    level: () => level,
    // Upgrade Base (upgrades.js charges for it): one level up, one more minion.
    upgrade() {
      level++
      changed()
      return level
    },
    minions: () => BASE_FLOOR.minions[Math.min(level, BASE_FLOOR.minions.length) - 1],
    activeCount,
    income: () => items.reduce((s, it) => s + (it.active ? it.rate : 0), 0),
    // Price of the next slot purchase, or null when there are no more.
    slotCost: () => BASE_STORAGE.costs[bought] ?? null,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    setSpotFinder(fn) {
      findSpot = fn
    },

    // World (x, z) -> plot-local [x, z] of the local player's plot.
    toLocal(x, z) {
      const p = BASES.plots[BASES.mine]
      const dx = x - p.x
      const dz = z - p.z
      const c = Math.cos(p.yaw)
      const s = Math.sin(p.yaw)
      return [dx * c - dz * s, dx * s + dz * c]
    },
    // Is world (x, z) on the local player's plot?
    contains(x, z) {
      const [lx, lz] = base.toLocal(x, z)
      return Math.abs(lx) < BASES.width / 2 && Math.abs(lz) < BASES.depth / 2
    },

    // A stolen package set down at plot-local (x, z).
    addPackage(tier, x, z) {
      const hp = BASE_FLOOR.hp[tier.name] ?? BASE_FLOOR.hp.common
      const pkg = { id: nextId++, tier, hp, maxHp: hp, x, z }
      packages.push(pkg)
      changed()
      return pkg
    },
    // A minion's punch. Returns null when it is gone or broken already, else { hp }
    // (hp 0 = broken now: it waits for you to open it).
    hit(id, damage) {
      const pkg = packages.find((p) => p.id === id)
      if (!pkg || pkg.hp <= 0) return null
      pkg.hp = Math.max(0, pkg.hp - damage)
      if (pkg.hp === 0) changed()
      return { hp: pkg.hp }
    },
    // Opens package `id` (E on a broken one); returns its item.
    openPackage(id) {
      const i = packages.findIndex((p) => p.id === id)
      if (i < 0) return null
      const item = open(packages.splice(i, 1)[0])
      changed()
      return item
    },
    // Packages panel: opens the oldest package from a house of `tierName` at once.
    openOne(tierName) {
      const pkg = packages.find((p) => p.tier.name === tierName)
      return pkg ? base.openPackage(pkg.id) : null
    },
    // Opens every package; returns the items.
    openAll() {
      const got = packages.map(open)
      packages.length = 0
      if (got.length) changed()
      return got
    },

    // Into your hands (hotbar): it stops earning.
    pickUp(id) {
      const it = items.find((x) => x.id === id)
      if (!it || it.held) return null
      it.held = true
      it.active = false
      changed()
      return it
    },
    // Out of your hands onto the floor at (x, z). 'ok' | 'full' (every slot taken; it stays held).
    putDown(id, x, z) {
      const it = items.find((x) => x.id === id)
      if (!it) return 'full'
      if (activeCount() >= slots) return 'full'
      Object.assign(it, { held: false, active: true, x, z })
      changed()
      return 'ok'
    },

    // Briefcase Equip: onto a free floor spot. False when every slot is taken (or held).
    equip(id) {
      const it = items.find((x) => x.id === id)
      if (!it || it.held) return false
      if (it.active) return true
      if (activeCount() >= slots) return false
      const spot = findSpot(it)
      if (!spot) return false
      ;[it.x, it.z] = spot
      it.active = true
      changed()
      return true
    },
    unequip(id) {
      const it = items.find((x) => x.id === id)
      if (!it?.active) return
      it.active = false
      changed()
    },
    // Takes an item out of the base (sold at the Sell Items stall, shops.js; the money is
    // the caller's). Its slot is left free. Returns the removed item or null.
    remove(id) {
      const i = items.findIndex((x) => x.id === id)
      if (i < 0) return null
      const [it] = items.splice(i, 1)
      changed()
      return it
    },
    // Fills the slots with the highest-earning items (not the ones in your hands);
    // returns how many changed.
    equipBest() {
      const pool = items.filter((it) => !it.held)
      const best = new Set([...pool].sort(byValue).slice(0, slots))
      let n = 0
      for (const it of pool) if (it.active && !best.has(it)) {
        it.active = false
        n++
      }
      for (const it of pool) {
        if (it.active || !best.has(it)) continue
        const spot = findSpot(it)
        if (!spot) continue
        ;[it.x, it.z] = spot
        it.active = true
        n++
      }
      if (n) changed()
      return n
    },
    // 'ok' | 'poor' (not enough money) | 'max' (no more to buy).
    buySlots() {
      const cost = base.slotCost()
      if (cost == null) return 'max'
      if (state.get('money') < cost) return 'poor'
      state.add('money', -cost)
      bought++
      slots += BASE_STORAGE.perBuy
      changed()
      return 'ok'
    },

    // Briefcase order: on the floor first, then by value.
    sorted: () => [...items].sort((a, b) => b.active - a.active || byValue(a, b)),

    // Pays the income once a second (one counter bump, not one per frame).
    update(dt) {
      bank += base.income() * dt
      payTimer += dt
      if (payTimer < 1) return
      payTimer = 0
      const pay = Math.floor(bank)
      if (pay > 0) {
        bank -= pay
        state.add('money', pay)
      }
    },
  }
  return base
}
