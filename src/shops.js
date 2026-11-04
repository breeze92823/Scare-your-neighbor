// The plaza stall windows (after the reference screenshots):
//   Speed Auras    -> "Aura Shop": magenta header, a sideways-scrolling row of aura cards
//   Scare Costumes -> "Costume Shop": the same window with costume cards
//   Sell Items     -> "Sell Items": red header with Sell All, one row per carried item
// Standing in a stall's glowing ring opens its window, walking out closes it (closing it
// by hand keeps it shut until you step out and back in).
// Cards: name, rarity, art (3D render, thumbs.js), "x1.5 Speed" bar, then the $ price
// (green) and the premium price (purple) while not owned; Equip / Equipped once owned.
// Styles in shops.css; lengths are design px (the 1920x991 reference) times --uiw-u.
import './shops.css'
import { AURAS, COSTUMES, RARITY, SHOP, STALLS } from './config.js'
import { createWindow, replay } from './uiWindow.js'
import { formatMoney } from './state.js'
import { loadout } from './loadout.js'
import { itemByName, rarityLabel } from './items.js'
import { itemThumb } from './items/index.js'
import { costumeThumb } from './costumes/index.js'
import { auraCardBg, auraThumb } from './auras.js'
import { fillImg, prioritize } from './thumbs.js'
import { CLOSE_X, SHOP_ICONS } from './shopIcons.js'
import * as snd from './audio/shopSfx.js'

function el(tag, className, parent, text) {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text != null) e.textContent = text
  parent?.append(e)
  return e
}
const ol = (cls, parent, text) => el('span', `ol ${cls}`, parent, text)

// The reference window frame: our own header bar on the shared shell (one open window
// at a time, Esc closes, tap outside closes).
function frame(title, kind, onOpen, onClose) {
  const win = createWindow({ title, className: `shopw ${kind}`, onOpen, onClose })
  win.dialog.querySelector('.uiw-close').innerHTML = CLOSE_X
  win.dialog.querySelector('.uiw-title-icon').remove()
  const h2 = win.dialog.querySelector('.uiw-title h2')
  h2.classList.remove('uiw-text')
  h2.classList.add('ol')
  return win
}

// "x1.5" in green, then the stat word.
function multBar(card, mult, word) {
  const bar = el('div', 'shop-mult', card)
  ol('shop-x', bar, `x${mult}`)
  ol('shop-word', bar, ` ${word}`)
}

// --- Aura / Costume shop -----------------------------------------------------------------------
function shopWindow({ kind, title, list, word, art }, toast) {
  const cards = new Map()
  let rendered = false
  const win = frame(title, kind === 'aura' ? 'shop-auras' : 'shop-costumes', () => {
    if (!rendered) render()
    prioritize(list.map((it) => `${kind}:${it.id}`))
    refresh()
    snd.open()
  })
  const row = el('div', 'shop-row', win.body)
  // Mouse wheel scrolls the row sideways too.
  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      row.scrollLeft += e.deltaY
      e.preventDefault()
    }
  }, { passive: false })

  function render() {
    rendered = true
    for (const it of list) {
      const card = el('div', `shop-card ${kind} r-${it.rarity}`, row)
      if (kind === 'aura') {
        card.style.backgroundImage = `url(${auraCardBg(it)})`
      } else {
        card.style.setProperty('--bg0', it.bg[0])
        card.style.setProperty('--bg1', it.bg[1])
        card.style.setProperty('--halo', it.halo)
      }
      const box = el('div', 'shop-art', card)
      const img = el('img', 'shop-img', box)
      img.alt = ''
      img.draggable = false
      fillImg(img, art(it))
      ol('shop-name', card, it.name)
      const rar = ol('shop-rarity', card, RARITY[it.rarity].label)
      rar.style.color = it.rarityText ?? (it.rarity === 'cosmic' ? RARITY.cosmic.textCosmicShop : RARITY[it.rarity].text)
      multBar(card, it.mult, word)
      const buy = el('div', 'shop-buy', card)
      cards.set(it.id, { card, buy, it })
    }
  }
  function press(btn, fn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      fn()
    })
  }

  function refresh() {
    const wornId = loadout.worn(kind)
    for (const { card, buy, it } of cards.values()) {
      buy.replaceChildren()
      const own = loadout.owns(kind, it.id)
      card.classList.toggle('owned', own)
      card.classList.toggle('worn', wornId === it.id)
      if (!own) {
        const cash = el('button', 'shop-btn shop-cash ol', buy, formatMoney(it.price))
        cash.type = 'button'
        press(cash, () => {
          const r = loadout.buy(kind, it.id)
          if (r === 'poor') {
            replay(cash, 'shake')
            snd.deny()
            toast(SHOP.noMoney, '#ff3b45')
            return
          }
          snd.buy()
          setTimeout(() => (kind === 'aura' ? snd.wearAura() : snd.wearCostume()), 260)
          replay(card, 'bump-card')
          toast(`${it.name} unlocked! x${it.mult} ${word}`, '#5dff5d', 2.6)
        })
        if (it.gems != null) {
          const gem = el('button', 'shop-btn shop-gem', buy)
          gem.type = 'button'
          gem.innerHTML = `<span class="shop-gem-icon">${SHOP_ICONS.gem}</span>`
          ol('shop-gem-n', gem, String(it.gems))
          press(gem, () => {
            replay(gem, 'shake')
            snd.deny()
            toast(SHOP.noGems, '#d88bff')
          })
        }
      } else {
        const on = wornId === it.id
        const b = el('button', `shop-btn ${on ? 'shop-worn' : 'shop-equip'} ol`, buy, on ? 'Equipped' : 'Equip')
        b.type = 'button'
        press(b, () => {
          const now = loadout.wear(kind, it.id)
          if (now) kind === 'aura' ? snd.wearAura() : snd.wearCostume()
          else snd.takeOff()
        })
      }
    }
  }
  loadout.subscribe((k) => {
    if (k === kind && rendered) refresh()
  })
  return win
}

// --- Sell Items ------------------------------------------------------------------------------
// store (items.linkBase): list(), valueOf(item), sell(id?) -> money, subscribe(fn).
function sellWindow(store, toast) {
  const win = frame('Sell Items', 'sell-items', () => {
    render()
    snd.open()
  })
  const all = el('button', 'sell-all ol', win.dialog)
  all.type = 'button'
  const list = el('div', 'sell-list', win.body)
  const empty = ol('sell-empty', win.body, SHOP.sellEmpty)

  function render() {
    const inv = store?.list() ?? []
    const total = inv.reduce((s, it) => s + store.valueOf(it), 0)
    all.textContent = inv.length ? `Sell All  ${formatMoney(total)}` : 'Sell All'
    all.classList.toggle('off', !inv.length)
    empty.hidden = inv.length > 0
    list.hidden = inv.length === 0
    list.replaceChildren()
    for (const entry of inv) {
      const it = itemByName(entry.name)
      if (!it) continue
      const row = el('div', `sell-row r-${it.rarity}`, list)
      const icon = el('div', 'sell-icon', row)
      const img = el('img', '', icon)
      img.alt = ''
      img.draggable = false
      fillImg(img, itemThumb(it.name))
      const words = el('div', 'sell-words', row)
      ol('sell-name', words, it.name)
      const r = ol('sell-rarity', words, rarityLabel(it.rarity))
      r.style.color = it.rarity === 'common' ? '#d0d3d9' : RARITY[it.rarity].text
      ol('sell-price', row, formatMoney(it.value))
      const b = el('button', 'sell-btn ol', row, 'Sell')
      b.type = 'button'
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        const money = store.sell(entry.id)
        if (money) {
          snd.sell()
          toast(`Sold ${it.name} for ${formatMoney(money)}!`, '#5dff5d', 2)
          render()
        }
      })
    }
  }
  all.addEventListener('click', (e) => {
    e.stopPropagation()
    const n = store?.list().length ?? 0
    if (!n) {
      replay(all, 'shake')
      snd.deny()
      return
    }
    const money = store.sell()
    snd.sellAll(n)
    toast(`Sold ${n} item${n > 1 ? 's' : ''} for ${formatMoney(money)}!`, '#5dff5d', 2.4)
    render()
  })
  store?.subscribe(() => {
    if (win.isOpen()) render()
  })
  return win
}

// --- Stalls ----------------------------------------------------------------------------------
// toast(text, colour, seconds): the game's toast line (gameUi); store: items.linkBase(base).
// Returns { update(pos), windows }.
export function createShops({ toast = () => {}, store = null } = {}) {
  const windows = {
    auras: shopWindow({ kind: 'aura', title: 'Aura Shop', list: AURAS, word: 'Speed', art: auraThumb }, toast),
    costumes: shopWindow({ kind: 'costume', title: 'Costume Shop', list: COSTUMES, word: 'Scare', art: (c) => costumeThumb(c.id) }, toast),
    sell: sellWindow(store, toast),
  }
  // Render the shop card art in idle time after the game has settled, so a shop opens with
  // its pictures already there (items stay on demand: there are 100+ of them).
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1))
  setTimeout(() => idle(() => {
    for (const a of AURAS) auraThumb(a)
    for (const c of COSTUMES) costumeThumb(c.id)
  }), SHOP.warmDelay)
  const rings = STALLS.map((s) => ({ x: s.x, z: s.z + 0.6, win: windows[s.goods], inside: false })).filter((r) => r.win)

  return {
    windows,
    update(pos) {
      for (const r of rings) {
        const inside = Math.hypot(pos.x - r.x, pos.z - r.z) < SHOP.ringRadius
        if (inside && !r.inside) r.win.open()
        else if (!inside && r.inside && r.win.isOpen()) r.win.close()
        r.inside = inside
      }
    },
  }
}
