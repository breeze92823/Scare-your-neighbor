// The on-screen HUD, laid out after the reference screenshots (1920x992):
//   left middle  - Index (cyan, red badge = unclaimed item rewards) and Shop (green) buttons
//   bottom left  - speed (shoe), scare level (ghost) and money counters
//   right middle - Packages (red, box) and Briefcase (orange, suitcase) squares, which
//                  open the side panels of basePanels.js
// Sizes are reference px times --u (set on resize). With touch controls the
// counters move under the Shop button as one row (the joystick owns the bottom-left)
// and on short landscape screens the right squares sit in a row under the touch
// buttons. Blocks that would land under Boxity's toolbar / chat feed slide down
// clear of them (setReserved).
import './hud.css'
import { HUD } from './config.js'
import { ICONS } from './hudIcons.js'
import { formatMoney, state } from './state.js'
import { formatNum } from './rules.js'
import { createWindow } from './uiWindow.js'
import { createIndexWindow } from './indexWindow.js'

function el(tag, className, html = '') {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (html) e.innerHTML = html
  return e
}

// Outlined text (stroke painted under the fill, see .ol in hud.css).
function text(className, value) {
  const e = el('span', `ol ${className}`)
  e.textContent = value
  return e
}

// Fires on pointerdown (no click delay on touch) and plays the press pop.
function button(className, html, fn) {
  const b = el('button', `hud-btn ${className}`, html)
  b.type = 'button'
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    b.classList.remove('pop')
    void b.offsetWidth
    b.classList.add('pop')
    fn?.()
  })
  return b
}

// --- Windows -------------------------------------------------------------------------

function soonWindow(title, icon, line) {
  const win = createWindow({ title, icon, className: 'win-soon' })
  win.body.innerHTML = `<div class="soon-icon">${icon}</div>`
  win.body.append(text('soon-title', 'Coming soon!'), text('soon-line', line))
  return win
}

export function createHud() {
  const root = el('div', 'hud')

  // --- Left: Index + Shop ---------------------------------------------------------------
  const left = el('div', 'hud-left')
  // Index (indexWindow.js): every item packages can hold; the badge counts unclaimed rewards.
  let toastFn = null
  const badge = text('hud-badge', '')
  const updateBadge = () => {
    const n = index.claimable()
    badge.textContent = String(n)
    badge.hidden = n === 0
  }
  const index = createIndexWindow({ toast: (...a) => toastFn?.(...a), onChange: () => updateBadge() })
  const indexBtn = button('hud-menu menu-index', `<span class="hud-menu-icon">${ICONS.index}</span>`, index.toggle)
  indexBtn.append(text('hud-menu-label', 'Index'), badge)
  updateBadge()
  const shop = soonWindow('Shop', ICONS.shop, 'Costumes, speed boosts and more.')
  const shopBtn = button('hud-menu menu-shop', `<span class="hud-menu-icon">${ICONS.shop}</span>`, shop.toggle)
  shopBtn.append(text('hud-menu-label', 'Shop'))
  left.append(indexBtn, shopBtn)

  // --- Bottom left: counters --------------------------------------------------------------
  const stats = el('div', 'hud-stats')
  const counters = {}
  for (const [key, icon] of [
    ['speed', ICONS.speed],
    ['scareLevel', ICONS.scare],
    ['money', ICONS.money],
  ]) {
    const row = el('div', `hud-stat stat-${key}`, `<span class="hud-stat-icon">${icon}</span>`)
    counters[key] = text('hud-stat-value', '')
    row.append(counters[key])
    stats.append(row)
  }
  state.subscribe((key, value) => {
    const c = counters[key]
    if (!c) return
    c.textContent = key === 'money' ? formatMoney(value) : formatNum(value) // 11.9K, 4.5M
    c.classList.remove('bump')
    void c.offsetWidth
    c.classList.add('bump')
  })

  // --- Right: packages (box) + briefcase (suitcase) -------------------------------------------
  // They open the side panels (basePanels.js), wired up through hud.onSquare().
  const right = el('div', 'hud-right')
  const squares = {}
  right.append(
    button('hud-square sq-box', ICONS.box, () => squares.box?.()),
    button('hud-square sq-bag', ICONS.bag, () => squares.bag?.()),
  )

  root.append(left, stats, right)
  document.body.append(root)

  // --- Scale + touch placement ----------------------------------------------------------------
  const touch = () => document.body.classList.contains('touch-ui')
  function placeStats() {
    const target = touch() ? left : root
    if (stats.parentNode !== target) target.append(stats)
  }
  function resize() {
    const vw = window.visualViewport?.width ?? window.innerWidth
    const vh = window.visualViewport?.height ?? window.innerHeight
    const fit = Math.min(vw / HUD.design.w, vh / HUD.design.h)
    const u = Math.max(fit, touch() ? HUD.touchScale : HUD.minScale)
    root.style.setProperty('--u', `${u}px`)
    placeStats()
    layoutReserved()
  }

  // --- Boxity's reserved areas ---------------------------------------------------------------------
  // The toolbar + chat feed cover the top-left corner (the whole top on narrow phones).
  // A block under one slides down below it (CSS translate keeps its own positioning).
  const GAP = 8
  let reserved = []
  function layoutReserved() {
    for (const block of [left, right]) {
      block.style.translate = ''
      const r = block.getBoundingClientRect()
      let shift = 0
      for (const a of reserved) {
        const overlap = r.left < a.left + a.width && a.left < r.right && r.top + shift < a.top + a.height && a.top < r.bottom + shift
        if (overlap) shift = Math.max(shift, a.top + a.height + GAP - r.top)
      }
      if (shift > 0) block.style.translate = `0 ${shift}px`
    }
  }

  window.addEventListener('resize', resize)
  window.visualViewport?.addEventListener('resize', resize)
  new MutationObserver(resize).observe(document.body, { attributes: true, attributeFilter: ['class'] })
  resize()

  return {
    root,
    // fn runs when the 'box' or 'bag' square is pressed.
    onSquare(name, fn) {
      squares[name] = fn
    },
    setReserved(areas) {
      reserved = areas
      layoutReserved()
    },
    // Kept for callers from the tier Index days: the Index now fills from opened items.
    discover() {},
    // fn(text, colour, seconds): where the Index's reward lines go (gameUi toast).
    setToast(fn) {
      toastFn = fn
    },
  }
}
