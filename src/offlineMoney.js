// Offline Money. While you are away your base keeps earning (the server turns income x time away into
// money when you log back in, capped at a day). That money is NOT added to your cash: a "Welcome back"
// window tells you the amount, and it piles up at your base (the "OFFLINE MONEY!" pile on your plot, base.js
// pile). Stand next to the pile and press E / tap its prompt to collect it into your cash. Whatever you
// leave there stays (it is saved) and the next time you are away it keeps growing, so it is never lost.
import './offlineMoney.css'
import { Vector3 } from 'three'
import { BASES } from './config.js'
import { formatMoney, state } from './state.js'
import { sfx } from './audio/index.js'

const RANGE = 6 // m from the pile at which the prompt shows

function away(s) {
  s = Math.max(0, Math.floor(s))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : m ? `${m}m` : `${s}s`
}

export function createOfflineMoney({ base, bases, ui }) {
  const plot = BASES.plots[BASES.mine]
  const c = Math.cos(plot.yaw)
  const s = Math.sin(plot.yaw)
  const [lx, lz] = BASES.layout.pile
  const pileX = plot.x + lx * c + lz * s
  const pileZ = plot.z - lx * s + lz * c
  const at = new Vector3(pileX, 1.8, pileZ)

  const paint = () => bases.setPile(formatMoney(base.pile()))
  base.subscribe(paint)
  paint()

  function collect() {
    const n = base.takePile()
    if (n <= 0) return
    state.add('money', n)
    sfx.sell(1)
    ui.toast(`Collected ${formatMoney(n)} Offline Money!`, '#4dff5a', 2.8, '#08360c')
  }

  // The "Welcome back" window: how much the base earned. It says where the money is; it adds nothing.
  let win = null
  function welcome(amount, seconds) {
    win?.remove()
    win = document.createElement('div')
    win.className = 'om-backdrop'
    win.innerHTML = `
      <div class="om-card" role="dialog" aria-label="Offline Money">
        <div class="om-head">Welcome back!</div>
        <div class="om-body">
          <div class="om-away">You were away for ${away(seconds)}</div>
          <div class="om-label">Your base earned</div>
          <div class="om-amount">${formatMoney(amount)}</div>
          <div class="om-note">It is waiting in the <b>Offline Money</b> pile at your base. Walk up to it and press <b>E</b> (or tap the prompt) to add it to your cash.</div>
          <button type="button" class="om-ok">OK</button>
        </div>
      </div>`
    const close = () => {
      win?.remove()
      win = null
    }
    win.querySelector('.om-ok').addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      close()
    })
    win.addEventListener('pointerdown', (e) => e.target === win && close())
    document.body.appendChild(win)
    sfx.upgrade?.()
  }
  base.onOffline(welcome)

  return {
    collect,
    // After baseFloor.update; before upgrades.update (a sign's prompt wins when you stand at it).
    update(pos) {
      const n = Math.floor(base.pile())
      if (n <= 0 || Math.hypot(pos.x - pileX, pos.z - pileZ) > RANGE) return
      ui.setPrompt({ object: 'Offline Money', action: `Collect ${formatMoney(n)}`, at, fn: collect })
    },
    // Dev: pretend the player was away.
    debugWelcome: welcome,
  }
}
