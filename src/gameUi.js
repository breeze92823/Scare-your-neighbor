// Screen-space pieces of the scare loop, after the reference screenshots:
//   prompt     - the dark interaction card at a world point ("Common House / Knock",
//                "Noob / SCARE!", "Package / Steal") with its E key; tap/click works too
//   scare      - the big red "SCARE! [E]" button at the bottom centre
//   toast      - red outlined line under the rarity banner ("Noob caught you! ...")
//   anchors    - DOM text pinned to 3D points: speech bubbles, name tags, emoji, "Package"
//   hotbar     - one slot per carried package at the bottom centre, the held one outlined
// Sizes are reference px (1920x992) times --u, like hud.css.
import './gameUi.css'
import { Vector3 } from 'three'
import { HUD } from './config.js'
import { ICONS } from './hudIcons.js'

function el(tag, className, parent) {
  const e = document.createElement(tag)
  e.className = className
  parent?.append(e)
  return e
}

// pointerdown fires at once on touch (no click delay) and never reaches the canvas.
function onPress(e, fn) {
  e.addEventListener('pointerdown', (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    fn()
  })
}

const isTouch = () => document.body.classList.contains('touch-ui')

export function createGameUi(camera) {
  const root = el('div', 'gui', document.body)
  const world = el('div', 'gui-world', root) // anchors + prompt (projected)
  const bottom = el('div', 'gui-bottom', root)

  // --- Anchors -----------------------------------------------------------------------
  // kind: 'bubble' (white chat bubble), 'bubble red', 'tag' (outlined name), 'emoji',
  // 'pkg' (small "Package"). `size` = world height in m (tags/emoji scale with distance).
  const anchors = new Set()
  function anchor(kind, size = 0) {
    const a = { el: el('div', `gui-anchor ${kind}`, world), pos: new Vector3(), shown: false, size, text: '' }
    a.el.hidden = true
    a.set = (text) => {
      if (text === a.text) return a
      a.text = text
      a.el.textContent = text
      return a
    }
    a.show = (on = true) => {
      a.shown = on
      if (!on) a.el.hidden = true
      return a
    }
    a.remove = () => {
      a.el.remove()
      anchors.delete(a)
    }
    anchors.add(a)
    return a
  }

  // --- Prompt ------------------------------------------------------------------------
  const prompt = el('div', 'gui-prompt', world)
  prompt.hidden = true
  const key = el('div', 'gui-key', prompt)
  const words = el('div', 'gui-words', prompt)
  const objText = el('div', 'gui-obj', words)
  const actText = el('div', 'gui-act', words)
  const promptPos = new Vector3()
  let promptFn = null
  let promptOn = false
  onPress(prompt, () => promptFn?.())

  // --- SCARE! button -----------------------------------------------------------------
  const scareBtn = el('button', 'gui-scare', bottom)
  scareBtn.type = 'button'
  scareBtn.hidden = true
  let scareFn = null
  onPress(scareBtn, () => scareFn?.())

  // --- Hotbar ------------------------------------------------------------------------
  const bar = el('div', 'gui-hotbar', bottom)
  let onSlot = null

  // --- Toast -------------------------------------------------------------------------
  const toastEl = el('div', 'gui-toast ol', root)
  let toastTimer = 0

  // --- Scale (same rule as hud.js) ------------------------------------------------------
  function resize() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const u = Math.max(Math.min(vw / HUD.design.w, vh / HUD.design.h), isTouch() ? HUD.touchScale : HUD.minScale)
    root.style.setProperty('--u', `${u}px`)
    scareBtn.textContent = isTouch() ? 'SCARE!' : 'SCARE!  [E]'
    key.textContent = isTouch() ? '' : 'E'
    key.classList.toggle('tap', isTouch())
  }
  window.addEventListener('resize', resize)
  new MutationObserver(resize).observe(document.body, { attributes: true, attributeFilter: ['class'] })
  resize()

  const v = new Vector3()
  // World point -> CSS px; null when behind the camera or too far.
  function project(p, maxDist = 90) {
    const d = camera.position.distanceTo(p)
    if (d > maxDist) return null
    v.copy(p).project(camera)
    if (v.z > 1 || v.z < -1) return null
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight, d }
  }

  return {
    anchor,

    // One prompt at a time; call every frame with the current one (or null).
    setPrompt(p) {
      promptOn = !!p
      if (!p) {
        prompt.hidden = true
        promptFn = null
        return
      }
      if (objText.textContent !== p.object) objText.textContent = p.object
      if (actText.textContent !== p.action) actText.textContent = p.action
      promptPos.copy(p.at)
      promptFn = p.fn
    },
    triggerPrompt() {
      if (!promptOn || !promptFn) return false
      promptFn()
      return true
    },

    setScare(fn) {
      scareFn = fn
      scareBtn.hidden = !fn
    },

    toast(text, color = '#ff3b45', seconds = 3.5, outline = '#3a0306') {
      toastEl.textContent = text
      toastEl.style.setProperty('--c', color)
      toastEl.style.setProperty('--oc', outline)
      toastEl.classList.remove('show')
      void toastEl.offsetWidth
      toastEl.classList.add('show')
      toastTimer = seconds
    },

    // items: [{ name }], equipped index or -1.
    setHotbar(items, equipped, fn) {
      onSlot = fn
      bar.replaceChildren()
      items.forEach((item, i) => {
        const slot = el('button', `gui-slot${i === equipped ? ' on' : ''}`, bar)
        slot.type = 'button'
        // A package shows the box icon, an item its thumbnail (once rendered).
        const icon = item.img ? `<img src="${item.img}" alt="" draggable="false">` : ICONS.box
        slot.innerHTML = `<span class="gui-slot-n">${i + 1}</span><span class="gui-slot-icon">${icon}</span>`
        if (i === equipped) {
          const name = el('span', 'gui-slot-name ol', slot)
          name.textContent = item.name
        }
        onPress(slot, () => onSlot?.(i))
      })
    },

    update(dt) {
      const focal = window.innerHeight / 2 / Math.tan((camera.fov * Math.PI) / 360)
      for (const a of anchors) {
        if (!a.shown) continue
        const s = project(a.pos)
        if (!s) {
          a.el.hidden = true
          continue
        }
        a.el.hidden = false
        a.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`
        if (a.size) a.el.style.fontSize = `${Math.min(110, Math.max(11, (a.size * focal) / s.d)).toFixed(1)}px`
      }
      if (promptOn) {
        const s = project(promptPos, 40)
        prompt.hidden = !s
        if (s) prompt.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`
      }
      if (toastTimer > 0) {
        toastTimer -= dt
        if (toastTimer <= 0) toastEl.classList.remove('show')
      }
    },
  }
}
