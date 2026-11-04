// Colyseus link to the Scare Your Neighbor backend (room "world", capped at the number of player bases).
// The server holds the player's ONLY save: nothing about progress is kept in the browser. On join the
// server answers with `progress` (the saved doc: every store's hydrate() takes its part), `noProgress`
// (new account, guest or no database: keep the fresh state and save it) or `serverError` (the save
// could not be read: never overwrite it). From then on the whole snapshot (state counters, stats,
// playtime, the loadout) is sent as `saveProgress` whenever it changed, at most every NET.saveEvery s,
// and when the tab hides or closes. Guests (not signed in to Bloxity) are never saved by the server.
// Besides saving, the room carries presence (remotePlayers.js draws everyone from the roster), the
// neighbour animations of the houses other players engage (neighbours.js), the leaderboards and the
// Free Gift ad payout. Never throws and never blocks play: with no server (or an unreachable one) the
// game runs on a fresh, unsaved state and keeps trying to connect.
import { Client } from '@colyseus/sdk'
import { BASES, DEV_MODE, NET, SERVER_URL } from './config.js'
import {
  authState,
  canResolveServer,
  getEquippedAvatar,
  getPfp,
  getProportions,
  getSkinTextureUrl,
  launchRoomId,
  locateRoom,
  resolveServerEndpoint,
  subscribeAuth,
  updateRoom,
} from './bloxity.js'

export const net = {
  room: null,
  connected: false,
  hydrated: false, // a progress/noProgress answer arrived: saving is allowed
  base: -1, // the player base the server gave this player (BASES.plots index), -1 = none yet
  // Seconds played (tab visible), saved progress included once it loads.
  get playtime() {
    return Math.floor(playtime)
  },
  get sessionId() {
    return this.room?.sessionId ?? null
  },
}

// --- Identity ----------------------------------------------------------------
// Signed-in players use their Bloxity id; everyone else a per-browser guest id (never saved).
// Dev mode (no SDK) plays as a signed-in dev id, so a local server with Mongo keeps its progress.
// Only these ids are stored in the browser, never progress. The dev id is per tab, so two tabs of a
// dev build are two players (one account never has two live sessions: the server evicts the first).
function storedId(store, key, make) {
  try {
    let id = store.getItem(key)
    if (!id) store.setItem(key, (id = make()))
    return id
  } catch {
    return make()
  }
}
const rand = () => Math.random().toString(36).slice(2, 8)
const GUEST = storedId(localStorage, 'scare-neighbour.guest', () => `guest-${rand()}`)
const DEV = DEV_MODE ? storedId(sessionStorage, 'scare-neighbour.dev', () => `dev-${rand()}`) : ''

function identity() {
  if (DEV) return { userId: DEV, username: `Dev ${DEV.slice(4)}` }
  const u = authState.user
  const id = u && (u._id || u.id || u.userId || u.uid)
  if (!id) return { userId: GUEST, username: authState.guest?.displayName || authState.guest?.username || 'Guest' }
  return { userId: String(id), username: String(u.displayName || u.username || u.name || 'Player') }
}

// --- Saving ------------------------------------------------------------------
let playtime = 0 // s, see net.playtime
let lastSaved = ''
let savedAt = 0
let sentId = '' // identity the server currently attributes saves to
let loadedId = '' // identity whose saved progress this tab has already loaded
let stores = [] // { snapshot() -> part of the save, hydrate(doc) }
let pendingDoc = null // a loaded save that arrived before the stores were registered

const progress = () => {
  const out = { playtime: Math.floor(playtime) }
  for (const s of stores) Object.assign(out, s.snapshot())
  return out
}
const isGuest = () => sentId.startsWith('guest-')

// A loaded save over the local state: every store takes its part.
function hydrate(doc) {
  if (!stores.length) return void (pendingDoc = doc)
  pendingDoc = null
  if (Number.isFinite(doc.playtime)) playtime = doc.playtime
  for (const s of stores) {
    try {
      s.hydrate(doc)
    } catch (err) {
      console.warn('[net] hydrate failed', err)
    }
  }
}

export function saveNow() {
  if (!net.connected || !net.hydrated || isGuest() || !stores.length) return
  const snap = JSON.stringify(progress())
  if (snap === lastSaved) return
  lastSaved = snap
  savedAt = performance.now()
  send('saveProgress', JSON.parse(snap))
}

function send(type, payload) {
  try {
    net.room?.send(type, payload)
  } catch (err) {
    console.warn('[net] send failed', type, err)
  }
}

// Handlers registered here are attached to every room this tab joins (reconnects included).
const handlers = []
export function onNetMessage(type, fn) {
  handlers.push([type, fn])
  net.room?.onMessage(type, fn)
}
// Sends to the server if connected; false (nothing sent) otherwise.
export function sendNet(type, payload) {
  if (!net.connected) return false
  send(type, payload)
  return true
}

// --- Roster ---------------------------------------------------------------------
// Everyone in the room (sessionId -> roster entry), null when offline.
export const roster = () => (net.connected ? net.room?.state?.players ?? null : null)
// The North Lane houses other players are engaging (house index string -> entry), null when offline.
export const remoteHouses = () => (net.connected ? net.room?.state?.houses ?? null : null)

// --- Leaderboards (the room's boards: backend leaderboard.ts) ------------------------------------
export const leaderboard = { boards: {}, ranks: {}, at: 0 }
const boardListeners = new Set()
export function onLeaderboard(fn) {
  boardListeners.add(fn)
  if (leaderboard.at) fn(leaderboard)
  return () => boardListeners.delete(fn)
}
onNetMessage('leaderboard', (m) => {
  leaderboard.boards = m?.boards ?? {}
  leaderboard.ranks = m?.ranks ?? {}
  leaderboard.at = Date.now()
  for (const fn of boardListeners) fn(leaderboard)
})

// --- Free Gift (ad payout, backend adGift) ------------------------------------------------------------
// The server's view of the gift cooldown (epoch ms, server clock offset applied) and the pending answer.
export const gift = { nextAt: 0 } // local epoch ms the next gift may be paid
let giftWaiter = null
onNetMessage('giftResult', (m) => {
  if (Number.isFinite(m?.nextAt) && Number.isFinite(m?.serverTime)) gift.nextAt = m.nextAt > m.serverTime ? Date.now() + (m.nextAt - m.serverTime) : 0
  if (m?.reason === 'init') return // the state sent after the load
  giftWaiter?.(m)
  giftWaiter = null
})
// Sends a rewarded ad's token; resolves with the server's { ok, amount, reason } (never rejects).
export function claimGift(token) {
  return new Promise((resolve) => {
    if (!sendNet('adGift', { token })) return resolve({ ok: false, reason: 'offline' })
    const timer = setTimeout(() => {
      giftWaiter = null
      resolve({ ok: false, reason: 'timeout' })
    }, 12000)
    giftWaiter = (m) => {
      clearTimeout(timer)
      resolve(m)
    }
  })
}

// --- Presence (remotePlayers.js) --------------------------------------------------
// What the others need to draw this player: the pose, what it holds / wears and the Bloxity look. The
// latest of each also rides on the join options, so a (re)join shows up right away.
const AVATAR_MAX = 3000 // backend AVATAR_MAX_LEN
// The signed-in player's look as JSON { equipped, proportions, skin }; the skin URL is dropped
// first when it doesn't fit. "" = the default character.
function avatarJson() {
  if (!authState.user) return ''
  const equipped = getEquippedAvatar()
  if (!equipped) return ''
  for (const skin of [getSkinTextureUrl(), null]) {
    try {
      const json = JSON.stringify({ equipped, proportions: getProportions(), skin })
      if (json.length <= AVATAR_MAX) return json
    } catch {
      return ''
    }
  }
  return ''
}
const presence = { pose: null, loadout: null }
let poseKey = ''
let poseAt = 0
const q = (v, k = 100) => Math.round(v * k) / k
// { x, y, z, yaw, speed, vy, grounded, stunned }: at most NET.poseHz a second, nothing while it stands still.
export function sendPose(pose) {
  const p = { x: q(pose.x), y: q(pose.y), z: q(pose.z), yaw: q(pose.yaw), speed: q(pose.speed, 10), vy: q(pose.vy, 10), grounded: !!pose.grounded, stunned: !!pose.stunned }
  presence.pose = p
  if (!net.connected) return
  const now = performance.now()
  if (now - poseAt < 1000 / NET.poseHz) return
  const key = Object.values(p).join('|')
  if (key === poseKey) return
  poseKey = key
  poseAt = now
  send('pose', p)
}
let loadoutKey = ''
// { aura, costume, hold }: sent when it changes. hold = "" | "pkg:<kind>" | "item:<name>".
export function sendLoadout(loadout) {
  presence.loadout = loadout
  const key = JSON.stringify(loadout)
  if (!net.connected || key === loadoutKey) return
  loadoutKey = key
  send('loadout', loadout)
}
let sentAvatar = ''
// The Bloxity look changed (customizer, sign-in/out): send it if it differs.
export function syncAvatar() {
  if (!net.connected) return
  const avatar = avatarJson()
  if (avatar === sentAvatar) return
  sentAvatar = avatar
  send('setAvatar', { avatar })
}
// A Bloxity emote started (id) or stopped (""): the others play the same clip on this player.
export function sendEmote(id) {
  send('emote', { id: id || '' })
}
// The North Lane house this player is driving (neighbours.js): its neighbour's state, at most
// NET.houseHz a second per house; houseEnd when it is back home.
const houseSentAt = new Map()
export function sendHouse(i, data, force = false) {
  if (!net.connected) return
  const now = performance.now()
  if (!force && now - (houseSentAt.get(i) ?? 0) < 1000 / NET.houseHz) return
  houseSentAt.set(i, now)
  send('house', { i, ...data })
}
export function sendHouseEnd(i) {
  houseSentAt.delete(i)
  if (net.connected) send('houseEnd', { i })
}

// --- Connection --------------------------------------------------------------
function attach(room) {
  net.room = room
  net.connected = true
  for (const [type, fn] of handlers) room.onMessage(type, fn)
  room.onMessage('progress', (doc) => {
    net.hydrated = true
    lastSaved = ''
    // A reconnect under the same identity: this tab is newer than the save (it may hold changes
    // not sent yet), so push it rather than load over it.
    if (loadedId === sentId || !doc) return saveNow()
    loadedId = sentId
    hydrate(doc)
    saveNow() // fills in whatever an older save lacked; a no-op send of the same values otherwise
  })
  room.onMessage('noProgress', () => {
    // New account, guest or no database: keep the local progress and push it as the first save.
    net.hydrated = true
    loadedId = sentId
    lastSaved = ''
    saveNow()
  })
  room.onMessage('serverError', () => {
    // The save exists but could not be read: never overwrite it.
    net.hydrated = false
    console.warn('[net] server could not read the saved progress; saving is off for this session')
  })
  room.onStateChange(() => {
    const me = room.state?.players?.get?.(room.sessionId)
    if (me && me.base !== net.base) net.base = me.base
  })
  room.onLeave(() => {
    if (net.room !== room) return
    net.room = null
    net.connected = false
    net.hydrated = false
    net.base = -1
    updateRoom('')
    // Resolve again rather than rejoin the old endpoint: that is how players move off a pod being
    // replaced. Keep trying; play is unaffected meanwhile.
    setTimeout(connect, NET.rejoin * 1000)
  })
}

export const hasServer = () => !!(SERVER_URL || canResolveServer())

// The ?roomId= this page was opened with (Open Rooms Join / friend invite): tried on the first
// connect only, then normal matchmaking.
let launchRoom = launchRoomId()
async function joinLaunchRoom(options) {
  const id = launchRoom
  launchRoom = ''
  if (!id) return null
  try {
    if (SERVER_URL) return { room: await new Client(SERVER_URL).joinById(id.split('~').pop(), options), relay: '' }
    const at = await locateRoom(id)
    if (at) return { room: await new Client(at.endpoint).joinById(at.roomId, options), relay: at.relayRoomId }
  } catch (err) {
    console.info('[net] the invited room is gone or full; matchmaking instead', err?.message ?? err)
  }
  return null
}

// Deployed builds ask the matchmaker on every connect (a new Client per endpoint, each is pinned to
// one pod). userId lets it reuse this player's seat on retries; guest/dev ids are not Bloxity ids.
async function joinAnyRoom(options) {
  if (SERVER_URL) return { room: await new Client(SERVER_URL).joinOrCreate('world', options), relay: '' }
  const { endpoint, relayRoomId } = await resolveServerEndpoint(/^(guest|dev)-/.test(options.userId) ? undefined : options.userId)
  return { room: await new Client(endpoint).joinOrCreate('world', options), relay: relayRoomId }
}

let connecting = false
let retryIn = NET.retry // s: backoff while the matchmaker / server can't be reached
async function connect() {
  if (!hasServer() || connecting || net.connected) return
  connecting = true
  try {
    const id = identity()
    sentId = id.userId
    sentAvatar = avatarJson()
    loadoutKey = JSON.stringify(presence.loadout)
    poseKey = ''
    // base: the plot the client already built its machines on (BASES.mine), taken if it is free.
    const options = { ...id, pfp: getPfp(), avatar: sentAvatar, pose: presence.pose, loadout: presence.loadout, base: BASES.mine }
    const { room, relay } = (await joinLaunchRoom(options)) ?? (await joinAnyRoom(options))
    retryIn = NET.retry
    attach(room)
    // relay~room lets an invited friend join this exact room through its pod's relay (bloxity.js locateRoom).
    updateRoom(relay ? `${relay}~${room.roomId}` : room.roomId)
  } catch (err) {
    console.info(`[net] could not reach the server (retrying in ${retryIn}s); progress is not being saved`, err?.message ?? err)
    setTimeout(connect, retryIn * 1000)
    retryIn = Math.min(retryIn * 2, NET.retryMax)
  } finally {
    connecting = false
  }
}

// Resolves with the player base the server gave this player (BASES.plots index), or -1 when no room
// answered within `ms` (the game then starts offline on the default base and keeps trying to connect).
export function waitForBase(ms) {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const tick = () => {
      if (net.base >= 0) return resolve(net.base)
      if (!hasServer() || performance.now() - t0 > ms) return resolve(-1)
      setTimeout(tick, 60)
    }
    tick()
  })
}

// Playtime ticks once a second while the tab is visible; a changed snapshot is sent at most every
// NET.saveEvery s.
setInterval(() => {
  if (document.hidden) return
  playtime += 1
  if (performance.now() - savedAt >= NET.saveEvery * 1000) saveNow()
}, 1000)

// Starts connecting once Bloxity auth has settled; later auth changes are sign-in / sign-out.
export function initNet() {
  if (!hasServer()) return console.info('[net] no server configured; progress is not being saved')
  subscribeAuth((s) => {
    if (!s.ready) return
    if (!net.connected) return void connect()
    const id = identity()
    syncAvatar() // signed in / out: the others see the new look
    if (id.userId === sentId) return send('identify', { username: id.username, pfp: getPfp() })
    saveNow() // under the old id, before switching
    net.hydrated = false
    sentId = id.userId
    send('identify', { ...id, pfp: getPfp() })
  })
  window.addEventListener('pagehide', saveNow)
  document.addEventListener('visibilitychange', () => document.hidden && saveNow())
}

// stores: everything that is saved, each { snapshot(), hydrate(doc) }. A save that arrived before
// they existed is applied now.
export function setStores(list) {
  stores = list
  if (pendingDoc) hydrate(pendingDoc)
}
