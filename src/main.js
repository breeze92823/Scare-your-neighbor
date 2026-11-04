import * as THREE from 'three'
import { ACESFilmicToneMapping, Clock, Group, PCFSoftShadowMap, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from 'three'
import { BASES, CAMERA, graphicsPreset, HOUSES, NET, RENDER, SCARE } from './config.js'
import * as bloxity from './bloxity.js'
import { install as installInput, onKey } from './input.js'
import { installTouch } from './touch.js'
import { createPlayerBody, interpolate as interpolatePlayer, player, resetPlayer, respawn } from './player.js'
import { setCameraSensitivity, syncYawToPlayer, update as updateCamera } from './camera.js'
import { onModeChanged, toggleMode } from './modes.js'
import { bodyCount, initPhysics, stepPhysics } from './physics.js'
import { createLighting } from './lighting.js'
import { buildWorld } from './world.js'
import { buildHouses } from './houses.js'
import { buildPlaza } from './plaza.js'
import { buildBases } from './bases.js'
import { createHud } from './hud.js'
import { createGameUi } from './gameUi.js'
import { createCarry } from './carry.js'
import { createBase } from './base.js'
import { createBasePanels } from './basePanels.js'
import { createBaseFloor } from './baseFloor.js'
import { createUpgrades } from './upgrades.js'
import { buildNeighbours } from './neighbours.js'
import { installAudio, updateAudio } from './audio/index.js'
import { inputState } from './input.js'
import { state } from './state.js'
import { closeTopWindow, setWindowReserved } from './uiWindow.js'
import { createPostFx } from './postfx.js'
import { setNeonBloom } from './propkit.js'
import { buildDefaultCharacter, loadBaseCharacter } from './avatar/character.js'
import { applyProportions, attachEquippedAccessories } from './avatar/loader.js'
import { disposeAnimator, makeAnimator } from './avatar/animator.js'
import { createShops } from './shops.js'
import { linkBase } from './items.js'
import { effectiveSpeed, loadout } from './loadout.js'
import { prepareRig, wear } from './costumes/index.js'
import { createPlayerAura } from './auras.js'
import { initNet, net, onLeaderboard, roster, sendEmote, sendLoadout, sendPlot, sendPose, setStores, syncAvatar, waitForBase } from './net.js'
import { createRemotePlayers } from './remotePlayers.js'
import { createLeaderboards } from './leaderboards.js'
import { createRemoteBases, plotSnapshot } from './remoteBases.js'
import { createOfflineMoney } from './offlineMoney.js'
import { createGift } from './gift.js'
import { createEmotePlayer } from './emotes.js'
import { statsStore } from './stats.js'
import { A as audioCore } from './audio/core.js'

// Boot order: Bloxity SDK -> renderer -> Rapier (async wasm) -> ground + sky + lighting,
// player body -> avatar (async, swaps in when ready) -> loop. The SDK is optional at every step.
let lighting = null
let renderer = null
let postfx = null

// Settings come from the portal's settings menu (or their defaults offline).
function applySetting(key, value) {
  if (key === 'camera_sensitivity') setCameraSensitivity(value)
  else if (key === 'fullscreen') bloxity.requestFullscreen(value)
  else if (key === 'graphics_quality' && renderer) {
    const next = graphicsPreset(value)
    renderer.shadowMap.enabled = next.shadows
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, next.dpr))
    lighting?.setShadows(next)
    postfx?.configure(next)
    setNeonBloom(next.bloom)
    postfx?.setSize(window.innerWidth, window.innerHeight)
  }
}
bloxity.onSetting(applySetting)
installAudio() // starts on the first gesture
bloxity.init()
initNet() // connects to the room server once Bloxity auth has settled (net.js)

// --- Renderer ---------------------------------------------------------------
const preset = graphicsPreset(bloxity.settings.graphics_quality)
renderer = new WebGLRenderer({ antialias: preset.antialias, powerPreference: 'high-performance' })
renderer.outputColorSpace = SRGBColorSpace
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = RENDER.exposure
renderer.shadowMap.enabled = preset.shadows
renderer.shadowMap.type = PCFSoftShadowMap
renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.dpr))
document.body.appendChild(renderer.domElement)
let closePanel = () => false // the HUD side panel (basePanels.js), once it exists
installInput(() => closeTopWindow() || closePanel() || bloxity.showMenu(), renderer.domElement) // Esc closes a window / panel, else opens the portal menu

const scene = new Scene()
let fall = 0 // 0..1 knocked-down blend (see the loop)
const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far)
postfx = createPostFx(renderer, scene, camera)
postfx.configure(preset)

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  postfx.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

for (const key of Object.keys(bloxity.settings)) applySetting(key, bloxity.settings[key])

// --- Physics + ground + sky --------------------------------------------------
bloxity.loadingStep('Starting physics')
await initPhysics()

// One room seats as many players as there are bases: the server gives this player one. The machines of
// your base are built on it, so wait for the answer (a few seconds at most; offline play keeps the default).
bloxity.loadingStep('Finding a room')
const slot = await waitForBase(NET.joinWait * 1000)
if (slot >= 0) BASES.mine = slot

lighting = createLighting(scene, renderer, preset)
buildWorld(scene) // baseplate, walls, road, lamps, trees
const houses = buildHouses(scene) // the North Lane
const plaza = buildPlaza(scene) // stalls, free gift, leaderboard
const bases = buildBases(scene) // the player plots in the south

// --- HUD -------------------------------------------------------------------------
const hud = createHud()
bloxity.onReservedAreas((areas) => {
  hud.setReserved(areas)
  setWindowReserved(areas)
})
createPlayerBody()
syncYawToPlayer()

// --- Player avatar ----------------------------------------------------------
// The Bloxity base rig (player.glb; procedural fallback if it fails), dressed
// with the signed-in player's equipped cosmetics and body proportions. It
// rebuilds on customizer edits and sign-in/out.
const playerGroup = new Group()
playerGroup.rotation.order = 'YXZ' // yaw, then the knocked-down tip
scene.add(playerGroup)
let avatar = null
let animator = null
const emote = createEmotePlayer() // the Bloxity emote playing on you (emotes.js)
let emoteSent = false
let generation = 0
let avatarReady = false

function setAvatar(next) {
  if (avatar) playerGroup.remove(avatar)
  disposeAnimator(animator)
  avatar = next
  playerGroup.add(avatar)
  emote.stop()
  prepareRig(avatar) // costume holders, at the bind pose (before the animator binds)
  wear(avatar, loadout.worn('costume'))
  animator = makeAnimator(avatar)
}

setAvatar(buildDefaultCharacter()) // visible immediately; replaced once the rig loads

// --- Scare loop: prompts, packages in hand, the neighbours --------------------------------
const ui = createGameUi(camera)
const carry = createCarry(ui, playerGroup)
const neighbours = buildNeighbours(scene, houses.homes, { ui, carry, hud, doorWood: HOUSES.colors.door })

// --- Your base: packages brought home, the items opened from them (HUD side panels) -------
const base = createBase()
const basePanels = createBasePanels(hud.root, base, ui)
// Your plot: click to set packages down, minions break them, E opens / picks up / places items.
const baseFloor = createBaseFloor(scene, base, ui, { carry, camera, canvas: renderer.domElement, isStunned: () => player.stunned > 0, maxCarry: SCARE.maxCarry })
// An item sold from the Sell window while in your hands leaves your hotbar too.
base.subscribe(() => carry.prune((it) => it.held && base.items.includes(it)))
// The booth / treadmill out front and the three Upgrade signs.
const upgrades = createUpgrades({ bases, base, ui, isStunned: () => player.stunned > 0 })
hud.onSquare('box', () => basePanels.toggle('packages'))
hud.onSquare('bag', () => basePanels.toggle('briefcase'))
closePanel = basePanels.close
state.subscribe((key) => {
  if (key === 'speed') player.speedStat = effectiveSpeed() // speed stat x the worn aura
})

// --- Plaza stalls: Aura Shop, Costume Shop, Sell Items (walk into a ring) ---------------------
const shops = createShops({ toast: ui.toast, store: linkBase(base) })
hud.setToast(ui.toast)
const playerAura = createPlayerAura(playerGroup, () => graphicsPreset(bloxity.settings.graphics_quality).particles)

// --- Multiplayer: the other players, the leaderboards, the Free Gift --------------------------------
const remotePlayers = createRemotePlayers(scene, { quality: () => graphicsPreset(bloxity.settings.graphics_quality).particles })
const leaderboards = createLeaderboards(plaza)
const remoteBases = createRemoteBases(scene) // other players' bases: machines, packages, items, minions
onLeaderboard(() => leaderboards.refresh())
const freeGift = createGift({ ui, plaza })
const offlineMoney = createOfflineMoney({ base, bases, ui }) // the Offline Money pile at your base: collect with E
// What is saved on the server (net.js): the HUD counters, the lifetime stats the boards rank, the loadout.
setStores([
  { snapshot: () => ({ money: state.get('money'), speed: state.get('speed'), scareLevel: state.get('scareLevel') }), hydrate: (doc) => state.hydrate(doc) },
  statsStore,
  loadout,
  // Your base: the floor, the levels, the income the server pays offline time with, the uncollected Offline Money.
  {
    snapshot: () => ({ ...base.snapshot(), boothLevel: upgrades.levels().booth, millLevel: upgrades.levels().mill }),
    hydrate(doc) {
      base.hydrate(doc)
      upgrades.setLevels(doc.boothLevel, doc.millLevel)
    },
  },
])
// The portal's ad breaks pause the game and its sound.
let adPaused = false
bloxity.onAdBreak((on) => {
  adPaused = on
  if (on) audioCore.ctx?.suspend?.().catch?.(() => {})
  else audioCore.ctx?.resume?.().catch?.(() => {})
})
// Emote wheel: play the clip on yourself and tell the room, so everyone sees the same emote.
bloxity.onEmote(async (id) => {
  const clip = (await bloxity.loadEmoteClips()).get(id)
  if (!clip || !avatar) return
  emote.play(avatar, clip)
  sendEmote(id)
  emoteSent = true
})
// Chat bubbles over the speaker: you, or the remote player with that Bloxity id.
bloxity.onChatMessage((m) => {
  const root = m.isLocalPlayer ? playerGroup : remotePlayers.byUid(m.userId)
  if (root) bloxity.chatBubble(THREE, root, m)
})
let presenceKey = ''
let ownersAt = 0
let plotAt = 0
loadout.subscribe((kind, id) => {
  if (kind === 'aura') {
    playerAura.set(id)
    player.speedStat = effectiveSpeed()
  } else wear(avatar, id)
})

async function loadAvatar() {
  // The SDK fires twice per change (optimistic + confirmed); only the newest load may land.
  const mine = ++generation
  try {
    const group = await loadBaseCharacter()
    if (mine !== generation) return
    const equipped = bloxity.authState.user ? bloxity.getEquippedAvatar() : null
    await attachEquippedAccessories(group, equipped, { skinTextureUrl: bloxity.getSkinTextureUrl() })
    if (mine !== generation) return
    applyProportions(group, bloxity.authState.user ? bloxity.getProportions() : null)
    setAvatar(group)
    syncAvatar() // the others get the new look
  } finally {
    if (mine === generation) avatarReady = true
  }
}

let signedIn = null
bloxity.subscribeAuth((s) => {
  const now = !!s.user
  if (now !== signedIn) {
    signedIn = now
    loadAvatar() // also runs once at start to swap in the real rig
  }
})
bloxity.onAvatarChanged(loadAvatar)
bloxity.onProportionsChanged(() => {
  applyProportions(avatar, bloxity.getProportions())
  syncAvatar()
})
bloxity.onRespawnRequest(respawn)

// --- Modes + keys --------------------------------------------------------------
onModeChanged((mode) => {
  playerGroup.visible = mode !== 'player' // first person: you are the camera
})
onKey('KeyV', toggleMode)
onKey('KeyN', () => lighting.toggleDayNight())
onKey('KeyR', respawn)
onKey('KeyE', () => ui.triggerPrompt() || neighbours.interact()) // whichever prompt is up (a house, or a package in your base)
for (let i = 0; i < SCARE.maxCarry; i++) onKey(`Digit${i + 1}`, () => carry.toggle(i))
installTouch({ mode: toggleMode, day: () => lighting.toggleDayNight(), respawn })

// --- Loop -------------------------------------------------------------------
const clock = new Clock()
let shownLoading = true
let readySince = 0

// One frame; `fixedDt` is for the dev hook __game.run (a hidden tab gets no animation frames).
function frame(fixedDt) {
  const dt = fixedDt ?? Math.min(clock.getDelta(), 0.1) // clamp huge frames (tab switch, breakpoint)
  const elapsed = clock.elapsedTime

  if (!adPaused) stepPhysics(dt) // runs the player controller + world at the fixed rate, interpolates bodies
  interpolatePlayer()

  // Caught by a neighbour: knocked flat on your back until the stun wears off.
  fall = player.stunned > 0 ? Math.min(1, fall + dt * 7) : Math.max(0, fall - dt * 3)
  const p = player.renderPosition
  playerGroup.position.set(p.x, p.y + fall * 0.4, p.z)
  playerGroup.rotation.set(-fall * Math.PI * 0.5, player.facing, 0)
  animator?.update(dt, {
    grounded: player.grounded,
    speed: player.stunned > 0 ? 0 : Math.hypot(player.velocity.x, player.velocity.z),
    verticalVelocity: player.velocity.y,
    turn: 0,
    holding: carry.holding(),
  })
  // A Bloxity emote ends when you move or jump (or when its clip is over); the room hears it stop.
  if (emote.active && (!player.grounded || Math.hypot(player.velocity.x, player.velocity.z) > 0.8 || player.stunned > 0)) emote.stop()
  emote.update(dt, avatar)
  if (emoteSent && !emote.active) {
    emoteSent = false
    sendEmote('')
  }
  carry.place(avatar)

  // Presence: what the others draw of you (pose ~12x/s while it changes; hold / gear when they change).
  sendPose({ ...player.position, yaw: player.facing, speed: Math.hypot(player.velocity.x, player.velocity.z), vy: player.velocity.y, grounded: player.grounded, stunned: player.stunned > 0 })
  const key = `${loadout.worn('aura') ?? ''}|${loadout.worn('costume') ?? ''}|${carry.holdKey()}`
  if (key !== presenceKey) {
    presenceKey = key
    sendLoadout({ aura: loadout.worn('aura') ?? '', costume: loadout.worn('costume') ?? '', hold: carry.holdKey() })
  }
  remotePlayers.update(dt, player.renderPosition)
  remoteBases.update(dt)
  if (performance.now() - plotAt > 1000) {
    plotAt = performance.now()
    sendPlot(plotSnapshot(base, upgrades)) // your base for the others, when it changed
  }
  if (elapsed - ownersAt > 1) {
    ownersAt = elapsed
    const owners = new Map()
    roster()?.forEach((p) => p.base >= 0 && owners.set(p.base, p.username || 'Player'))
    for (let i = 0; i < BASES.plots.length; i++) if (i !== BASES.mine) bases.setOwner(i, owners.get(i) ?? null)
  }
  leaderboards.update(dt)

  updateCamera(camera, dt)
  plaza.update(dt, elapsed)
  bases.update(elapsed, dt)
  houses.update(player.position)
  neighbours.update(dt, player.position)
  freeGift.update(player.position) // after neighbours.update: it clears the prompt
  updateAudio(dt, {
    camera,
    player: {
      ...player.position,
      vy: player.velocity.y,
      grounded: player.grounded,
      speed: Math.hypot(player.velocity.x, player.velocity.z),
      sprint: inputState.sprint,
      stunned: player.stunned > 0,
    },
  })
  carry.update(player.position, playerGroup.position)
  shops.update(player.position)
  playerAura.update(dt, playerGroup.visible)
  baseFloor.update(dt, player.position, player.facing, playerGroup.position) // after neighbours.update: it may set the prompt
  offlineMoney.update(player.position) // before the signs: a sign's prompt wins when you stand at it
  upgrades.update(dt, player.position) // the machines (training) and the Upgrade sign prompts
  base.update(dt)
  ui.update(dt)
  lighting.update(dt, playerGroup.position)
  postfx.render()

  // Loading ends once the scene has drawn and the avatar has had its chance (max ~5 s).
  if (shownLoading) {
    readySince += dt
    if (avatarReady || readySince > 5) {
      shownLoading = false
      bloxity.notifyFirstFrame()
    }
  }
}
renderer.setAnimationLoop(() => frame())

window.addEventListener('beforeunload', bloxity.teardown)

// Dev-only console hook, e.g. __game.teleport(-24, 0, 6, Math.PI / 2)
if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
  const teleport = (x, y, z, facing = player.facing) => {
    resetPlayer({ x, y, z }, facing)
    syncYawToPlayer()
  }
  // __game.run(2) plays 2 s of game time at 30 fps right now (works in a hidden tab).
  const run = (seconds) => {
    for (let i = 0; i < Math.round(seconds * 30); i++) frame(1 / 30)
  }
  window.__game = { run, net, offlineMoney, remotePlayers, freeGift, leaderboards, emote, player, scene, renderer, camera, postfx, bodies: bodyCount, toggleMode, teleport, state, hud, neighbours, carry, ui, base, baseFloor, upgrades, shops, loadout }
  import('./previewThumbs.js') // __thumbs.costumes() / __thumbs.items('epic'): card art contact sheets
}
