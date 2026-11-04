import { BoxGeometry, CanvasTexture, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Shape, SRGBColorSpace } from 'three'
import { FONT_FAMILY, HOUSES, LOBBY } from './config.js'
import { formatNum, scareChance } from './rules.js'
import { state } from './state.js'
import { effectiveScare, loadout } from './loadout.js'
import { bake } from './bake.js'
import { fontReady, neon, planarUV, put, solidBox, std, studBox, studMat, studPut } from './propkit.js'
import { roundRect } from './textures.js'
import { laneEdges } from './world.js'
import './lobby.css'

// The North Lane houses: one per lot on both sides of the road, in tiers of
// rarity (common near the plaza, legendary at the far north end). Each house
// is a studded white cottage with a hipped roof, chimney, door and windows, a
// white path out to the sidewalk, a wooden scare-info signboard (rarity, your
// scare chance, recommended scare level) on one side of the path and a small
// "Recommended Speed" sign on the other. Walking onto a lot shows the tier
// name as a banner at the top of the screen.

const C = HOUSES.colors
const F = (px, weight = 700) => `${weight} ${px}px ${FONT_FAMILY}, "Arial Black", sans-serif`

// --- Sign textures ---------------------------------------------------------------

// The tier's neighbour, cut off by the frame: head (with hair), torso, arms, legs.
function drawFigure(ctx, x, y, w, h, npc) {
  const cx = x + w / 2
  const head = w * 0.3
  const hy = y + h * 0.08
  ctx.fillStyle = npc.head
  roundRect(ctx, cx - head / 2, hy, head, head * 0.95, head * 0.18)
  ctx.fill()
  if (npc.hat === 'fringe') {
    // A fringe round the sides and back of a bald top.
    ctx.fillStyle = npc.hair
    ctx.fillRect(cx - head / 2 - 2, hy + head * 0.28, head * 0.16, head * 0.42)
    ctx.fillRect(cx + head / 2 - head * 0.14, hy + head * 0.28, head * 0.16, head * 0.42)
  }
  ctx.strokeStyle = '#1b1b1b'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, hy + head * 0.5, head * 0.26, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()
  ctx.fillStyle = '#1b1b1b'
  ctx.fillRect(cx - head * 0.2, hy + head * 0.3, 5, 9)
  ctx.fillRect(cx + head * 0.14, hy + head * 0.3, 5, 9)
  const ty = hy + head * 1.02
  const tw = w * 0.46
  ctx.fillStyle = npc.shirt
  ctx.fillRect(cx - tw / 2, ty, tw, h * 0.42)
  ctx.fillStyle = npc.arms
  ctx.fillRect(cx - tw / 2 - w * 0.2, ty, w * 0.2, h * 0.4)
  ctx.fillRect(cx + tw / 2, ty, w * 0.2, h * 0.4)
  ctx.fillStyle = npc.legs
  ctx.fillRect(cx - tw / 2, ty + h * 0.42, tw, h)
  if (npc.stripes) {
    ctx.fillStyle = npc.stripes
    for (let sx = cx - tw / 2 - w * 0.2 + 6; sx < cx + tw / 2 + w * 0.2; sx += 16) ctx.fillRect(sx, ty, 4, h)
  }
}

function paintScareSign(tier) {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 380
  const draw = () => {
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#0c1130'
    ctx.fillRect(0, 0, 640, 380)
    // Left: rarity header and the villager portrait.
    ctx.fillStyle = '#05070f'
    ctx.fillRect(10, 10, 300, 62)
    ctx.fillStyle = tier.banner[0]
    ctx.font = F(34)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`★ ${tier.label} ★`, 160, 43)
    ctx.save()
    ctx.beginPath()
    ctx.rect(10, 78, 300, 292)
    ctx.clip()
    const g = ctx.createLinearGradient(0, 78, 0, 370)
    g.addColorStop(0, '#20263e')
    g.addColorStop(1, '#0d1020')
    ctx.fillStyle = g
    ctx.fillRect(10, 78, 300, 292)
    drawFigure(ctx, 10, 78, 300, 292, tier.npc)
    ctx.restore()
    // Right top: your scare chance (from your scare level) with its bar.
    const chance = scareChance(tier, effectiveScare()) // scare level x the worn costume
    const good = chance >= 50 ? ['#5cff6c', '#0a2a10'] : chance >= 20 ? ['#ffd23f', '#3a2a00'] : ['#ff3b3b', '#3a0306']
    ctx.fillStyle = '#121a46'
    ctx.fillRect(320, 10, 310, 196)
    ctx.fillStyle = '#ffffff'
    ctx.font = F(27, 600)
    ctx.fillText('YOUR SCARE CHANCE', 475, 44)
    ctx.font = F(70)
    ctx.lineWidth = 8
    ctx.strokeStyle = good[1]
    ctx.strokeText(`${chance}%`, 475, 108)
    ctx.fillStyle = good[0]
    ctx.fillText(`${chance}%`, 475, 108)
    ctx.fillStyle = '#2b3150'
    ctx.fillRect(342, 160, 266, 26)
    ctx.fillStyle = good[0] === '#5cff6c' ? '#3fdc4c' : good[0]
    ctx.fillRect(342, 160, (266 * chance) / 100, 26)
    // Right bottom: recommended scare level.
    ctx.fillStyle = '#3a1d92'
    ctx.fillRect(320, 214, 310, 156)
    ctx.fillStyle = '#e03cff'
    for (let i = 0; i < 3; i++) ctx.fillRect(342 + i * 20, 320 - (i + 1) * 26, 14, (i + 1) * 26)
    ctx.fillStyle = '#ffffff'
    ctx.font = F(25, 600)
    ctx.fillText('RECOMMENDED', 500, 246)
    ctx.fillText('SCARE LEVEL', 500, 278)
    ctx.font = F(54)
    ctx.fillText(`${formatNum(tier.scareLevel)}+`, 500, 332)
  }
  draw()
  return { canvas: c, draw }
}

function paintSpeedSign(speed) {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 200
  const draw = () => {
    const ctx = c.getContext('2d')
    ctx.fillStyle = C.wood
    ctx.fillRect(0, 0, 320, 200)
    ctx.fillStyle = C.woodDark
    for (let y = 0; y < 200; y += 50) ctx.fillRect(0, y, 320, 4)
    ctx.strokeStyle = C.woodDark
    ctx.lineWidth = 10
    ctx.strokeRect(5, 5, 310, 190)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    const outlined = (text, x, y, px, fill) => {
      ctx.font = F(px)
      ctx.lineWidth = px * 0.22
      ctx.strokeStyle = '#123a8a'
      ctx.strokeText(text, x, y)
      ctx.fillStyle = fill
      ctx.fillText(text, x, y)
    }
    outlined('Recommended', 160, 46, 40, '#7fd3ff')
    outlined('Speed:', 160, 92, 40, '#7fd3ff')
    ctx.font = F(52)
    ctx.fillText('👟', 120, 150)
    outlined(formatNum(speed), 196, 150, 58, '#7fd3ff')
  }
  draw()
  return { canvas: c, draw }
}

// A texture that repaints once Fredoka has loaded (and on `repaint()`).
const liveTextures = []
function liveTexture(painted) {
  const tex = new CanvasTexture(painted.canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  const repaint = () => {
    painted.draw()
    tex.needsUpdate = true
  }
  fontReady.then(repaint)
  liveTextures.push(repaint)
  return tex
}

// --- Models (local space: front faces +Z, ground at y = 0) ------------------------

function triangleGeo(w, h, depth) {
  const s = new Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(0, h)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false })
  g.translate(0, 0, -depth / 2)
  return g
}

// The scare-info signboard: two posts on stone feet, a wooden board with a
// gable on top carrying a little lamp, the info panel on the front.
function signboard(panelMat) {
  const g = new Group()
  for (const x of [-1.9, 1.9]) {
    studPut(g, 1.0, 0.6, 1.0, C.stone, x, 0.3, 0)
    studPut(g, 0.45, 1.5, 0.45, C.wood, x, 1.35, 0)
  }
  studPut(g, 5.6, 3.6, 0.4, C.wood, 0, 3.9, 0)
  const panel = new Mesh(new PlaneGeometry(4.9, 2.9), panelMat)
  panel.position.set(0, 3.9, 0.21)
  g.add(panel)
  put(g, triangleGeo(6.0, 1.5, 0.4), std(C.wood), 0, 5.7, 0)
  put(g, new BoxGeometry(3.4, 0.3, 0.5), std(C.woodDark), -1.45, 6.4, 0).rotation.z = 0.46
  put(g, new BoxGeometry(3.4, 0.3, 0.5), std(C.woodDark), 1.45, 6.4, 0).rotation.z = -0.46
  put(g, new BoxGeometry(0.9, 0.55, 0.7), std('#3a2a1e'), 0, 6.45, 0.35)
  put(g, new BoxGeometry(0.62, 0.32, 0.1), neon(C.lamp, 2), 0, 6.42, 0.71, false)
  return g
}

function speedSign(mat) {
  const g = new Group()
  for (const x of [-0.85, 0.85]) studPut(g, 0.28, 1.0, 0.28, C.woodDark, x, 0.5, 0)
  studPut(g, 2.7, 1.75, 0.25, C.wood, 0, 1.75, 0)
  const face = new Mesh(new PlaneGeometry(2.55, 1.6), mat)
  face.position.set(0, 1.75, 0.13)
  g.add(face)
  return g
}

// The cottage itself, `s` = tier scale (studs stay the same size).
function cottage(tier) {
  const s = tier.scale
  const W = HOUSES.width * s
  const D = HOUSES.depth * s
  const H = HOUSES.wallHeight * s
  const g = new Group()
  studPut(g, W, H, D, C.walls, 0, H / 2, -D / 2)
  // Roof: a studded brim and a hipped frustum with a flat top.
  studPut(g, W + 1.4, 0.5, D + 1.4, tier.roof, 0, H + 0.25, -D / 2)
  let hip = new CylinderGeometry(Math.SQRT2 * 0.5, Math.SQRT2, 1, 4, 1)
  hip.rotateY(Math.PI / 4)
  hip.scale((W + 0.6) / 2, 2.4 * s, (D + 0.6) / 2)
  hip.translate(0, H + 0.5 + 1.2 * s, -D / 2)
  hip = hip.toNonIndexed()
  planarUV(hip)
  hip.computeVertexNormals()
  put(g, hip, studMat(tier.roof))
  studPut(g, 1.4, 3.4 * s, 1.4, C.chimney, W * 0.26, H + 1.5 * s, -D * 0.7)
  // Trimmed tiers: a coloured foundation skirt (open at the door) and window sills.
  if (tier.trim) {
    studPut(g, W + 0.6, 1.2, D + 0.3, tier.trim, 0, 0.6, -D / 2 - 0.15)
    const fw = W / 2 + 0.3 - 1.25
    for (const x of [-1, 1]) {
      studPut(g, fw, 1.2, 0.35, tier.trim, x * (1.25 + fw / 2), 0.6, 0.17)
      studPut(g, 2.6, 0.35, 0.6, tier.trim, x * W * 0.3, 1.75, 0.3)
    }
  }
  // Door with its frame and knob, windows either side and on the gable ends.
  studPut(g, 2.5, 3.8, 0.3, tier.trim ?? C.doorFrame, 0, 1.9, 0.1)
  studPut(g, 1.9, 3.4, 0.36, C.door, 0, 1.7, 0.16)
  put(g, new BoxGeometry(0.24, 0.24, 0.2), std(C.knob, { metalness: 0.4, roughness: 0.4 }), 0.6, 1.7, 0.4)
  for (const x of [-1, 1]) {
    studPut(g, 2.2, 2.2, 0.3, C.window, x * W * 0.3, 3.0, 0.08)
    studPut(g, 0.3, 2.2, 2.4, C.window, x * (W / 2 + 0.08), 3.0, -D / 2)
  }
  return { group: g, W, D, H }
}

// Local -> world for a lot at (gx, gz) facing yaw.
export function toWorld(gx, gz, yaw, lx, lz) {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [gx + lx * c + lz * s, gz - lx * s + lz * c]
}

// --- Banner (screen-space tier name) -------------------------------------------------

function makeBanner() {
  const el = document.createElement('div')
  el.className = 'rarity-banner'
  document.body.appendChild(el)
  let shown = null
  return (tier) => {
    if (tier === shown) return
    shown = tier
    if (!tier) {
      el.classList.remove('show')
      return
    }
    el.textContent = tier.name
    el.dataset.text = tier.name
    el.style.setProperty('--top', tier.banner[0])
    el.style.setProperty('--bottom', tier.banner[1])
    el.classList.remove('show')
    void el.offsetWidth // restart the pop animation
    el.classList.add('show')
  }
}

export function buildHouses(scene) {
  const root = new Group()
  const e = laneEdges()
  const lots = [] // { tier, z } for the banner
  const homes = [] // every house: { tier, x, z, yaw } (front door at local (0, 0))
  const pathLen = HOUSES.setback - e.walk
  let z = HOUSES.first

  for (const tier of HOUSES.tiers) {
    const panel = new MeshBasicMaterial({ map: liveTexture(paintScareSign(tier)) })
    const speed = new MeshBasicMaterial({ map: liveTexture(paintSpeedSign(tier.speed)) })
    for (let n = 0; n < tier.count; n++, z -= HOUSES.spacing) {
      lots.push({ tier, z })
      for (const side of [-1, 1]) {
        const yaw = side * -Math.PI / 2 // east houses face west (-X), west houses face east
        const gx = side * HOUSES.setback
        homes.push({ tier, x: gx, z, yaw })
        const lot = new Group()
        const { group, W, D, H } = cottage(tier)
        lot.add(group)
        studPut(lot, 2.6, 0.14, pathLen, C.path, 0, 0.05, pathLen / 2)
        const board = signboard(panel)
        board.position.set(-4.4, 0, 6.0)
        board.rotation.y = 0.3
        lot.add(board)
        const small = speedSign(speed)
        small.position.set(3.4, 0, 6.6)
        small.rotation.y = -0.25
        lot.add(small)
        lot.position.set(gx, 0, z)
        lot.rotation.y = yaw
        root.add(lot)

        // Colliders: house body, signboard, speed sign.
        let [x, wz] = toWorld(gx, z, yaw, 0, -D / 2)
        solidBox(W / 2, H / 2 + 1.5, D / 2, x, H / 2 + 1.5, wz, yaw)
        ;[x, wz] = toWorld(gx, z, yaw, -4.4, 6.0)
        solidBox(2.8, 3.4, 0.5, x, 3.4, wz, yaw + 0.3)
        ;[x, wz] = toWorld(gx, z, yaw, 3.4, 6.6)
        solidBox(1.35, 1.3, 0.3, x, 1.3, wz, yaw - 0.25)
      }
    }
  }

  const baked = bake(root, true)
  baked.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true
  })
  scene.add(baked)

  // Banner: on a lot (off the road and verge, within half a spacing of a house).
  const setBanner = makeBanner()
  const half = HOUSES.spacing / 2
  const firstReach = Math.max(HOUSES.first + half, LOBBY.plazaNorth + 6)
  // Your scare chance on every signboard follows your scare level.
  loadout.subscribe((kind) => {
    if (kind === 'costume') for (const repaint of liveTextures) repaint()
  })
  state.subscribe((key) => {
    if (key === 'scareLevel') for (const repaint of liveTextures) repaint()
  })

  return {
    homes,
    update(pos) {
      let hit = null
      if (Math.abs(pos.x) > e.curb && pos.z < firstReach) {
        for (let i = 0; i < lots.length; i++) {
          const top = i === 0 ? firstReach : lots[i].z + half
          if (pos.z <= top && pos.z > lots[i].z - half) {
            hit = lots[i].tier
            break
          }
        }
      }
      setBanner(hit)
    },
  }
}
