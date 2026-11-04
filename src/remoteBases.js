// The other players' bases, as their owners left them (after bases.js / baseFloor.js, which draw your own).
// Every plot's fence, hut and ground are built for all of them already; here the owner's live side is added
// on top of it: the Scare booth and treadmill, the packages waiting to be broken, the items standing on the
// floor, the minions at work and a level tag. The owner sends a compact snapshot of their base (`plotSnapshot`,
// net.js sendPlot, only when it changes); every client diffs it against the roster entry's `plot` field each
// frame, so a joining player sees the bases already in the room and nothing needs events.
// Snapshot: { b: booth level, m: mill level, l: base level, n: minions, p: [[kind, x, z, broken]], i: [[name, x, z]] }
// with x / z plot-local metres.
import { Group } from 'three'
import { BASE_FLOOR, BASES, SCARE } from './config.js'
import { roster, net } from './net.js'
import { label } from './propkit.js'
import { scareBooth, treadmill } from './bases.js'
import { FLOOR_Y, fit, minionModel } from './baseFloor.js'
import { packageModel } from './carry.js'
import { itemModel } from './items/index.js'

const r1 = (v) => Math.round(v * 10) / 10

// What this player's base holds, for the room: the levels, the packages on the floor and the active items.
export function plotSnapshot(base, upgrades) {
  const lv = upgrades.levels()
  return JSON.stringify({
    b: lv.booth,
    m: lv.mill,
    l: lv.base,
    n: base.minions(),
    p: base.packages.map((p) => [p.tier.pkg.kind, r1(p.x), r1(p.z), p.hp <= 0 ? 1 : 0]),
    i: base.items.filter((it) => it.active).map((it) => [it.name, r1(it.x), r1(it.z)]),
  })
}

class RemoteBase {
  constructor(scene, index) {
    const cfg = BASES.plots[index]
    this.group = new Group() // plot-local space: +Z = the open front
    this.group.position.set(cfg.x, 0, cfg.z)
    this.group.rotation.y = cfg.yaw
    scene.add(this.group)
    this.scene = scene
    this.key = null
    this.content = null
    this.minions = []
    this.t = Math.random() * 6
    // The machines don't change shape, only their levels do.
    const L = BASES.layout
    for (const [model, [x, z]] of [[scareBooth(), L.booth], [treadmill(), L.mill]]) {
      model.position.set(x, 0, z)
      model.rotation.y = Math.PI
      this.group.add(model)
    }
  }

  // Rebuilds what stands on the floor from a snapshot (a JSON string).
  apply(json) {
    this.key = json
    if (this.content) {
      this.group.remove(this.content)
      this.content.traverse((o) => {
        if (o.isSprite) {
          o.material.map?.dispose()
          o.material.dispose()
        }
      })
    }
    this.minions = []
    const c = (this.content = new Group())
    this.group.add(c)
    let s
    try {
      s = JSON.parse(json)
    } catch {
      return
    }
    const L = BASES.layout
    const tag = label(`Booth ${s.b | 0} · Treadmill ${s.m | 0} · Base ${s.l | 0}`, 0.7, { color: '#ffffff', outline: '#1a1c26' })
    tag.position.set(L.owner[0], 3.4, L.owner[1])
    c.add(tag)
    for (const [kind, x, z, broken] of s.p ?? []) {
      const pkg = packageModel(String(kind))
      pkg.position.set(x, FLOOR_Y, z)
      if (broken) pkg.rotation.z = 0.35 // broken open, waiting for its owner
      c.add(pkg)
    }
    for (const [name, x, z] of s.i ?? []) {
      const holder = new Group()
      holder.position.set(x, FLOOR_Y, z)
      c.add(holder)
      itemModel(String(name))
        .then((m) => {
          if (this.content !== c) return
          fit(m, BASE_FLOOR.itemHeight)
          holder.add(m)
        })
        .catch(() => {})
    }
    // The minions stand about the hut door, a little sway so the base looks alive.
    const [dx, dz] = BASE_FLOOR.door
    const n = Math.min(s.n | 0, BASE_FLOOR.minions[BASE_FLOOR.minions.length - 1])
    for (let k = 0; k < n; k++) {
      const m = minionModel()
      m.obj.position.set(dx + 1.4 + (k % 3) * 1.1, FLOOR_Y, dz + 1.6 + Math.floor(k / 3) * 1.2)
      m.obj.rotation.y = 0.5
      c.add(m.obj)
      this.minions.push(m)
    }
  }

  update(dt) {
    this.t += dt
    this.minions.forEach((m, i) => {
      const w = Math.sin(this.t * 3 + i * 1.7)
      m.arms[0].rotation.x = w * 0.6 - 0.3
      m.arms[1].rotation.x = -w * 0.6 - 0.3
    })
  }

  dispose() {
    this.apply('{}')
    this.scene.remove(this.group)
  }
}

export function createRemoteBases(scene) {
  const bases = new Map() // plot index -> RemoteBase
  return {
    update(dt) {
      const players = roster()
      const live = new Set()
      players?.forEach((p, id) => {
        if (id === net.sessionId || p.base < 0 || p.base === BASES.mine || !BASES.plots[p.base]) return
        live.add(p.base)
        let rb = bases.get(p.base)
        if (!rb) bases.set(p.base, (rb = new RemoteBase(scene, p.base)))
        if (p.plot && p.plot !== rb.key) rb.apply(p.plot)
        rb.update(dt)
      })
      for (const [i, rb] of bases) {
        if (live.has(i)) continue
        rb.dispose()
        bases.delete(i)
      }
    },
  }
}
