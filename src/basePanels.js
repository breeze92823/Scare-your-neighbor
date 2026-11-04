// The two side panels behind the HUD's right squares, after the reference screenshots:
//   box      -> Packages: the packages stolen and brought home but not opened yet
//               ("Break All" in the header, one row per house tier with its count + Break)
//   suitcase -> Briefcase: the items in your base, "N/7 Active" + "+2 SLOTS [$500K]"
//               in the header, a row per item with Equip / Unequip, "Equip Best" below
// A panel slides in on the right with a red ">" tab on its left that closes it; the
// squares hide while it is open. The game keeps running (no backdrop). Styles in
// basePanels.css, sized in HUD reference px (--u from hud.js).
import './basePanels.css'
import { HOUSES, RARITY } from './config.js'
import { ICONS } from './hudIcons.js'
import { formatMoney } from './state.js'
import { itemThumb } from './items/index.js'
import { sfx } from './audio/index.js'

function el(tag, className, parent) {
  const e = document.createElement(tag)
  if (className) e.className = className
  parent?.append(e)
  return e
}
function text(tag, className, value, parent) {
  const e = el(tag, `ol ${className}`, parent)
  e.textContent = value
  return e
}
// A HUD button (hud.css .hud-btn: pointer events, press pop, the audio click).
function button(className, label, fn, parent) {
  const b = el('button', `hud-btn ${className}`, parent)
  b.type = 'button'
  if (label != null) text('span', 'bp-btn-text', label, b)
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    b.classList.remove('pop')
    void b.offsetWidth
    b.classList.add('pop')
    fn()
  })
  return b
}
const setLabel = (b, label) => {
  const t = b.querySelector('.bp-btn-text')
  if (t.textContent !== label) t.textContent = label
}

const CHEVRON = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 14l18 18-18 18" fill="none" stroke="#1b1b2a" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 14l18 18-18 18" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const cap = (s) => s[0].toUpperCase() + s.slice(1)
const tierLabel = (name) => cap(HOUSES.tiers.find((t) => t.name === name)?.name ?? name)

// One panel: { wrap, head, body, foot?, open, close, isOpen }.
function createPanel(hudRoot, className, onClose) {
  const wrap = el('div', `bp ${className}`, hudRoot)
  wrap.hidden = true
  const back = button('bp-back', null, onClose, wrap)
  back.innerHTML = CHEVRON
  back.setAttribute('aria-label', 'Close')
  const frame = el('div', 'bp-frame', wrap)
  const head = el('div', 'bp-head', frame)
  const body = el('div', 'bp-body', frame)
  // Scrolling the list must not reach the camera / page.
  body.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true })
  return { wrap, head, body }
}

// base: base.js store. ui: gameUi (toasts).
export function createBasePanels(hudRoot, base, ui) {
  let openName = null
  const panels = {}

  function show(name) {
    openName = name
    for (const [k, p] of Object.entries(panels)) p.wrap.hidden = k !== name
    hudRoot.classList.toggle('bp-open', !!name)
    if (name) {
      panels[name].render()
      document.exitPointerLock?.() // the cursor has to be free to press the buttons
    }
  }
  const close = () => {
    if (!openName) return false
    show(null)
    return true
  }
  const toggle = (name) => show(openName === name ? null : name)

  // --- Packages ------------------------------------------------------------------------
  {
    const p = createPanel(hudRoot, 'bp-packages', close)
    text('span', 'bp-title', 'Packages', p.head)
    const breakAll = button('bp-hbtn gold', 'Break All', () => {
      const got = base.openAll()
      if (!got.length) {
        sfx.deny()
        ui.toast('No packages in your base! Steal some and bring them home.')
        return
      }
      sfx.steal()
      const best = got.reduce((a, b) => (b.rate > a.rate ? b : a))
      ui.toast(
        `Opened ${got.length} Package${got.length > 1 ? 's' : ''}! Best: ${RARITY[best.rarity].label} ${best.name} ($${best.rate}/s)`,
        RARITY[best.rarity].text,
        3,
      )
    }, p.head)

    p.render = () => {
      breakAll.classList.toggle('off', base.packages.length === 0)
      p.body.replaceChildren()
      if (!base.packages.length) {
        text('div', 'bp-empty', 'No packages in your base', p.body)
        return
      }
      // One row per house tier, in tier order.
      const counts = new Map()
      for (const pkg of base.packages) counts.set(pkg.tier.name, (counts.get(pkg.tier.name) ?? 0) + 1)
      for (const tier of HOUSES.tiers) {
        const n = counts.get(tier.name)
        if (!n) continue
        const row = el('div', 'bp-row', p.body)
        const icon = el('span', 'bp-icon pkg', row)
        icon.innerHTML = ICONS.box
        icon.style.setProperty('--t0', RARITY[tier.name]?.tile[0] ?? '#c9ced6')
        icon.style.setProperty('--t1', RARITY[tier.name]?.tile[1] ?? '#9aa0aa')
        const words = el('div', 'bp-words', row)
        const name = text('span', 'bp-name', tierLabel(tier.name), words)
        name.style.color = RARITY[tier.name]?.text ?? '#fff'
        text('span', 'bp-sub', `Package x${n}`, words)
        button('bp-act gold', 'Break', () => {
          const item = base.openOne(tier.name)
          if (!item) return
          sfx.steal()
          ui.toast(`You got a ${RARITY[item.rarity].label} ${item.name}! ($${item.rate}/s)`, RARITY[item.rarity].text, 3)
        }, row)
      }
    }
    panels.packages = p
  }

  // --- Briefcase -------------------------------------------------------------------------
  {
    const p = createPanel(hudRoot, 'bp-briefcase', close)
    const title = text('span', 'bp-title', '', p.head)
    const buy = button('bp-hbtn red', '', () => {
      const cost = base.slotCost()
      const r = base.buySlots()
      if (r === 'ok') {
        sfx.sell(1)
        ui.toast(`+2 slots! Spent ${formatMoney(cost)}.`, '#4dff5a', 2.5, '#08360c')
      } else {
        sfx.deny()
        ui.toast(r === 'max' ? 'Your briefcase is as big as it gets!' : `Not enough money! You need ${formatMoney(cost)}.`)
      }
    }, p.head)
    const foot = button('bp-foot green', 'Equip Best', () => {
      if (!base.items.length) {
        sfx.deny()
        ui.toast('No items yet! Break packages to get some.')
        return
      }
      base.equipBest()
      ui.toast(`Best items equipped! $${base.income()}/s`, '#4dff5a', 2.5, '#08360c')
    }, p.wrap)

    p.render = () => {
      title.textContent = `${base.activeCount()}/${base.slots()} Active`
      const cost = base.slotCost()
      setLabel(buy, cost == null ? 'MAX SLOTS' : `+2 SLOTS [${formatMoney(cost)}]`)
      buy.classList.toggle('off', cost == null)
      foot.classList.toggle('off', base.items.length === 0)
      p.body.replaceChildren()
      if (!base.items.length) {
        text('div', 'bp-empty', 'No items in your base', p.body)
        return
      }
      const full = base.activeCount() >= base.slots()
      for (const it of base.sorted()) {
        const row = el('div', `bp-row${it.active ? ' on' : ''}`, p.body)
        const icon = el('span', 'bp-icon', row)
        icon.style.setProperty('--t0', RARITY[it.rarity].tile[0])
        icon.style.setProperty('--t1', RARITY[it.rarity].tile[1])
        // Card art from the shared thumbnail renderer (cached per item name).
        itemThumb(it.name)
          .then((t) => {
            const img = el('img', '', icon)
            img.src = t.url
            img.alt = ''
            img.draggable = false
          })
          .catch(() => {})
        const words = el('div', 'bp-words', row)
        text('span', 'bp-name', it.name, words)
        const sub = text('span', 'bp-sub', `($${it.rate}/s)`, words)
        sub.style.color = RARITY[it.rarity].text
        if (it.held) button('bp-act off', 'In Hand', () => ui.toast('Put it down on your floor with E first.'), row)
        else if (it.active) button('bp-act red', 'Unequip', () => base.unequip(it.id), row)
        else
          button(`bp-act green${full ? ' off' : ''}`, 'Equip', () => {
            if (!base.equip(it.id)) {
              sfx.deny()
              ui.toast(base.activeCount() >= base.slots() ? 'All slots are full! Unequip an item or buy more slots.' : 'No room on your floor! Move something first.')
            }
          }, row)
      }
    }
    panels.briefcase = p
  }

  // Redraw the open panel on any change (opening, equipping, new packages), keeping
  // the list where it was scrolled to.
  base.subscribe(() => {
    if (!openName) return
    const { body, render } = panels[openName]
    const top = body.scrollTop
    render()
    body.scrollTop = top
  })

  return {
    toggle,
    close,
    isOpen: () => !!openName,
  }
}
