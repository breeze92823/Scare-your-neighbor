// The Index (after the reference screenshots): every item that packages can hold, by rarity.
//   left    - rarity tabs ("Epic 0/11"), scrolling; the open one has a white border
//   middle  - the rarity's item tiles: "???" + a dark silhouette until found, then the
//             name + full-colour art (a dot while its reward is unclaimed); under them the
//             found/total bar and the rarity's gift (all found -> claim the gift)
//   right   - the picked item: art, name, rarity, sell value, and its Rewards (money +
//             speed) with NOT FOUND / CLAIM / CLAIMED
//   bottom  - CLAIM ALL (n)! for every found item whose reward is still unclaimed
// Styles in indexWindow.css (design px of the 1920x991 reference times --uiw-u).
import './indexWindow.css'
import { INDEX, RARITY } from './config.js'
import { createWindow, replay } from './uiWindow.js'
import { formatMoney } from './state.js'
import { formatNum } from './rules.js'
import { ICONS } from './hudIcons.js'
import { CLOSE_X, SHOP_ICONS } from './shopIcons.js'
import { items, itemsOf } from './items.js'
import { itemThumb } from './items/index.js'
import { fillImg, prioritize } from './thumbs.js'
import * as snd from './audio/shopSfx.js'

function el(tag, className, parent, text) {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text != null) e.textContent = text
  parent?.append(e)
  return e
}
const ol = (cls, parent, text) => el('span', `ol ${cls}`, parent, text)
const fmtSpeed = (n) => `+${n < 10000 ? n.toLocaleString('en-US') : formatNum(n)}`

// toast(text, colour, seconds). Returns { win, open, toggle, claimable() }.
export function createIndexWindow({ toast = () => {}, onChange = () => {} } = {}) {
  const win = createWindow({
    title: 'Index',
    icon: ICONS.index,
    className: 'idxw',
    onOpen() {
      renderTabs()
      pick(rarity, selected)
      snd.open()
    },
  })
  win.dialog.querySelector('.uiw-close').innerHTML = CLOSE_X
  const h2 = win.dialog.querySelector('.uiw-title h2')
  h2.classList.remove('uiw-text')
  h2.classList.add('ol')

  const body = win.body
  const tabs = el('div', 'ix-tabs', body)
  const grid = el('div', 'ix-grid', body)
  const bar = el('div', 'ix-bar', body)
  const barFill = el('div', 'ix-bar-fill', bar)
  const barText = ol('ix-bar-text', bar, '0/11')
  const giftBtn = el('button', 'ix-gift', body)
  giftBtn.type = 'button'
  giftBtn.innerHTML = SHOP_ICONS.gift

  const view = el('div', 'ix-view', body)
  const viewImg = el('img', 'ix-view-img', el('div', 'ix-view-art', view))
  viewImg.alt = ''
  viewImg.draggable = false
  const viewName = ol('ix-view-name', view, '???')
  const viewRarity = ol('ix-view-rarity', view, '')
  const viewValue = ol('ix-view-value', view, '???')

  const rewards = el('div', 'ix-rewards', body)
  ol('ix-rewards-title', rewards, 'Rewards:')
  const cells = el('div', 'ix-cells', rewards)
  const moneyCell = el('div', 'ix-cell', cells)
  el('span', 'ix-cell-icon', moneyCell).innerHTML = ICONS.money
  const moneyText = ol('ix-cell-text', moneyCell, '')
  const speedCell = el('div', 'ix-cell', cells)
  el('span', 'ix-cell-icon', speedCell).innerHTML = ICONS.speed
  const speedText = ol('ix-cell-text', speedCell, '')
  const claimBtn = el('button', 'ix-claim ol', rewards, 'NOT FOUND')
  claimBtn.type = 'button'

  const claimAll = el('button', 'ix-claim-all', body)
  claimAll.type = 'button'
  el('span', 'ix-claim-all-icon', claimAll).innerHTML = ICONS.index
  const claimAllText = ol('ix-claim-all-text', claimAll, 'CLAIM ALL (0)!')

  let rarity = INDEX.order[0]
  let selected = INDEX.rarities[rarity].items[0]
  const tabEls = new Map()

  function renderTabs() {
    if (!tabEls.size) {
      for (const r of INDEX.order) {
        const t = el('button', `ix-tab r-${r}`, tabs)
        t.type = 'button'
        t.style.setProperty('--t0', RARITY[r].tile[0])
        t.style.setProperty('--t1', RARITY[r].tile[1])
        ol('ix-tab-name', t, RARITY[r].label)
        const n = ol('ix-tab-count', t, '')
        el('span', 'ix-dot', t)
        t.addEventListener('click', () => {
          snd.tap()
          pick(r)
        })
        tabEls.set(r, { t, n })
      }
    }
    for (const [r, { t, n }] of tabEls) {
      const c = items.count(r)
      n.textContent = `${c.found}/${c.total}`
      t.classList.toggle('on', r === rarity)
      t.classList.toggle('has-claim', itemsOf(r).some((it) => items.isFound(it.name) && !items.isClaimed(it.name)) || items.giftState(r) === 'ready')
    }
  }

  function renderGrid() {
    grid.replaceChildren()
    grid.style.setProperty('--t0', RARITY[rarity].tile[0])
    grid.style.setProperty('--t1', RARITY[rarity].tile[1])
    const list = itemsOf(rarity)
    prioritize(list.map((it) => `item:${it.name}`))
    for (const it of list) {
      const known = items.isFound(it.name)
      const tile = el('button', `ix-tile${known ? ' found' : ''}${it.name === selected ? ' on' : ''}`, grid)
      tile.type = 'button'
      ol('ix-tile-name', tile, known ? it.name : '???')
      const img = el('img', 'ix-tile-img', tile)
      img.alt = ''
      img.draggable = false
      fillImg(img, itemThumb(it.name), !known)
      if (known && !items.isClaimed(it.name)) el('span', 'ix-dot', tile)
      tile.addEventListener('click', () => {
        snd.tap()
        selected = it.name
        for (const t of grid.children) t.classList.toggle('on', t === tile)
        renderView()
      })
    }
    const c = items.count(rarity)
    barText.textContent = `${c.found}/${c.total}`
    barFill.style.width = `${(c.found / c.total) * 100}%`
    const g = items.giftState(rarity)
    giftBtn.classList.toggle('ready', g === 'ready')
    giftBtn.classList.toggle('done', g === 'claimed')
  }

  function renderView() {
    const it = itemsOf(rarity).find((i) => i.name === selected) ?? itemsOf(rarity)[0]
    selected = it.name
    const known = items.isFound(it.name)
    viewImg.removeAttribute('src')
    fillImg(viewImg, itemThumb(it.name), !known)
    viewName.textContent = known ? it.name : '???'
    viewRarity.textContent = RARITY[rarity].label
    viewRarity.style.color = RARITY[rarity].text
    viewValue.textContent = known ? formatMoney(it.value) : '???'
    moneyText.textContent = formatMoney(it.reward.money)
    speedText.textContent = fmtSpeed(it.reward.speed)
    const state = !known ? 'missing' : items.isClaimed(it.name) ? 'claimed' : 'ready'
    claimBtn.textContent = state === 'missing' ? 'NOT FOUND' : state === 'ready' ? 'CLAIM' : 'CLAIMED'
    claimBtn.dataset.state = state
  }

  function renderClaimAll() {
    const n = items.claimable().length
    claimAllText.textContent = `CLAIM ALL (${n})!`
    claimAll.classList.toggle('off', n === 0)
  }

  function pick(r, name) {
    rarity = r
    selected = name && INDEX.rarities[r].items.includes(name) ? name : INDEX.rarities[r].items[0]
    renderTabs()
    renderGrid()
    renderView()
    renderClaimAll()
  }

  claimBtn.addEventListener('click', () => {
    const r = items.claim(selected)
    if (!r) {
      replay(claimBtn, 'shake')
      snd.deny()
      return
    }
    snd.claim()
    toast(`Claimed ${formatMoney(r.money)} and ${fmtSpeed(r.speed)} Speed!`, '#5dff5d', 2.4)
  })
  claimAll.addEventListener('click', () => {
    const r = items.claimAll()
    if (!r.n) {
      replay(claimAll, 'shake')
      snd.deny()
      return
    }
    snd.claim(true)
    toast(`Claimed ${r.n} reward${r.n > 1 ? 's' : ''}: ${formatMoney(r.money)} and ${fmtSpeed(r.speed)} Speed!`, '#5dff5d', 3)
  })
  giftBtn.addEventListener('click', () => {
    const st = items.giftState(rarity)
    if (st !== 'ready') {
      replay(giftBtn, 'shake')
      snd.deny()
      const g = items.giftReward(rarity)
      toast(st === 'claimed' ? 'Gift already opened!' : `Find every ${RARITY[rarity].label} item to open: ${formatMoney(g.money)} + ${fmtSpeed(g.speed)} Speed`, '#ffd23f', 3)
      return
    }
    const g = items.claimGift(rarity)
    snd.gift()
    toast(`${RARITY[rarity].label} complete! ${formatMoney(g.money)} and ${fmtSpeed(g.speed)} Speed!`, '#ffd23f', 3.2)
  })

  items.subscribe((what) => {
    if (win.isOpen()) {
      renderTabs()
      renderGrid()
      renderView()
      renderClaimAll()
    }
    onChange(what)
  })

  return {
    win,
    toggle: win.toggle,
    open: win.open,
    claimable: () => items.claimable().length + INDEX.order.filter((r) => items.giftState(r) === 'ready').length,
  }
}
