import { BoxGeometry, CanvasTexture, CircleGeometry, CylinderGeometry, ConeGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RingGeometry, SRGBColorSpace } from 'three'
import { FONT_FAMILY, GIFT, LEADERBOARD, LOBBY, STALLS } from './config.js'
import { bake } from './bake.js'
import { fontReady, label, neon, planarUV, put, solidBox, std, studBox, studMat, studPut } from './propkit.js'
import { paintStripes, roundRect, toTexture } from './textures.js'

// The spawn plaza props: three market stalls (Sell Items, Speed Auras, Scare
// Costumes) each in a glowing ring with a floating name, the spinning Free
// Gift on its pad, and the tall green-framed Top Money/s leaderboard.

const DARK = LOBBY.colors.lampPost

// A glowing ring on the ground with a faint fill.
export function groundRing(parent, color, radius, x = 0, z = 0) {
  const ring = new Mesh(new RingGeometry(radius - 0.35, radius, 56), neon(color, 2.2))
  ring.rotation.x = -Math.PI / 2
  ring.position.set(x, 0.07, z)
  const inner = new Mesh(new RingGeometry(radius * 0.86, radius * 0.86 + 0.08, 56), neon(color, 1.2))
  inner.rotation.x = -Math.PI / 2
  inner.position.set(x, 0.07, z)
  const fill = new Mesh(new CircleGeometry(radius - 0.35, 56), new MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }))
  fill.rotation.x = -Math.PI / 2
  fill.position.set(x, 0.06, z)
  parent.add(fill, ring, inner)
}

// --- Stalls -----------------------------------------------------------------------

function goods(g, kind) {
  if (kind === 'auras') {
    ;['#ffe23a', '#b04dff', '#ff8a2a'].forEach((c, i) => put(g, new BoxGeometry(0.7, 0.7, 0.7), neon(c, 1.8), -1.4 + i * 1.4, 2.2, 0.2).rotation.set(0.5, 0.6, 0.2))
  } else if (kind === 'sell') {
    studPut(g, 0.9, 0.7, 0.7, '#ffd23f', -1.4, 2.2, 0.1)
    studPut(g, 0.7, 0.9, 0.7, '#e2262e', 0, 2.3, 0.2)
    studPut(g, 0.8, 0.6, 0.8, '#4fae47', 1.3, 2.15, 0)
  } else {
    // Ghost, witch (cone hat) and a clown in miniature.
    studPut(g, 0.8, 1.2, 0.6, '#e8f4ff', 1.5, 2.45, 0.1)
    put(g, new BoxGeometry(0.14, 0.14, 0.05), std('#222'), 1.35, 2.7, 0.42)
    put(g, new BoxGeometry(0.14, 0.14, 0.05), std('#222'), 1.65, 2.7, 0.42)
    studPut(g, 0.7, 1.0, 0.5, '#2b1f3a', 0, 2.35, 0.1)
    put(g, new ConeGeometry(0.45, 0.9, 8), std('#3b2a5a'), 0, 3.3, 0.1)
    put(g, new CylinderGeometry(0.6, 0.6, 0.06, 12), std('#3b2a5a'), 0, 2.88, 0.1)
    studPut(g, 0.7, 0.9, 0.5, '#e8562a', -1.5, 2.3, 0.1)
    studPut(g, 0.5, 0.4, 0.4, '#3a6be0', -1.5, 2.95, 0.1)
  }
}

function stall(s) {
  const g = new Group()
  studPut(g, 5, 1.6, 2.2, s.color, 0, 0.8, 0)
  studPut(g, 5.3, 0.25, 2.5, DARK, 0, 1.72, 0)
  for (const x of [-2.45, 2.45]) for (const z of [-1.0, 1.0]) put(g, new BoxGeometry(0.22, 4.2, 0.22), std(DARK), x, 2.1, z)
  const stripes = toTexture(paintStripes(s.stripe, '#ffffff', 5), { srgb: true })
  const awn = new MeshStandardMaterial({ map: stripes, roughness: 0.7 })
  const roof = put(g, new BoxGeometry(5.9, 0.22, 3.3), awn, 0, 4.25, 0.2)
  roof.rotation.x = 0.16
  put(g, new BoxGeometry(5.9, 0.45, 0.12), awn, 0, 3.92, 1.85)
  goods(g, s.goods)
  return g
}

// --- Free gift --------------------------------------------------------------------

function giftBox() {
  const g = new Group()
  studPut(g, 2.4, 2.4, 2.4, GIFT.color, 0, 1.2, 0)
  studPut(g, 0.55, 2.46, 2.46, GIFT.ribbon, 0, 1.2, 0)
  studPut(g, 2.46, 2.46, 0.55, GIFT.ribbon, 0, 1.2, 0)
  studPut(g, 0.7, 0.5, 0.7, GIFT.ribbon, 0, 2.6, 0)
  put(g, studBox(1.0, 0.6, 0.45), studMat(GIFT.ribbon), -0.6, 2.75, 0).rotation.z = 0.5
  put(g, studBox(1.0, 0.6, 0.45), studMat(GIFT.ribbon), 0.6, 2.75, 0).rotation.z = -0.5
  return g
}

// --- Leaderboard ------------------------------------------------------------------

// The board face: a title, a small source line ("Game" / "Boxity") and up to LEADERBOARD.rows rows of
// [name, value]. setPage() repaints it; plaza callers feed it from leaderboards.js.
function paintBoard() {
  const c = document.createElement('canvas')
  c.width = 420
  c.height = 640
  let page = { title: LEADERBOARD.boards[0].title, sub: '', rows: [] }
  const draw = () => {
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#efe4cc'
    ctx.fillRect(0, 0, 420, 640)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    ctx.font = `700 46px ${FONT_FAMILY}, sans-serif`
    ctx.lineWidth = 10
    ctx.strokeStyle = '#0c4a14'
    ctx.strokeText(page.title, 210, 44)
    ctx.fillStyle = '#4fe35a'
    ctx.fillText(page.title, 210, 44)
    ctx.font = `600 22px ${FONT_FAMILY}, sans-serif`
    ctx.fillStyle = '#5a4a2a'
    ctx.fillText(page.sub, 210, 84)
    if (!page.rows.length) {
      ctx.font = `600 28px ${FONT_FAMILY}, sans-serif`
      ctx.fillStyle = '#5a4a2a'
      ctx.fillText(LEADERBOARD.placeholder, 210, 320)
      return
    }
    const fills = ['#d9a93e', '#9aa1ad', '#c27a3c']
    page.rows.slice(0, LEADERBOARD.rows).forEach(([name, value], i) => {
      const y = 106 + i * 76
      ctx.fillStyle = fills[i] ?? '#7d838d'
      roundRect(ctx, 14, y, 392, 66, 8)
      ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      roundRect(ctx, 64, y + 8, 334, 50, 6)
      ctx.fill()
      ctx.font = `700 44px ${FONT_FAMILY}, sans-serif`
      ctx.lineWidth = 7
      ctx.strokeStyle = '#2a2a2a'
      ctx.strokeText(String(i + 1), 40, y + 35)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(String(i + 1), 40, y + 35)
      ctx.textAlign = 'left'
      ctx.font = `600 26px ${FONT_FAMILY}, sans-serif`
      ctx.fillText(String(name).slice(0, 14), 76, y + 34)
      ctx.textAlign = 'right'
      ctx.font = `700 22px ${FONT_FAMILY}, sans-serif`
      ctx.fillText(String(value), 390, y + 34)
      ctx.textAlign = 'center'
    })
  }
  draw()
  return {
    canvas: c,
    draw,
    setPage(next) {
      page = next
      draw()
    },
  }
}

function leaderboard() {
  const g = new Group()
  const F = LEADERBOARD.frame
  for (const x of [-4.4, 4.4]) studPut(g, 1.1, 13.6, 1.1, F, x, 6.8, 0)
  studPut(g, 9.9, 1.1, 1.1, F, 0, 13.05, 0)
  studPut(g, 9.9, 1.1, 1.1, F, 0, 0.55, 0)
  studPut(g, 7.8, 11.4, 0.3, '#d8ccb2', 0, 6.8, -0.2)
  const painted = paintBoard()
  const tex = new CanvasTexture(painted.canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  fontReady.then(() => {
    painted.draw()
    tex.needsUpdate = true
  })
  const face = new Mesh(new PlaneGeometry(7.7, 11.4), new MeshBasicMaterial({ map: tex }))
  face.position.set(0, 6.8, -0.04)
  g.add(face)
  g.userData.setPage = (page) => {
    painted.setPage(page)
    tex.needsUpdate = true
  }
  return g
}

export function buildPlaza(scene) {
  const statics = new Group()
  const live = new Group() // sprites, rings and the animated gift stay unbaked

  for (const s of STALLS) {
    const g = stall(s)
    g.position.set(s.x, 0, s.z)
    statics.add(g)
    groundRing(live, s.ring, 4.2, s.x, s.z + 0.6)
    const tag = label(s.name, 2.4, { color: s.text, outline: s.outline })
    tag.position.set(s.x, 6.4, s.z)
    live.add(tag)
    solidBox(2.6, 0.9, 1.25, s.x, 0.9, s.z)
  }

  // Free Gift: tan pad with a green ring, the gift turning and bobbing above it.
  const pad = put(statics, planarUV(new CylinderGeometry(3.6, 3.6, 0.16, 40)), studMat(GIFT.pad), GIFT.x, 0.08, GIFT.z)
  pad.castShadow = false
  groundRing(live, GIFT.ring, 4.0, GIFT.x, GIFT.z)
  const gift = giftBox()
  gift.position.set(GIFT.x, 0.2, GIFT.z)
  live.add(gift)
  let giftTag = label('Free Gift!', 2.2, { color: GIFT.text, outline: GIFT.outline })
  giftTag.userData.text = 'Free Gift!'
  giftTag.position.set(GIFT.x, 5.6, GIFT.z)
  live.add(giftTag)
  solidBox(1.3, 1.6, 1.3, GIFT.x, 1.6, GIFT.z)

  const board = leaderboard()
  const setBoardPage = board.userData.setPage
  board.position.set(LEADERBOARD.x, 0, LEADERBOARD.z)
  board.rotation.y = LEADERBOARD.yaw
  statics.add(board)
  solidBox(5, 7, 0.7, LEADERBOARD.x, 7, LEADERBOARD.z, LEADERBOARD.yaw)

  const baked = bake(statics, true)
  baked.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true
  })
  scene.add(baked, live)

  return {
    // Repaints the leaderboard: { title, sub, rows: [[name, value], ...] } (leaderboards.js).
    setBoard: setBoardPage,
    // The Free Gift's name sprite text (gift.js): "Free Gift!" while ready, a hint while it is cooling down.
    setGiftTag(text) {
      if (giftTag.userData.text === text) return
      const next = label(text, 2.2, { color: GIFT.text, outline: GIFT.outline })
      next.position.copy(giftTag.position)
      next.userData.text = text
      live.remove(giftTag)
      giftTag.material.map?.dispose()
      giftTag.material.dispose()
      live.add(next)
      giftTag = next
    },
    update(dt, elapsed) {
      gift.rotation.y += dt * 0.7
      gift.position.y = 0.35 + Math.sin(elapsed * 2) * 0.2
    },
  }
}
