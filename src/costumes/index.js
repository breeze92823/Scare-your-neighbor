// Costume registry: every costumes/<id>.js (id = COSTUMES[].id in config.js) is picked up
// automatically. wear(avatar, id) dresses the live player; costumeThumb(id) renders its
// shop card art on the same base rig.
import { loadBaseCharacter } from '../avatar/character.js'
import { PlayerRig, PoseBuffer } from '../avatar/rig.js'
import { thumb } from '../thumbs.js'
import { dress, prepareRig } from './rig.js'

// Lazy, one file per costume: a costume that fails to load is skipped (logged), it never
// takes the game down with it.
const loaders = {}
for (const [path, load] of Object.entries(import.meta.glob('./*.js'))) {
  const id = path.slice(2, -3)
  if (id !== 'index' && id !== 'rig') loaders[id] = load
}
const loaded = {}
function load(id) {
  if (!id || !loaders[id]) return Promise.resolve(null)
  return (loaded[id] ||= loaders[id]()
    .then((m) => (m.build ? m : null))
    .catch((err) => {
      console.warn('[costumes] failed to load', id, err)
      delete loaded[id]
      return null
    }))
}
export const hasCostume = (id) => !!loaders[id]

// The default card pose: arms a little out, one knee soft.
const deg = (d) => (d * Math.PI) / 180
const CARD_POSE = {
  ArmL1: { x: deg(-6), z: deg(14) },
  ArmR1: { x: deg(-6), z: deg(-14) },
  ArmL2: { x: deg(-10) },
  ArmR2: { x: deg(-10) },
  LegL1: { x: deg(-4) },
  LegR1: { x: deg(4) },
}

// Dresses a prepared avatar root (main.js prepares it before the animator binds). Async
// (the costume's file loads on first use); the newest call per root wins.
export async function wear(root, id) {
  if (!root) return
  const ticket = (root.userData.wearTicket = (root.userData.wearTicket ?? 0) + 1)
  const mod = await load(id)
  if (root.userData.wearTicket !== ticket) return
  dress(root, mod)
}
export { prepareRig }

export function costumeThumb(id) {
  return thumb(
    `costume:${id}`,
    async () => {
      const [root, mod] = await Promise.all([loadBaseCharacter(), load(id)])
      prepareRig(root)
      dress(root, mod)
      const rig = new PlayerRig(root)
      const pose = new PoseBuffer()
      pose.applyDefinition({ ...CARD_POSE, ...(mod?.pose ?? {}) })
      rig.applyPose(pose)
      root.rotation.y = mod?.cardYaw ?? 0
      return root
    },
    { w: 256, h: 300, yaw: -0.42, pitch: 0.1, fit: { target: [0, 1.04, 0], dist: 4.8 } },
  )
}
