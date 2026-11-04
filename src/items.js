// Index items: the catalogue (INDEX in config.js) and the collection book (found /
// claimed / completed rarities). Packages open into items in your base (base.js);
// linkBase() marks every one of them found and gives the Sell Items window its store.
// Every found item has a one-time reward to claim in the Index (money + speed), and
// finding all of a rarity unlocks that rarity's gift.
import { INDEX, RARITY } from './config.js'
import { state } from './state.js'

// --- Catalogue ----------------------------------------------------------------------------
export const ITEMS = []
const byName = new Map()
for (const rarity of INDEX.order) {
  const r = INDEX.rarities[rarity]
  r.items.forEach((name, i) => {
    const item = { name, rarity, value: Math.round((r.value * (1 + i * INDEX.step)) / 10) * 10, reward: r.reward, index: i }
    ITEMS.push(item)
    byName.set(name, item)
  })
}
export const itemByName = (name) => byName.get(name)
export const itemsOf = (rarity) => ITEMS.filter((it) => it.rarity === rarity)
export const rarityLabel = (r) => RARITY[r]?.label ?? r

// --- Collection book ----------------------------------------------------------------------
const found = new Set()
const claimed = new Set()
const gifts = new Set() // rarities whose completion gift was claimed
const listeners = new Set()
const emit = (what, data) => {
  for (const fn of listeners) fn(what, data)
}

export const items = {
  // fn(what, data): 'found' | 'claimed' | 'gift'
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  // An item came out of a package (base.js): it shows in the Index from now on.
  discover(name) {
    const item = byName.get(name)
    if (!item || found.has(name)) return false
    found.add(name)
    emit('found', item)
    return true
  },
  isFound: (name) => found.has(name),
  isClaimed: (name) => claimed.has(name),
  claimable: () => ITEMS.filter((it) => found.has(it.name) && !claimed.has(it.name)),
  count: (rarity) => ({ found: itemsOf(rarity).filter((it) => found.has(it.name)).length, total: INDEX.rarities[rarity].items.length }),
  // Claims a found item's reward. Returns the reward or null.
  claim(name) {
    const item = byName.get(name)
    if (!item || !found.has(name) || claimed.has(name)) return null
    claimed.add(name)
    state.add('money', item.reward.money)
    state.add('speed', item.reward.speed)
    emit('claimed', item)
    return item.reward
  },
  claimAll() {
    const total = { money: 0, speed: 0, n: 0 }
    for (const it of items.claimable()) {
      const r = items.claim(it.name)
      total.money += r.money
      total.speed += r.speed
      total.n++
    }
    return total
  },
  giftReward: (rarity) => ({ money: INDEX.rarities[rarity].reward.money * INDEX.gift, speed: INDEX.rarities[rarity].reward.speed * INDEX.gift }),
  giftState(rarity) {
    if (gifts.has(rarity)) return 'claimed'
    const c = items.count(rarity)
    return c.found === c.total ? 'ready' : 'locked'
  },
  claimGift(rarity) {
    if (items.giftState(rarity) !== 'ready') return null
    gifts.add(rarity)
    const r = items.giftReward(rarity)
    state.add('money', r.money)
    state.add('speed', r.speed)
    emit('gift', rarity)
    return r
  },
}

// The items you own live in your base (base.js: opened from packages). Every one of them
// counts as found; selling goes through base.remove.
export function linkBase(base) {
  const sync = () => {
    for (const it of base.items) items.discover(it.name)
  }
  base.subscribe(sync)
  sync()
  return {
    list: () => base.sorted?.() ?? base.items,
    subscribe: (fn) => base.subscribe(fn),
    valueOf: (it) => byName.get(it.name)?.value ?? 0,
    // Sells one item (id) or all of them; returns the money made.
    sell(id) {
      const sold = id == null ? [...base.items] : base.items.filter((it) => it.id === id)
      let money = 0
      for (const it of sold) {
        money += byName.get(it.name)?.value ?? 0
        base.remove(it.id)
      }
      if (money) state.add('money', money)
      return money
    },
  }
}
