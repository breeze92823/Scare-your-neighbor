// Bloxity emotes on the game's own characters. The portal draws the emote wheel and tells the game which
// emote the local player picked (bloxity.onEmote); the clip itself comes from the portal API
// (bloxity.loadEmoteClips): { len, loop, tracks: { boneName: [[time, x, y, z], ...] } } with the angles in
// degrees, added over the bind pose in XYZ order, smoothstep-interpolated, clamped outside the keys.
// Every character (yours and each remote player's) has its own EmotePlayer; it runs after the procedural
// animator each frame, so the clip wins over idle / run on the bones it names. The bones the animator
// drives (rig.js BONE_NAMES) are rebuilt from their rest pose every frame, so the delta is simply
// multiplied on; the other nodes (ArmL_Offset ...) are restored to the bind pose when the clip ends.
import { Euler, Quaternion } from 'three'
import { BONE_INDEX } from './avatar/rig.js'

const DEG = Math.PI / 180
const smooth = (t) => t * t * (3 - 2 * t)

function sample(keys, t) {
  if (!keys?.length) return null
  if (t <= keys[0][0]) return keys[0]
  const last = keys[keys.length - 1]
  if (t >= last[0]) return last
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (t >= a[0] && t <= b[0]) {
      const s = smooth((t - a[0]) / (b[0] - a[0] || 1))
      return [t, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s, a[3] + (b[3] - a[3]) * s]
    }
  }
  return null
}

const euler = new Euler()
const delta = new Quaternion()

export function createEmotePlayer() {
  let clip = null
  let time = 0
  let avatar = null
  const binds = new Map() // node -> bind quaternion, for the nodes the animator does not drive
  return {
    get active() {
      return !!clip
    },
    // Starts `c` (an entry of loadEmoteClips()) on `root` (a character with `.nodes`).
    play(root, c) {
      this.stop()
      if (!root?.nodes || !c) return
      avatar = root
      clip = c
      time = 0
      for (const name of Object.keys(c.tracks)) {
        const node = root.nodes[name]
        if (node && !(name in BONE_INDEX)) binds.set(node, node.quaternion.clone())
      }
    },
    stop() {
      for (const [node, q] of binds) node.quaternion.copy(q)
      binds.clear()
      clip = null
      avatar = null
    },
    // After animator.update(). A changed avatar (look reloaded) ends the clip.
    update(dt, root) {
      if (!clip) return
      if (root !== avatar) return this.stop()
      time += dt
      if (time >= clip.len && !clip.loop) return this.stop()
      const t = clip.loop ? time % clip.len : time
      for (const name in clip.tracks) {
        const node = avatar.nodes[name]
        const v = node && sample(clip.tracks[name], t)
        if (!v) continue
        delta.setFromEuler(euler.set(v[1] * DEG, v[2] * DEG, v[3] * DEG, 'XYZ'))
        if (name in BONE_INDEX) node.quaternion.multiply(delta)
        else node.quaternion.copy(binds.get(node) ?? node.quaternion).multiply(delta)
      }
    },
  }
}
