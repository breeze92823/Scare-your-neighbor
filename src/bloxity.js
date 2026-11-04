// The Bloxity (Legion) SDK facade. Every SDK call goes through here. Nothing
// here may throw when the SDK is missing: a blocked sdk.bloxity.io leaves the
// game fully playable on the default avatar and keyboard controls.
// Docs: https://docs.bloxity.io/#html5
import { GAME_SLUG, GAME_TITLE, GIFT, LEADERBOARD, SETTINGS, DEV_MODE, coerceSetting } from './config.js'

export function sdk() {
  if (DEV_MODE) return null
  return (typeof window !== 'undefined' && window.Legion && window.Legion.SDK) || null
}

// --- State --------------------------------------------------------------
export const settings = {}
for (const key of Object.keys(SETTINGS)) settings[key] = coerceSetting(key, SETTINGS[key].def)

// `user` is only written from onUserChanged (re-reading getUser()). `ready`
// flips once auth has settled so the signed-in avatar load isn't pre-empted.
export const authState = { ready: false, user: null, guest: null }

let latestEquipped = null
let latestProportions = null
const avatarListeners = new Set()
const proportionListeners = new Set()
const authListeners = new Set()
const settingListeners = new Set()
const respawnListeners = new Set()
const emoteListeners = new Set()
const chatListeners = new Set()
const adBreakListeners = new Set()
const unsubscribers = []

function emit(listeners, ...args) {
  for (const fn of listeners) {
    try {
      fn(...args)
    } catch (err) {
      console.warn('[bloxity] listener threw', err)
    }
  }
}

// Fires on any customizer change (may fire twice: optimistic, then confirmed;
// keep handlers idempotent). Each returns an unsubscribe.
export function onAvatarChanged(fn) {
  avatarListeners.add(fn)
  return () => avatarListeners.delete(fn)
}
export function onProportionsChanged(fn) {
  proportionListeners.add(fn)
  return () => proportionListeners.delete(fn)
}
export function subscribeAuth(fn) {
  authListeners.add(fn)
  fn(authState)
  return () => authListeners.delete(fn)
}
// fn(key, value) on every change of a SETTINGS key (already coerced).
export function onSetting(fn) {
  settingListeners.add(fn)
  return () => settingListeners.delete(fn)
}
// The portal's own pause-menu "Respawn" button.
export function onRespawnRequest(fn) {
  respawnListeners.add(fn)
  return () => respawnListeners.delete(fn)
}
// The portal's emote wheel: fn(emoteId) when the local player picks an emote (Legion.SDK.player 'play_emote').
export function onEmote(fn) {
  emoteListeners.add(fn)
  return () => emoteListeners.delete(fn)
}
// Bloxity chat: fn({ userId, username, text, isGif, at, isLocalPlayer }) for every message in the room.
export function onChatMessage(fn) {
  chatListeners.add(fn)
  return () => chatListeners.delete(fn)
}
// fn(true) when an ad break starts (pause + mute), fn(false) when it ends.
export function onAdBreak(fn) {
  adBreakListeners.add(fn)
  return () => adBreakListeners.delete(fn)
}

// --- Auth ---------------------------------------------------------------
// The SDK fires onUserChanged immediately with a null user, then again once the
// portal handshake answers; a null user only settles auth after a grace period.
const GUEST_SETTLE_MS = 2500
let settleTimer = null

function settleAuth() {
  settleTimer = null
  if (authState.ready) return
  authState.ready = true
  emit(authListeners, authState)
}

function onUser() {
  const SDK = sdk()
  const user = SDK ? SDK.auth.getUser() : null
  latestEquipped = null // a different account's equip event must not linger
  latestProportions = null

  if (user || authState.ready) {
    if (settleTimer) clearTimeout(settleTimer)
    settleTimer = null
    authState.ready = true
  } else if (!settleTimer) {
    settleTimer = setTimeout(settleAuth, GUEST_SETTLE_MS)
  }
  authState.user = user
  try {
    authState.guest = user || typeof SDK.auth.getGuest !== 'function' ? null : SDK.auth.getGuest()
  } catch {
    authState.guest = null
  }
  emit(authListeners, authState)
}

// Name for the HUD badge.
export function displayName() {
  const u = authState.user
  if (u) return u.displayName || u.username || u.name || 'Player'
  const g = authState.guest
  if (g) return g.displayName || g.username || g.name || 'Guest'
  return sdk() ? 'Guest' : 'Offline'
}

// The player's Bloxity profile picture (user, else the guest's derived one) as an absolute
// http(s) URL, '' when there is none. Relative paths resolve against the CDN (staticUrl).
export function getPfp() {
  const raw = authState.user?.pfp || authState.guest?.pfp
  if (typeof raw !== 'string' || !raw) return ''
  try {
    let base = 'https://static.bloxity.io'
    try {
      base = sdk()?.environment?.()?.staticUrl || base
    } catch {
      // Older SDK builds have no environment().
    }
    const url = new URL(raw, base)
    return /^https?:$/.test(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

// --- Init ---------------------------------------------------------------
let initialised = false

export function init() {
  if (initialised) return
  initialised = true

  const SDK = sdk()
  if (!SDK) {
    if (DEV_MODE) console.info('[bloxity] VITE_DEV_MODE=true: skipping SDK/CDN, running on the default avatar')
    else console.info('[bloxity] SDK not loaded: running offline on the default avatar')
    authState.ready = true
    emit(authListeners, authState)
    return
  }

  try {
    const onLocalhost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    SDK.init(onLocalhost ? { gameSlug: GAME_SLUG, portalUrl: 'https://bloxity.io' } : { gameSlug: GAME_SLUG })
    SDK.game.loadingStep(`Loading ${GAME_TITLE}`)

    for (const key of Object.keys(SETTINGS)) {
      const off = SDK.settings.listen(key, (raw) => {
        const next = coerceSetting(key, raw)
        if (settings[key] === next) return
        settings[key] = next
        emit(settingListeners, key, next)
      })
      if (typeof off === 'function') unsubscribers.push(off)
    }
    SDK.settings.triggerAll?.()

    unsubscribers.push(SDK.auth.onUserChanged(onUser))

    if (typeof SDK.avatar?.onAvatarChanged === 'function') {
      unsubscribers.push(
        SDK.avatar.onAvatarChanged((equipped) => {
          // The event payload wins over getEquipped(), which can lag the event.
          if (equipped && typeof equipped === 'object') latestEquipped = equipped
          emit(avatarListeners)
        }),
      )
    }
    if (typeof SDK.avatar?.onProportionsChanged === 'function') {
      unsubscribers.push(
        SDK.avatar.onProportionsChanged((proportions) => {
          if (proportions && typeof proportions === 'object') latestProportions = proportions
          emit(proportionListeners)
        }),
      )
    }

    unsubscribers.push(
      SDK.player.onEvent((event, data) => {
        if (event === 'respawn_request') emit(respawnListeners)
        else if (event === 'play_emote' && data) emit(emoteListeners, String(data))
      }),
    )
    // The portal draws the emote wheel and the chat box; the game plays the emote and floats the bubble.
    try {
      SDK.game.registerFeature?.('emotes')
    } catch {
      // Older SDK builds.
    }
    const offChat = SDK.chat?.onMessage?.((m) => emit(chatListeners, m))
    if (typeof offChat === 'function') unsubscribers.push(offChat)
    const offStart = SDK.ads?.onBreakStart?.(() => emit(adBreakListeners, true))
    const offEnd = SDK.ads?.onBreakEnd?.(() => emit(adBreakListeners, false))
    for (const off of [offStart, offEnd]) if (typeof off === 'function') unsubscribers.push(off)
    defineBoards()

    SDK.game.loadingStep('Building the island')
  } catch (err) {
    console.warn('[bloxity] init failed; running without the SDK', err)
    authState.ready = true
    emit(authListeners, authState)
  }
}

export function loadingStep(text) {
  try {
    sdk()?.game.loadingStep(text)
  } catch {
    // Non-fatal.
  }
}

let announcedFirstFrame = false

// Call once the scene has rendered: tells the portal loading is done.
export function notifyFirstFrame() {
  if (announcedFirstFrame) return
  announcedFirstFrame = true
  const SDK = sdk()
  if (!SDK) return
  try {
    SDK.game.loadingEnd()
    SDK.game.gameplayStart()
  } catch {
    // Non-fatal.
  }
}

export function teardown() {
  for (const off of unsubscribers.splice(0)) {
    try {
      off()
    } catch {
      // Tearing down anyway.
    }
  }
  try {
    sdk()?.game.gameplayEnd()
  } catch {
    // Non-fatal.
  }
}

// --- Avatar accessors (null when the SDK is unavailable or the call throws) ---
export function getEquippedAvatar() {
  if (latestEquipped) return latestEquipped
  try {
    return sdk()?.avatar.getEquipped() ?? null
  } catch {
    return null
  }
}

// { height, shoulderWidth, armLength, legOffsetX, torsoScaleX, neckHeight,
// headScale }, normalised around 1.0; loader.js applyProportions() consumes it.
export function getProportions() {
  try {
    const current = sdk()?.avatar.getProportions()
    return latestProportions ? { ...current, ...latestProportions } : current ?? null
  } catch {
    return latestProportions
  }
}

// Skin texture URL with the worn face, shirt and pants already drawn on.
export function getSkinTextureUrl() {
  try {
    const url = sdk()?.avatar?.getSkinTextureUrl?.()
    return typeof url === 'string' && url ? url : null
  } catch {
    return null
  }
}

export const canCustomize = () => typeof sdk()?.avatar?.toggleCustomizer === 'function'

// Opens / closes the portal's avatar editor; edits come back through onAvatarChanged.
export function toggleCustomizer() {
  try {
    sdk()?.avatar.toggleCustomizer()
  } catch {
    // Ignore.
  }
}

// --- Game server ------------------------------------------------------
// Bloxity hosting has no fixed socket URL: the matchmaker picks a pod with room (or wakes one) and
// the SDK returns its endpoint (the dev channel reaches the dev backend, prod the prod one). Each
// endpoint is pinned to one pod, so net.js builds a new Client per resolve.
export function canResolveServer() {
  try {
    return typeof sdk()?.net?.resolveEndpoint === 'function'
  } catch {
    return false
  }
}
// { endpoint, relayRoomId }: relayRoomId is the matchmaker relay pinning the pod (the endpoint is
// {playUrl}/v1/ws/<relayRoomId>). Rejects (net.js retries with backoff) when the matchmaker can't answer.
export async function resolveServerEndpoint(userId) {
  const { endpoint, roomId, cold } = await sdk().net.resolveEndpoint(GAME_SLUG, userId ? { userId } : undefined)
  if (cold) console.info('[net] waking up a server...')
  return { endpoint, relayRoomId: roomId }
}

// The ?roomId= the page was opened with: the game page's Open Rooms Join button (a bare Colyseus
// room id) or a friend invite (what updateRoom() reported: "<relayRoomId>~<colyseusRoomId>").
export function launchRoomId() {
  try {
    return new URLSearchParams(location.search).get('roomId') || ''
  } catch {
    return ''
  }
}

// Where a launch room lives: { endpoint, roomId, relayRoomId }, or null when it is gone, full or
// can't be found. A bare id needs the matchmaker's cross-pod directory (a plain joinById through
// any relay would usually land on another pod); a relay~room id is joined through its relay.
export async function locateRoom(id) {
  const playUrl = (() => {
    try {
      return sdk()?.environment?.()?.playUrl
    } catch {
      return '' // Older SDK builds have no environment().
    }
  })()
  if (!playUrl || !id) return null
  const base = playUrl.replace(/\/$/, '')
  const [relay, roomId] = id.includes('~') ? id.split('~', 2) : ['', id]
  if (relay) return { endpoint: `${base.replace(/^http/i, 'ws')}/v1/ws/${encodeURIComponent(relay)}`, roomId, relayRoomId: relay }
  const res = await fetch(`${base}/v1/dir/${encodeURIComponent(GAME_SLUG)}/list`)
  const rooms = res.ok ? (await res.json())?.rooms ?? [] : []
  const r = rooms.find((r) => r.colyseusRoomId === roomId && !r.locked && r.players < r.maxPlayers)
  return r ? { endpoint: r.joinUrl, roomId: r.colyseusRoomId, relayRoomId: r.relayRoomId } : null
}

// Reports the room this player is in ('' = not in a joinable room), so the portal's friend invites
// land in it.
export function updateRoom(roomId) {
  try {
    sdk()?.game?.updateRoom?.(roomId)
  } catch {
    // Ignore.
  }
}

// Tells the portal who is in the room (join toasts, "who is here"). `already` = they were there when we
// joined (playerInRoom), else they came after us (playerJoined).
export function reportPlayer(username, already) {
  if (!username) return
  try {
    const game = sdk()?.game
    if (already) game?.playerInRoom?.(username)
    else game?.playerJoined?.(username)
  } catch {
    // Ignore.
  }
}

// --- Portal -----------------------------------------------------------
export function showMenu() {
  try {
    sdk()?.portal.showMenu(true)
  } catch {
    // Ignore.
  }
}

// Where Boxity draws its own controls over the game: the toolbar in the top-left corner and
// the chat feed under it, as [{ id, left, top, width, height }] in CSS px. fn runs now and on
// every change (resize, toolbar change). Without the SDK (dev mode, blocked CDN) it gets the
// default footprint the SDK itself assumes until the portal reports, so the HUD is laid out
// the same everywhere. Returns an unsubscribe.
export function onReservedAreas(fn) {
  try {
    const off = sdk()?.ui?.onReservedAreasChange?.((areas) => fn(Array.isArray(areas) ? areas : []))
    if (typeof off === 'function') return off
  } catch {
    // Fall back to the estimate below.
  }
  const update = () => fn(estimatedReservedAreas(window.innerWidth, window.innerHeight))
  window.addEventListener('resize', update)
  update()
  return () => window.removeEventListener('resize', update)
}

// The SDK's estimate (legion-sdk ui.estimatedAreas): an 8 px margin round one row of buttons,
// the whole width on narrow phones, and the chat feed under it.
function estimatedReservedAreas(w, h) {
  const compact = w < 640 || h <= 500
  const toolbarHeight = 16 + (w < 640 ? 32 : w < 768 ? 40 : 44)
  const chatWidth = compact ? Math.min(w * 0.7, 260) : Math.min(w * 0.8, 360)
  return [
    { id: 'toolbar', left: 0, top: 0, width: Math.min(w, w < 480 ? w : 330), height: toolbarHeight },
    { id: 'chat', left: 0, top: toolbarHeight, width: Math.round(chatWidth + 8), height: compact ? 140 : 180 },
  ]
}

export function requestFullscreen(on) {
  try {
    const SDK = sdk()
    if (!SDK) return
    if (on) SDK.portal.requestFullscreen()
    else SDK.portal.exitFullscreen()
  } catch {
    // Ignore.
  }
}

// --- Chat bubbles ---------------------------------------------------------------
// Floats the message over `root` (a Three.js Object3D: the player group / a remote player's group) for
// SDK.chat.bubbleSeconds. Returns false when the SDK can't (offline).
export function chatBubble(THREE, root, message) {
  try {
    const chat = sdk()?.chat
    if (!chat?.attachBubble || !root) return false
    chat.attachBubble(THREE, root, chat.bubbleText ? chat.bubbleText(message) : String(message.text ?? ''), { height: 2.6 })
    return true
  } catch {
    return false
  }
}

// --- Emotes ---------------------------------------------------------------------
// The emote clips from the portal: Map id -> { len, loop, tracks: { bone: [[t, x, y, z], ...] } } (degrees).
let emoteClips = null
export function loadEmoteClips() {
  emoteClips ||= (async () => {
    const out = new Map()
    try {
      const apiUrl = sdk()?.environment?.()?.apiUrl
      if (!apiUrl) return out
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/avatar/emotes`)
      if (!res.ok) return out
      const body = await res.json()
      const list = Array.isArray(body) ? body : Array.isArray(body?.emotes) ? body.emotes : Object.entries(body?.emotes ?? body ?? {}).map(([id, c]) => ({ id, ...c }))
      for (const c of list) {
        const id = String(c?.id ?? c?._id ?? c?.emoteId ?? '')
        if (id && c.tracks && Number(c.len) > 0) out.set(id, { len: Number(c.len), loop: !!c.loop, tracks: c.tracks })
      }
    } catch (err) {
      console.warn('[bloxity] emote clips failed to load', err)
    }
    return out
  })()
  return emoteClips
}

// --- Rewarded ads (the Free Gift) ---------------------------------------------------
export const adsAvailable = () => {
  if (DEV_MODE) return true // the simulated ad
  try {
    const ads = sdk()?.ads
    return !!ads && (typeof ads.isAvailable !== 'function' || !!ads.isAvailable())
  } catch {
    return false
  }
}
// Plays a rewarded ad: { status: 'completed' | 'skipped' | 'no-fill' | 'blocked' | 'error' | 'denied' | 'disabled',
// rewardToken?, reason?, test? }. Never rejects. Grant only on 'completed'. Without the SDK (dev mode) a
// short simulated ad completes, so the whole gift flow can be tried locally.
export async function showRewardedAd(placement = GIFT.placement) {
  const ads = sdk()?.ads
  if (!ads?.showRewarded) {
    if (!DEV_MODE) return { status: 'disabled', reason: 'no-sdk' }
    await new Promise((r) => setTimeout(r, 1200))
    return { status: 'completed', test: true, rewardToken: 'dev-token' }
  }
  try {
    return (await ads.showRewarded(placement)) ?? { status: 'error' }
  } catch (err) {
    return { status: 'error', reason: String(err?.message ?? err) }
  }
}

// --- Leaderboards -----------------------------------------------------------------
// The portal draws its own leaderboard button (Boxity toolbar) once boards are defined. define() runs once
// after init; the first call creates each board, later edits are made in the Boxity dashboard.
function defineBoards() {
  try {
    sdk()?.leaderboard?.define?.(
      LEADERBOARD.bloxity.map((b) => ({ id: b.id, label: b.label, order: 'desc', mode: 'best', format: 'compact', reset: 'none' })),
    )
  } catch (err) {
    console.warn('[bloxity] leaderboard.define failed', err)
  }
}
// Submits a final score (null without a Boxity player or the SDK). Never every frame.
export async function submitScore(id, score) {
  try {
    return (await sdk()?.leaderboard?.submit?.(id, score)) ?? null
  } catch {
    return null
  }
}
// { rows: [{ rank, name, score }], me } from Bloxity's board, or null.
export async function getTopBoard(id, limit = 7) {
  try {
    const lb = sdk()?.leaderboard
    if (!lb?.getTop) return null
    const top = await lb.getTop(id, { period: 'all', limit })
    const rows = (top?.rows ?? []).map((r, i) => ({
      rank: r.rank ?? i + 1,
      name: String(r.displayName ?? r.username ?? r.name ?? r.user?.displayName ?? r.user?.username ?? 'Player'),
      score: Number(r.score ?? r.value ?? 0),
    }))
    return { rows, me: top?.me ?? null }
  } catch {
    return null
  }
}
export function openBoard(id) {
  try {
    return !!sdk()?.leaderboard?.open?.(id)
  } catch {
    return false
  }
}
