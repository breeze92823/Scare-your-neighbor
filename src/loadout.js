// What the player owns and wears from the Speed Auras and Scare Costumes stalls, and the
// multipliers that come with it: the worn aura multiplies the speed stat the player
// runs with (player.speedStat), the worn costume multiplies the scare level used for
// scare chances (effectiveScare()). The HUD keeps showing the base stats.
import { AURAS, COSTUMES } from './config.js'
import { state } from './state.js'

const lists = { aura: AURAS, costume: COSTUMES }
const owned = { aura: new Set(), costume: new Set() }
const worn = { aura: null, costume: null }
const listeners = new Set()

export const find = (kind, id) => lists[kind].find((x) => x.id === id) ?? null

export const loadout = {
  owns: (kind, id) => owned[kind].has(id),
  worn: (kind) => worn[kind],
  // fn(kind, id) whenever something is bought or (un)equipped; called once per kind now.
  subscribe(fn) {
    listeners.add(fn)
    fn('aura', worn.aura)
    fn('costume', worn.costume)
    return () => listeners.delete(fn)
  },
  // 'bought' | 'poor' | 'owned'. Buying wears it straight away.
  buy(kind, id) {
    const it = find(kind, id)
    if (!it) return 'poor'
    if (owned[kind].has(id)) return 'owned'
    if (state.get('money') < it.price) return 'poor'
    state.add('money', -it.price)
    owned[kind].add(id)
    loadout.wear(kind, id)
    return 'bought'
  },
  // Wear (or take off with null / the worn id again).
  wear(kind, id) {
    const next = id && owned[kind].has(id) && worn[kind] !== id ? id : null
    worn[kind] = next
    for (const fn of listeners) fn(kind, next)
    return next
  },
  speedMult: () => find('aura', worn.aura)?.mult ?? 1,
  scareMult: () => find('costume', worn.costume)?.mult ?? 1,
}

// The scare level scare chances are rolled with (rules.scareChance).
export const effectiveScare = () => state.get('scareLevel') * loadout.scareMult()
// The speed stat the player runs with (rules.runSpeed via player.speedStat).
export const effectiveSpeed = () => state.get('speed') * loadout.speedMult()
