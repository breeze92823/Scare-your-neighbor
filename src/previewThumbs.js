// Dev-only contact sheets of the card art (loaded by main.js in dev):
//   __thumbs.costumes()        every costume
//   __thumbs.items('epic')     one Index rarity (no argument: all of them)
//   __thumbs.items('epic', true) the not-found silhouettes
//   __thumbs.close()
import { COSTUMES, INDEX } from './config.js'
import { costumeThumb } from './costumes/index.js'
import { itemThumb } from './items/index.js'
import { showSheet } from './thumbs.js'

const ink = (p) => p.then((t) => ({ url: t.ink }))

window.__thumbs = {
  costumes: () => showSheet(COSTUMES.map((c) => [c.name, costumeThumb(c.id)])),
  items(rarity, dark = false) {
    const list = rarity ? INDEX.rarities[rarity].items : INDEX.order.flatMap((r) => INDEX.rarities[r].items)
    return showSheet(list.map((n) => [n, dark ? ink(itemThumb(n)) : itemThumb(n)]))
  },
  close: () => document.getElementById('thumb-sheet')?.remove(),
}
