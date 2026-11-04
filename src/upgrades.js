// The owned base's machines and their Upgrade signs (UPGRADES in config; the models and
// signs are bases.js):
//   booth - stand on its red pad: every `every` s a scare, +per[level - 1] scare level
//           (a red "+10" pop, the glass flashes, a ghostly swell).
//   mill  - step onto the belt and you walk by yourself toward its arch at a walking pace
//           (player.autoWalk; any move key takes over), the belt runs back just as fast so
//           you stay on it (slats, rollers and display move, the motor hums), and every
//           `every` s on it gives +per[level - 1] speed (cyan "+1", a soft bell).
//           Walk off the side or the back end to leave.
//   signs - E / tap "Upgrade $12K" within `range` m buys the next level of that machine,
//           or of the base (Upgrade Base: +1 minion). The sign repaints (Level 2 > Level 3,
//           the next price, MAX at the end), the machine label follows (+25/SCARE), and the
//           red "!" over a sign shows only while you can afford it.
// Levels are kept here for the session (no saves yet), the base level in base.js.
import { BASES, UPGRADES as U } from './config.js'
import { formatMoney, state } from './state.js'
import { formatNum } from './rules.js'
import { player } from './player.js'
import { at, sfx } from './audio/index.js'
import { Vector3 } from 'three'

const KEYS = ['booth', 'mill', 'base']

// bases: buildBases() result, base: base.js store, ui: gameUi.
export function createUpgrades({ bases, base, ui, isStunned }) {
  const L = BASES.layout
  const plot = BASES.plots[BASES.mine]
  const c = Math.cos(plot.yaw)
  const s = Math.sin(plot.yaw)
  const toWorld = (lx, lz) => [plot.x + lx * c + lz * s, plot.z - lx * s + lz * c]
  // A world point in the space of a machine turned half round at plot-local (mx, mz).
  const inMachine = (pos, [mx, mz]) => {
    const [lx, lz] = base.toLocal(pos.x, pos.z)
    return [-(lx - mx), -(lz - mz)]
  }
  // The belt runs toward the arch: machine -Z = plot-local +Z = this world direction.
  const beltX = s
  const beltZ = c

  const autoWalk = { x: beltX, z: beltZ, speed: U.mill.walk }
  const motor = sfx.createMotor()
  const [millX, millZ] = toWorld(L.mill[0], L.mill[1])
  const levels = { booth: 1, mill: 1 }
  const level = (key) => (key === 'base' ? base.level() : levels[key])
  const per = (key) => U[key].per[levels[key] - 1]
  const cost = (key) => U[key].costs[level(key) - 1] ?? null

  function refresh() {
    const money = state.get('money')
    for (const key of KEYS) {
      const price = cost(key)
      bases.setSign(key, { level: level(key), cost: price == null ? null : formatMoney(price) }, price != null && money >= price)
    }
    bases.setLabel('booth', BASES.machines.scare.replace('{n}', formatNum(per('booth'))))
    bases.setLabel('mill', BASES.machines.step.replace('{n}', formatNum(per('mill'))))
  }
  state.subscribe((key) => {
    if (key === 'money') refresh()
  })
  base.subscribe(refresh)

  function buy(key) {
    const price = cost(key)
    const name = U[key].name
    if (price == null) {
      sfx.deny()
      ui.toast(`Your ${name} is already at max level!`)
      return
    }
    if (state.get('money') < price) {
      sfx.deny()
      ui.toast(`Not enough money! You need ${formatMoney(price)}.`)
      return
    }
    state.add('money', -price)
    sfx.upgrade()
    if (key === 'base') {
      const lv = base.upgrade()
      const n = base.minions()
      ui.toast(`Base upgraded to Level ${lv}! You now have ${n} minion${n > 1 ? 's' : ''}.`, '#4dff5a', 3, '#08360c')
    } else {
      levels[key]++
      const what = key === 'booth' ? `+${formatNum(per(key))}/SCARE` : `+${formatNum(per(key))}/STEP`
      ui.toast(`${name} upgraded to Level ${levels[key]}! Now ${what}`, '#4dff5a', 3, '#08360c')
    }
    refresh()
  }

  // --- Floating "+10" / "+2" over your head --------------------------------------------------
  const pops = []
  function pop(kind, text, pos) {
    let a = pops.find((p) => p.life <= 0 && p.kind === kind)
    if (!a) {
      if (pops.filter((p) => p.kind === kind).length >= 6) return
      a = { kind, anchor: ui.anchor(`gain ${kind}`, 0.42), life: 0 }
      pops.push(a)
    }
    a.anchor.set(text).show(true)
    a.anchor.pos.set(pos.x + (Math.random() - 0.5) * 0.8, pos.y + 2.3, pos.z + (Math.random() - 0.5) * 0.8)
    a.life = 0.9
    const e = a.anchor.el
    e.style.animation = 'none'
    void e.offsetWidth
    e.style.animation = ''
  }

  // --- The signs' prompts ----------------------------------------------------------------------
  const signs = KEYS.map((key) => {
    const spot = { booth: L.boothSign, mill: L.millSign, base: L.upgrade }[key]
    const [x, z] = toWorld(spot[0], spot[1])
    return { key, x, z, at: new Vector3(x, 1.6, z) }
  })

  let scareT = 0
  let stepT = 0
  refresh()

  return {
    levels: () => ({ booth: levels.booth, mill: levels.mill, base: base.level() }),
    // A loaded save (net.js store): the machine levels.
    setLevels(booth, mill) {
      if (Number.isFinite(booth)) levels.booth = Math.min(Math.max(1, booth), U.booth.per.length)
      if (Number.isFinite(mill)) levels.mill = Math.min(Math.max(1, mill), U.mill.per.length)
      refresh()
    },
    buy,
    // After baseFloor.update; pos = player feet.
    update(dt, pos) {
      const stunned = isStunned()
      // Booth pad: x within the arch, from the back wall to the front edge, up on the plinth.
      const [bx, bz] = inMachine(pos, L.booth)
      if (!stunned && Math.abs(bx) < 1.8 && bz > -1.0 && bz < 2.1 && pos.y > 0.35) {
        scareT += dt
        if (scareT >= U.booth.every) {
          scareT -= U.booth.every
          state.add('scareLevel', per('booth'))
          pop('scare', `+${formatNum(per('booth'))}`, pos)
          bases.pulseBooth()
          sfx.boothScare()
        }
      } else scareT = Math.min(scareT, U.booth.every * 0.6) // stepping back on scares a little sooner

      // Treadmill belt.
      const [tx, tz] = inMachine(pos, L.mill)
      if (!stunned && Math.abs(tx) < 1.3 && tz > -2.25 && tz < 2.85 && pos.y > 0.3) {
        player.autoWalk = autoWalk
        const forward = player.velocity.x * beltX + player.velocity.z * beltZ
        if (forward > 0.5) {
          player.conveyor.x = -beltX * forward
          player.conveyor.z = -beltZ * forward
          bases.setMill(forward)
          // A gain every `every` s of walking (the first one a full interval after stepping on).
          stepT += dt
          if (stepT >= U.mill.every) {
            stepT -= U.mill.every
            state.add('speed', per('mill'))
            pop('speed', `+${formatNum(per('mill'))}`, pos)
            bases.flashMill()
            sfx.treadmillGain()
          }
        } else {
          player.conveyor.x = -beltX * U.mill.drift
          player.conveyor.z = -beltZ * U.mill.drift
          bases.setMill(U.mill.drift)
        }
      } else {
        player.autoWalk = null
        player.conveyor.x = 0
        player.conveyor.z = 0
        bases.setMill(0)
        stepT = 0
      }
      motor.set(Math.min(1, bases.millSpeed() / U.mill.walk), at(millX, millZ))

      for (const p of pops) {
        if (p.life <= 0) continue
        p.life -= dt
        p.anchor.pos.y += dt * 1.4
        if (p.life <= 0) p.anchor.show(false)
      }

      if (stunned) return
      let near = null
      let bestD = U.range
      for (const sg of signs) {
        const d = Math.hypot(sg.x - pos.x, sg.z - pos.z)
        if (d < bestD) {
          bestD = d
          near = sg
        }
      }
      if (!near) return
      const price = cost(near.key)
      ui.setPrompt({
        object: `${U[near.key].name} Lv ${level(near.key)}`,
        action: price == null ? 'MAX' : `Upgrade ${formatMoney(price)}`,
        at: near.at,
        fn: () => buy(near.key),
      })
    },
  }
}
