// The other players in the room, drawn in the world (after Clean-leaves-for-loot's remotePlayers.js).
// Everything comes from the synced roster (net.js roster(), backend PlayerState), diffed against the
// scene every frame, so joins / leaves / look changes need no events:
//   * their Bloxity avatar (skin texture, hat / hair / body parts, proportions) on the same base rig the
//     local player uses, with the worn costume and aura;
//   * every animation the procedural animator has: idle, run, jump / fall, landing, the raised arm while
//     holding a stolen package or a base item (which is drawn in the hand), and lying on the back when a
//     neighbour caught them;
//   * their Bloxity emote (the same clip the portal played for them), a name tag, and a chat bubble
//     anchor (`byUid`) for Bloxity chat messages.
// Poses are eased toward the last one relayed plus speed x heading for the time since (dead
// reckoning), so fast runners glide instead of stepping. Nearest first, capped (fewer on touch).
import { Group, Vector3 } from 'three'
import { COARSE_POINTER, NET, PLAYER_DIMS, SCARE } from './config.js'
import { roster, net } from './net.js'
import { label } from './propkit.js'
import { buildDefaultCharacter, loadBaseCharacter } from './avatar/character.js'
import { applyProportions, attachEquippedAccessories } from './avatar/loader.js'
import { disposeAnimator, makeAnimator } from './avatar/animator.js'
import { prepareRig, wear } from './costumes/index.js'
import { createPlayerAura } from './auras.js'
import { KINDS, gripModel, packageModel } from './carry.js'
import { itemModel } from './items/index.js'
import { createEmotePlayer } from './emotes.js'
import { loadEmoteClips } from './bloxity.js'

const MAX = COARSE_POINTER ? NET.maxRemotesTouch : NET.maxRemotes
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const H = SCARE.hold
const pitch = (H.armPitch * Math.PI) / 180
const armY = -Math.cos(pitch)
const armZ = -Math.sin(pitch)
const shoulder = new Vector3()

class Remote {
  constructor(scene, quality) {
    this.scene = scene
    this.group = new Group()
    this.group.rotation.order = 'YXZ' // yaw, then the knocked-down tip
    this.group.visible = false
    scene.add(this.group)
    this.hand = new Group() // the grip in the right fist, group space (+Z = forward)
    this.hand.scale.setScalar(H.scale)
    this.group.add(this.hand)
    this.aura = createPlayerAura(this.group, quality)
    this.emote = createEmotePlayer()
    this.avatar = null
    this.animator = null
    this.avatarJson = null // what the current rig was built from
    this.generation = 0
    this.applied = {} // costume / aura / hold / emote / name as last applied
    this.label = null
    this.placed = false
    this.fall = 0
    this.base = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, at: 0, key: '' }
    this.setAvatar(buildDefaultCharacter())
  }

  setAvatar(next) {
    this.emote.stop()
    if (this.avatar) this.group.remove(this.avatar)
    disposeAnimator(this.animator)
    this.avatar = next
    this.group.add(next)
    prepareRig(next) // costume holders, at the bind pose (before the animator binds)
    wear(next, this.applied.costume || null)
    this.animator = makeAnimator(next)
  }

  // A signed-in player's look arrives as JSON { equipped, proportions, skin }; "" = default.
  async syncAvatar(json) {
    if (json === this.avatarJson) return
    this.avatarJson = json
    const mine = ++this.generation
    if (!json) return this.setAvatar(buildDefaultCharacter())
    let look = null
    try {
      look = JSON.parse(json)
    } catch {
      return
    }
    try {
      const group = await loadBaseCharacter()
      if (mine !== this.generation) return
      await attachEquippedAccessories(group, look?.equipped, { skinTextureUrl: look?.skin || undefined })
      if (mine !== this.generation) return
      applyProportions(group, look?.proportions)
      this.setAvatar(group)
    } catch (err) {
      console.warn('[remote] avatar failed to load', err)
    }
  }

  // The package / item in the hand: "" | "pkg:<kind>" | "item:<name>".
  setHold(hold) {
    this.hand.clear()
    if (hold.startsWith('pkg:')) {
      const kind = hold.slice(4)
      const m = packageModel(kind)
      m.position.y = -(KINDS[kind] ?? KINDS.box).size * 0.4 // grip at the middle of the package
      this.hand.add(m)
    } else if (hold.startsWith('item:')) {
      itemModel(hold.slice(5))
        .then((m) => {
          if (this.applied.hold === hold) this.hand.add(gripModel(m, 0.95 / H.scale))
        })
        .catch(() => {})
    }
  }

  // Gear, hand, name and emote: rebuilt only when they change.
  sync(p, clips) {
    const a = this.applied
    if (p.costume !== a.costume) {
      a.costume = p.costume
      wear(this.avatar, p.costume || null)
    }
    if (p.aura !== a.aura) {
      a.aura = p.aura
      this.aura.set(p.aura)
    }
    if (p.hold !== a.hold) {
      a.hold = p.hold
      this.setHold(p.hold)
    }
    if (p.emote !== a.emote) {
      a.emote = p.emote
      const id = p.emote.split('#')[0]
      const clip = id && clips.get(id)
      if (clip) this.emote.play(this.avatar, clip)
      else this.emote.stop()
    }
    const name = p.username || 'Player'
    if (name !== a.name) {
      a.name = name
      if (this.label) {
        this.group.remove(this.label)
        this.label.material.map?.dispose()
        this.label.material.dispose()
      }
      this.label = label(name, 0.42, { color: '#ffffff', outline: '#1a1c26' })
      this.label.position.y = PLAYER_DIMS.height + 0.6
      this.group.add(this.label)
    }
  }

  update(p, dt, now, near) {
    // A new pose resets the dead-reckoning base.
    const b = this.base
    const key = `${p.x}|${p.y}|${p.z}|${p.yaw}|${p.speed}`
    if (key !== b.key) Object.assign(b, { key, x: p.x, y: p.y, z: p.z, yaw: p.yaw, speed: p.speed, at: now })
    const ahead = Math.min((now - b.at) / 1000, NET.predictMax) * b.speed
    const tx = b.x + Math.sin(b.yaw) * ahead
    const tz = b.z + Math.cos(b.yaw) * ahead
    const g = this.group
    const far = Math.hypot(tx - g.position.x, tz - g.position.z) > 30
    const k = this.placed && !far ? 1 - Math.exp(-NET.remoteLerp * dt) : 1
    // Caught by a neighbour: knocked flat on the back, like the local player.
    this.fall = p.stunned ? Math.min(1, this.fall + dt * 7) : Math.max(0, this.fall - dt * 3)
    g.position.x += (tx - g.position.x) * k
    g.position.y += (b.y + this.fall * 0.4 - g.position.y) * k
    g.position.z += (tz - g.position.z) * k
    g.rotation.y += angleDelta(g.rotation.y, b.yaw) * k
    g.rotation.x = -this.fall * Math.PI * 0.5
    this.placed = true

    this.animator?.update(dt, {
      grounded: p.grounded,
      speed: p.stunned ? 0 : b.speed,
      verticalVelocity: p.vy,
      turn: 0,
      holding: !!p.hold,
    })
    this.emote.update(dt, this.avatar)
    this.placeHold()
    this.aura.update(dt, near)
  }

  // After the animator has posed the arm: the held item goes to the right fist (carry.place).
  placeHold() {
    const bone = this.avatar?.nodes?.ArmR1
    if (!this.hand.children.length || !bone) return
    this.group.updateMatrixWorld(true)
    this.group.worldToLocal(bone.getWorldPosition(shoulder))
    const s = this.avatar.scale.y
    this.hand.position.set(shoulder.x, shoulder.y + (armY * H.reach - H.drop) * s, shoulder.z + armZ * H.reach * s)
  }

  hide() {
    this.group.visible = false
    this.placed = false // snap into place when it comes back
  }

  dispose() {
    this.generation++ // an avatar still loading is dropped
    this.emote.stop()
    this.scene.remove(this.group)
    disposeAnimator(this.animator)
    this.aura.set(null)
    if (this.label) {
      this.label.material.map?.dispose()
      this.label.material.dispose()
    }
  }
}

export function createRemotePlayers(scene, { quality = () => 1 } = {}) {
  const remotes = new Map() // sessionId -> Remote
  const byUidMap = new Map() // Bloxity user id -> Remote
  const list = [] // reused each frame: [{ id, p, d }]
  let clips = new Map()
  loadEmoteClips().then((c) => (clips = c))

  function clear() {
    for (const r of remotes.values()) r.dispose()
    remotes.clear()
    byUidMap.clear()
  }

  return {
    get count() {
      return remotes.size
    },
    // The group of the player with this Bloxity user id (chat bubbles), or null.
    byUid: (uid) => (uid ? byUidMap.get(uid)?.group ?? null : null),
    // viewer: this player's drawn position.
    update(dt, viewer) {
      const players = roster()
      if (!players) return remotes.size && clear()
      const mine = net.sessionId
      list.length = 0
      players.forEach((p, id) => {
        if (id !== mine) list.push({ id, p, d: Math.hypot(p.x - viewer.x, p.z - viewer.z) })
      })
      list.sort((a, b) => a.d - b.d)
      const now = performance.now()
      const keep = new Set()
      byUidMap.clear()
      for (let i = 0; i < Math.min(MAX, list.length); i++) {
        const { id, p, d } = list[i]
        keep.add(id)
        let r = remotes.get(id)
        if (!r) remotes.set(id, (r = new Remote(scene, quality)))
        if (p.uid) byUidMap.set(p.uid, r)
        r.sync(p, clips)
        r.syncAvatar(p.avatar)
        if (d > NET.remoteFade) {
          if (r.group.visible || r.placed) r.hide()
          continue
        }
        r.group.visible = true
        r.update(p, dt, now, d < NET.detailRange)
      }
      for (const [id, r] of remotes) {
        if (keep.has(id)) continue
        r.dispose()
        remotes.delete(id)
      }
    },
  }
}
