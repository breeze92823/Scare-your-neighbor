// Wearing a costume: a full-body replacement built on the player's own skeleton, so the
// procedural animator (avatar/animator.js) walks, runs and jumps it unchanged.
//
// Every costume is authored in ABSOLUTE character space at the bind pose, in rig units
// (the base rig is 6.4 units tall, origin between the feet, the character faces +Z,
// its LEFT side is +X, its right side -X). Each part names the bone it follows; the
// part is re-parented under that bone through a "holder" whose bind transform equals
// the character root, so a part placed at its absolute bind position stays exactly
// there in the bind pose and swings with its bone afterwards.
//
// Body blocks of the base rig (for sizing the costume around the same silhouette):
//   head      x -0.8..0.8   y 4.8..6.4   z -0.8..0.8    bone Neck1  (pivot 0, 4.8, 0)
//   torso     x -1.4..1.4   y 2.4..4.8   z -0.8..0.8    chest/shoulders/back: Spine2 (pivot 0, 4.2, 0)
//                                                       hips/belt/skirt/tail: Spine1 (pivot 0, 2.4, 0)
//   left arm  x  1.4..2.6   upper y 3.6..4.8 -> ArmL1 (pivot 2, 4.8, 0.4)
//                           lower y 2.4..3.6 -> ArmL2 (pivot 2, 3.6, 0.4)  (hand = its bottom ~0.55)
//   right arm x -2.6..-1.4  ArmR1 / ArmR2 (mirror)
//   left leg  x  0..1.4     thigh y 1.2..2.4 -> LegL1 (pivot 0.6, 2.4, 0)
//                           shin + foot y 0..1.2 -> LegL2 (pivot 0.6, 1.2, 0)
//   right leg x -1.4..0     LegR1 / LegR2 (mirror)
//   Rig1 = the root (only bobs). Arm depth z -0.8..0.8 (the arm pivot is 0.4 forward).
//
// A costume module (costumes/<id>.js) exports:
//   build(c)  - c.on(boneName, object) adds an Object3D whose position / rotation are
//               absolute bind-pose character space; returns the object.
//   pose      - optional { Bone: { x, y, z } } radians for its shop thumbnail (rig.js PoseBuffer
//               convention: +X swings a limb BACKWARD, +Z rolls; ArmL1 z > 0 lifts the left arm out).
import { Group, Matrix4 } from 'three'

const FALLBACK = { ArmL2: 'ArmL1', ArmR2: 'ArmR1', LegL2: 'LegL1', LegR2: 'LegR1', Spine2: 'Spine1', Neck1: 'Spine2', Spine1: 'Rig1' }
export const COSTUME_BONES = ['Rig1', 'Spine1', 'Spine2', 'Neck1', 'ArmL1', 'ArmL2', 'ArmR1', 'ArmR2', 'LegL1', 'LegL2', 'LegR1', 'LegR2']

// Makes one holder per bone. Must run while the rig is in its bind pose (before an
// animator binds to it). Idempotent.
export function prepareRig(root) {
  if (root.userData.costumeHolders) return root.userData.costumeHolders
  root.updateMatrixWorld(true)
  const rootWorld = root.matrixWorld
  const holders = {}
  const inv = new Matrix4()
  for (const name of COSTUME_BONES) {
    const bone = root.nodes?.[name] ?? (name === 'Rig1' ? root : null)
    if (!bone) continue
    const h = new Group()
    h.name = `costume:${name}`
    h.userData.costume = true
    // holder.local = bone.world^-1 * root.world
    inv.copy(bone.matrixWorld).invert().multiply(rootWorld)
    inv.decompose(h.position, h.quaternion, h.scale)
    bone.add(h)
    holders[name] = h
  }
  root.userData.costumeHolders = holders
  return holders
}

function holderFor(holders, name) {
  let n = name
  while (n && !holders[n]) n = FALLBACK[n]
  return holders[n] ?? holders.Rig1
}

// Shows the base body + accessories again (no costume) or hides them under a costume.
function setBaseVisible(root, on) {
  root.traverse((o) => {
    if (!o.isMesh && !o.isSkinnedMesh) return
    let p = o
    while (p && p !== root) {
      if (p.userData.costume) return
      p = p.parent
    }
    if (on) {
      if (o.userData.baseVisible !== undefined) o.visible = o.userData.baseVisible
    } else {
      if (o.userData.baseVisible === undefined) o.userData.baseVisible = o.visible
      o.visible = false
    }
  })
}

// Dresses `root` (a prepared character) in a costume module, or takes it off (null).
export function dress(root, costume) {
  const holders = prepareRig(root)
  // Free the old costume's GPU buffers (materials are shared from the kit cache and stay;
  // a cached geometry that is used again just re-uploads).
  for (const h of Object.values(holders)) {
    h.traverse((o) => o.geometry?.dispose())
    h.clear()
  }
  if (!costume) {
    setBaseVisible(root, true)
    return
  }
  const c = {
    on(bone, obj) {
      holderFor(holders, bone).add(obj)
      return obj
    },
  }
  costume.build(c)
  setBaseVisible(root, false)
}
