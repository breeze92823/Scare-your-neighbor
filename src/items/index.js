// Index item models: every items/<rarity>.js exports `models` = { 'Item Name': () => Object3D }
// with the names from INDEX.rarities[rarity].items in config.js. Picked up automatically;
// an item without a model yet shows a wrapped gift box.
import { INDEX, RARITY } from '../config.js'
import { G, M, grp, mesh } from '../models/kit.js'
import { thumb } from '../thumbs.js'

// Lazy, one file per rarity: a file that fails to load only costs its own items (gift-box
// placeholders + a console warning), never the game.
const loaders = {}
for (const [path, load] of Object.entries(import.meta.glob('./*.js'))) if (!path.endsWith('/index.js')) loaders[path.slice(2, -3)] = load
const loaded = {}
function loadRarity(rarity) {
  if (!loaders[rarity]) return Promise.resolve({})
  return (loaded[rarity] ||= loaders[rarity]()
    .then((m) => m.models ?? {})
    .catch((err) => {
      console.warn('[items] failed to load', rarity, err)
      delete loaded[rarity]
      return {}
    }))
}
const rarityOf = (name) => INDEX.order.find((r) => INDEX.rarities[r].items.includes(name)) ?? 'common'

function placeholder() {
  return grp(
    mesh(G.rbox(1, 0.8, 1, 0.06), M('#d84a4a')),
    mesh(G.box(0.22, 0.82, 1.02), M('#ffd23f')),
    mesh(G.box(1.02, 0.82, 0.22), M('#ffd23f')),
  )
}

// Promise<Object3D> of an item's model.
export async function itemModel(name) {
  const models = await loadRarity(rarityOf(name))
  try {
    return models[name]?.() ?? placeholder()
  } catch (err) {
    console.warn('[items] model failed', name, err)
    return placeholder()
  }
}

// { url (full colour), ink (dark silhouette in the rarity's ink) }
export function itemThumb(name) {
  return thumb(`item:${name}`, () => itemModel(name), { ink: RARITY[rarityOf(name)].ink })
}
