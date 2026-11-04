// Every tunable constant lives here; the rest of src/ holds no theme values.

// --- Identity -------------------------------------------------------------
// Slug registered on bloxity.io (resolveEndpoint, rewarded ads, leaderboards). Override per build with VITE_GAME_SLUG.
export const GAME_SLUG = import.meta.env.VITE_GAME_SLUG || 'scare-your-neighbor'
export const GAME_TITLE = 'Scare Your Neighbor'

// Forces the Bloxity SDK and avatar CDN to be treated as unavailable (see .env.example).
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

// --- World (metres: +X east, +Z south, +Y up) -------------------------------
export const GROUND_Y = 0
// The lobby (world.js, houses.js, plaza.js): a lego-stud baseplate boxed in by tall
// brick walls. The spawn plaza is at the south end; the North Lane (a road lined
// with neighbour houses, rarer the further north) runs from it toward -Z.
export const STUD = { tile: 2, perTile: 4 } // m per stud texture tile, studs per tile side
export const LOBBY = {
  // Plaza (open green square with the stalls): x in [-plazaHalf, plazaHalf], z in [plazaNorth, plazaSouth].
  plazaHalf: 95,
  plazaNorth: -12,
  plazaSouth: 122,
  // North Lane corridor, measured out from the road centre line (x = 0) on each side.
  laneHalf: 48, // inner face of the side walls
  laneEnd: -470, // z of the north wall
  roadStart: -6, // z where the asphalt begins (in the plaza, between the middle stalls)
  roadHalf: 7, // asphalt half width
  curb: 1.6, // pale curb strip beside the asphalt
  verge: 6.4, // grass strip with the street lamps and trees
  sidewalk: 3.4, // white walkway in front of the house lots
  lampEvery: 24, // m between street lamps (both sides, staggered with trees)
  wall: { height: 30, thickness: 4, cap: 1.6 },
  colors: {
    grass: '#5fbc66',
    sidewalk: '#dfe5e3',
    curb: '#c4ccd0',
    road: '#3a4050',
    roadLine: '#f4f4f4',
    roadDash: '#f2c624',
    brick: '#c0714f',
    wallCap: '#4daf4f',
    trunk: '#7a4a2a',
    leaves: ['#7fd05a', '#63bf4a', '#9ade6b'],
    bush: '#4fae47',
    flower: '#e63b3b',
    planter: '#8a5634',
    lampPost: '#2d2f3a',
    lampLight: '#fff1b8',
  },
}
// House tiers along the North Lane, south (spawn end) to north. `count` houses per
// side; each tier is a little larger and changes the roof colour.
export const HOUSES = {
  first: -32, // z of the first pair of houses
  spacing: 26, // m between houses along the lane
  setback: 33.5, // |x| of a house's front wall (faces the road)
  width: 11, // along the lane
  depth: 9, // away from the road
  wallHeight: 5,
  colors: {
    walls: '#e6eaee',
    door: '#7a4a2e',
    doorFrame: '#5d6572',
    knob: '#f2c94c',
    window: '#a9dcf5',
    chimney: '#8a4a3c',
    path: '#e9eeec',
    wood: '#b5652e',
    woodDark: '#8a4620',
    stone: '#a2a8b0',
    lamp: '#fff27a',
  },
  // Per tier: roof / trim colours, banner gradient, `chance` = scare chance (%) at exactly
  // the recommended `scareLevel`, the recommended `speed` stat (the neighbour chases at
  // about the run speed that stat gives, see SCARE.speed), house `scale`, houses per
  // side, the neighbour (`npc`, also drawn on the signboard) and the package they keep.
  tiers: [
    {
      name: 'common', label: 'COMMON', roof: '#5d6572', trim: null, banner: ['#ffffff', '#bfc4cc'],
      chance: 75, scareLevel: 10, speed: 1, scale: 1, count: 3,
      npc: { name: 'Noob', hat: null, head: '#f5d22a', hair: null, shirt: '#2f7ad8', arms: '#f5d22a', legs: '#4caa3c', stripes: null, tag: '#ffffff' },
      pkg: { kind: 'box', value: 250 },
    },
    {
      name: 'uncommon', label: 'UNCOMMON', roof: '#3f9a52', trim: '#5d78b8', banner: ['#c9ffcf', '#3fcf5f'],
      chance: 75, scareLevel: 800, speed: 900, scale: 1.08, count: 3,
      npc: { name: 'Old Man', hat: 'fringe', head: '#efd9c4', hair: '#f4f4f4', shirt: '#cfe0ee', arms: '#cfe0ee', legs: '#b9cddd', stripes: '#8fb0cc', tag: '#bfffa8' },
      pkg: { kind: 'crate', value: 2500 },
    },
    {
      name: 'rare', label: 'RARE', roof: '#3a68d0', trim: '#c9a46a', banner: ['#cfe4ff', '#3f8bff'],
      chance: 75, scareLevel: 5000, speed: 6000, scale: 1.16, count: 3,
      npc: { name: 'Chef', hat: 'chef', head: '#f1c9a5', hair: '#ffffff', shirt: '#ffffff', arms: '#ffffff', legs: '#2b2b33', stripes: null, tag: '#a8d4ff' },
      pkg: { kind: 'crate', value: 15000 },
    },
    {
      name: 'epic', label: 'EPIC', roof: '#8a4fd8', trim: '#4a3a6a', banner: ['#f0d6ff', '#a65bff'],
      chance: 75, scareLevel: 30000, speed: 40000, scale: 1.24, count: 3,
      npc: { name: 'Agent', hat: 'cap', head: '#e8b98f', hair: '#1c1c22', shirt: '#22232b', arms: '#22232b', legs: '#22232b', stripes: null, tag: '#e0b8ff' },
      pkg: { kind: 'safe', value: 90000 },
    },
    {
      name: 'legendary', label: 'LEGENDARY', roof: '#e8a92c', trim: '#c23a3a', banner: ['#fff6c2', '#ffb326'],
      chance: 75, scareLevel: 200000, speed: 250000, scale: 1.32, count: 3,
      npc: { name: 'King', hat: 'crown', head: '#f1c9a5', hair: '#ffd23f', shirt: '#b0262e', arms: '#b0262e', legs: '#e8e2d0', stripes: null, tag: '#ffe27a' },
      pkg: { kind: 'chest', value: 600000 },
    },
  ],
}
// The scare loop (neighbours.js): knock, scare before they give up, steal the package
// they drop, outrun them back past the plaza line (LOBBY.plazaNorth), sell it.
export const SCARE = {
  promptRange: 5.5, // m from the door at which Knock / Steal show
  scareRange: 14, // m from the door the SCARE! button keeps working
  knockDelay: 0.9, // s between the knock and the door opening
  answerTime: 3.2, // s the neighbour waits at the door for a scare
  laughTime: 2.4, // s of laughing after a failed scare
  scaredTime: 7, // s the package lies on the step before they pick it up again
  reactTime: 0.7, // s after the steal before the chase starts
  catchRadius: 1.5, // m: closer than this and you are caught
  stunTime: 2.2, // s lying on the ground after being caught
  cooldown: 3, // s before a house can be knocked on again
  maxCarry: 8, // packages in the hotbar
  // The equipped hotbar item, held out in the right hand (arm raised straight forward).
  hold: {
    armPitch: -88, // deg on ArmR1 (negative = forward), elbow straight
    blendRate: 14, // 1/s ease of the arm up / down when you equip / unequip
    reach: 3.05, // rig units from the shoulder pivot to the grip along the arm
    drop: 0.4, // rig units the grip sits under the shoulder pivot (the arm hangs 0.4 behind it at rest)
    scale: 0.55, // held package size vs the one on the ground
  },
  // Chance: `chance` at the recommended level; below it falls off as (level/rec)^2,
  // above it rises toward `maxChance`.
  maxChance: 98,
  // Speed stat -> run speed: walk/sprint * (1 + log10(stat) * perDecade).
  speed: { perDecade: 0.35, chaseFactor: 0.95 }, // neighbour = 0.95 x walk speed at the recommended stat
  lines: {
    answer: "Yes? Who's there?",
    nobody: '...nobody? Weird.',
    chase: 'HEY! Come back!',
    caught: 'GOT YOU!',
    giveUp: 'Grr... next time!',
    recover: 'Hmph. Kids these days.',
  },
}
// Plaza props (plaza.js). x/z are world positions; ring = the glowing circle on the ground.
export const STALLS = [
  { name: 'Sell Items', x: -36, z: -2, color: '#c9343c', stripe: '#e8434b', ring: '#ff4d57', text: '#ff7a7a', outline: '#4a0b10', goods: 'sell' },
  { name: 'Speed Auras', x: -17, z: -2, color: '#2c4fd0', stripe: '#3fb8ff', ring: '#3fd2ff', text: '#7fd0ff', outline: '#0b1a4a', goods: 'auras' },
  { name: 'Scare Costumes', x: 17, z: -2, color: '#5b33b8', stripe: '#9a63ff', ring: '#ffe03a', text: '#ffd23f', outline: '#3b2300', goods: 'costumes' },
]
// The Free Gift: stand next to it and watch a rewarded ad (Bloxity ads.showRewarded) for `reward` $. The
// server (backend AD_GIFT_MONEY / AD_GIFT_COOLDOWN_MS) decides the amount and the wait; these are the
// offline/dev fallbacks and the wording.
export const GIFT = {
  x: 34, z: -4, color: '#2fcf3f', ribbon: '#e2262e', pad: '#d9bc8c', ring: '#3dff5a', text: '#7cf07c', outline: '#0c3a12',
  reward: 100, // $
  cooldown: 60, // s between gifts
  range: 5, // m from the gift at which the prompt shows
  placement: 'free-gift', // rewarded-ad placement (lowercase letters, digits, hyphens)
  tagReady: 'Free Gift!',
  tagBusy: 'Come back soon',
  toastWait: 'Next gift in {s}s',
  toastNoAd: 'No ad available right now - try again soon.',
  toastDenied: 'Ad cancelled - no gift this time.',
  toastPaid: 'Free Gift: +{amount}!',
}
// The plaza board (plaza.js): rotates through the room server's boards (backend LEADERBOARD_STATS, top
// 7 of the whole game) and Bloxity's own board (Legion.SDK.leaderboard, the one in the portal's
// trophy button). `bloxity` lists the boards defined with leaderboard.define() (up to 10, ids are
// permanent: a-z 0-9 _ -); each is fed from the matching saved stat.
export const LEADERBOARD = {
  x: 43,
  z: -9,
  yaw: -0.65, // radians; 0 faces +Z (south)
  frame: '#2fe33a',
  rows: 7,
  rotateEvery: 9, // s per page
  boards: [
    { stat: 'earned', title: 'Top Earners', format: 'money' },
    { stat: 'scares', title: 'Most Scares', format: 'count' },
    { stat: 'steals', title: 'Top Thieves', format: 'count' },
    { stat: 'playtime', title: 'Longest Playing', format: 'time' },
  ],
  bloxity: [
    { id: 'earned', stat: 'earned', label: 'Top Earners', format: 'compact' },
    { id: 'scares', stat: 'scares', label: 'Most Scares', format: 'compact' },
    { id: 'steals', stat: 'steals', label: 'Top Thieves', format: 'compact' },
  ],
  bloxityEvery: 60, // s between getTop refreshes
  submitEvery: 30, // s: Bloxity scores are sent when changed, at most this often
  placeholder: 'Be the first on the board!',
}
// The multiplayer link (net.js): backend room "world" (Colyseus). Deployed builds find a pod through
// the Bloxity matchmaker; VITE_SERVER_URL (e.g. ws://localhost:2567) points a dev build at a local server.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || ''
export const NET = {
  poseHz: 12, // pose messages per second
  houseHz: 10, // neighbour state messages per second while a house is engaged
  saveEvery: 5, // s: a changed snapshot is saved at most this often
  retry: 3, // s: first reconnect delay (doubles up to retryMax)
  retryMax: 30,
  rejoin: 2, // s before resolving a new endpoint after a drop
  joinWait: 9, // s the loading screen waits for a room (and your base) before starting offline
  remoteLerp: 14, // 1/s ease of a remote player toward its pose
  predictMax: 0.25, // s of dead reckoning
  maxRemotes: 12, // drawn at once (bases = room size, minus you)
  maxRemotesTouch: 8,
  remoteFade: 260, // m: farther players are hidden
  detailRange: 70, // m: nearer players get their held item and aura
}
// Player-base count = the room size. backend src/constants.ts ROOM_MAX_CLIENTS must equal BASES.plots.length.

// Player bases (bases.js): fenced brown plots around the south half of the plaza,
// open on the side facing the plaza centre, each with a red-roofed Minions hut in
// a back corner. Rows: along the south wall, and along the east and west walls.
// `yaw` is the direction the open front faces (0 = +Z south, PI = north).
export const BASES = {
  width: 26, // along the front
  depth: 22, // front to back
  colors: { floor: '#b06a4a', fence: '#f4f6f8', hutWall: '#7e4630', hutRoof: '#c2313b', hutDoor: '#1c1e28', sign: '#2a2c38' },
  plots: [
    // South row, fronts facing north toward the plaza.
    ...[-64, -32, 0, 32, 64].map((x) => ({ x, z: 107, yaw: Math.PI })),
    // East and west rows, fronts facing the middle.
    ...[4, 36, 68].map((z) => ({ x: 80, z, yaw: -Math.PI / 2 })),
    ...[4, 36, 68].map((z) => ({ x: -80, z, yaw: Math.PI / 2 })),
  ],
  mine: 2, // index of the local player's base (until the server assigns one)
  // The owned base's machine labels ({n} = the current level's amount, UPGRADES).
  machines: { scare: '+{n}/SCARE', step: '+{n}/STEP', offline: 'OFFLINE MONEY!' },
  // Plot-local [x, z] of the owned base's pieces (+Z = out of the open front, which is at
  // z = depth / 2). The booth and treadmill stand on the grass facing the plot, each with
  // its Upgrade sign on its -X side; the Upgrade Base sign faces out at the front corner.
  layout: {
    booth: [7.5, 17.6],
    boothSign: [3.4, 16.4],
    mill: [-1.8, 17.4],
    millSign: [-5.6, 16.4],
    upgrade: [-8.8, 13.0],
    owner: [2.6, 14.2], // the "Your Base" name tag
    pile: [-3, 6], // the offline-money pile (inside the plot)
  },
}
// Your base's storage (base.js, basePanels.js). Packages you carry onto your plot wait
// there unopened (Packages panel, box button). Opening one rolls PACKAGE_ODDS for its
// house tier, then an item of that rarity from INDEX. Items sit in the base (Briefcase
// panel, suitcase button); the active ones earn item value x `ratePerValue` $/s
// (Yo Yo: $320 -> $4/s). `slots` active at first, +`perBuy` per purchase at `costs`.
export const BASE_STORAGE = { ratePerValue: 1 / 80, slots: 7, perBuy: 2, costs: [500e3, 5e6, 50e6, 500e6] }
// Your base floor (baseFloor.js). Standing on your plot with a package in hand, click
// (tap) the floor to set it down there (a ghost shows where; `clearance` m from other
// things, `edge` m inside the fence). Minions walk out of the Minions hut and punch it
// (`damage` every `hitEvery` s, "-1" pops) until its HP (`hp[tier]`) is 0; then E opens
// it (within `useRange`) with an effect that grows with the item's rarity (`fx`), and
// the item stands where the package was. E picks a floor item up into your hotbar, and
// E with it in hand puts it down `dropAhead` m in front of you. `minions[level - 1]` per
// base level (Upgrade Base).
export const BASE_FLOOR = {
  hp: { common: 11, uncommon: 20, rare: 32, epic: 50, legendary: 80 },
  damage: 1,
  hitEvery: 1, // s: 1 damage/s per minion (the "1/s" over the hut)
  minions: [1, 2, 3, 4, 5],
  minionSpeed: 4.2, // m/s
  standOff: 0.95, // m from the package centre a minion punches from
  door: [-10.6, -7.6], // where minions step out of the hut
  useRange: 2.8, // m: Open / Pick Up prompts
  dropAhead: 1.6, // m in front of you an item is put down
  clearance: 1.3, // m between things on the floor
  edge: 1.2, // m kept clear inside the fence
  dropTime: 0.4, // s of the toss from your hands onto the floor
  itemHeight: 1.3, // m an item model is scaled to (largest side)
  minion: { skin: '#ffd23f', shirt: '#ff8a1e', pants: '#3b5bd6', hat: '#f2c624', shoe: '#2b2f42' },
  // Opening effect per rarity: 0 = puff + chime, 1 = + sparkle fountain and ring,
  // 2 = + light pillar and fanfare, 3 = + double pillar, screen flash and a deep boom.
  fx: { common: 0, uncommon: 0, rare: 1, epic: 1, legendary: 2, mythical: 2, cosmic: 3, secret: 3, horror: 3 },
  // Where Briefcase Equip / Equip Best put an item (first free one, plot-local x, z).
  itemSpots: [-6, -2, 2, 6].flatMap((z) => [-8, -4.5, -1, 2.5, 6, 9.5].map((x) => [x, z])),
}
// The owned base's machines and their Upgrade signs (upgrades.js, drawn by bases.js).
//   booth - standing on the red pad scares every `every` s: +per[level - 1] scare level.
//   mill  - on the belt you walk by yourself toward the arch at `walk` m/s (the belt
//           runs back as fast, so you stay on it; motor hum, moving slats, display):
//           +per[level - 1] speed every `every` s. Holding a key against it (back /
//           sideways) drifts you off at `drift` m/s.
//   base  - Upgrade Base: each level adds a minion (BASE_FLOOR.minions).
// E / tap the "Upgrade" prompt within `range` m of a sign buys the next level for
// costs[level - 1] (no entry = max level). The red "!" shows while you can afford it.
export const UPGRADES = {
  range: 3.4,
  booth: { name: 'Scare Booth', per: [10, 25, 60, 150, 400], costs: [12e3, 60e3, 300e3, 1.5e6], every: 1.2 },
  mill: { name: 'Treadmill', per: [1, 2, 5, 12, 30], costs: [15e3, 75e3, 400e3, 2e6], every: 2, walk: 4.5, drift: 1.6 },
  base: { name: 'Base', costs: [500e3, 5e6, 50e6, 500e6] },
}
export const SPAWN = { x: 0, y: 0.05, z: 24 }
export const SPAWN_FACING = Math.PI // yaw the character faces on spawn (PI = toward -Z)

// --- Player modes (modes.js) -------------------------------------------------
// 'character' = third-person chase cam with the avatar on screen.
// 'player' = first-person, the camera is the player's eyes and the avatar is hidden.
export const MODES = ['character', 'player']
export const START_MODE = 'character'

// --- Physics (physics.js, player.js) ------------------------------------------
export const PHYSICS = {
  gravity: -22, // m/s^2 for dynamic bodies and the player
  fixedStep: 1 / 60, // s per physics tick; rendering interpolates between ticks
  maxSubSteps: 5, // a long frame never runs more ticks than this
  walkSpeed: 8, // m/s
  sprintSpeed: 14, // m/s with Shift held
  accel: 70, // m/s^2 toward the target velocity on the ground
  airAccel: 22, // m/s^2 steering while airborne
  decel: 60, // m/s^2 when no key is held
  turnSpeed: 12, // rad/s the body turns toward its heading
  jumpSpeed: 8.5, // m/s
  coyoteTime: 0.1, // s after leaving a ledge a jump still counts
  jumpBuffer: 0.12, // s a jump pressed before landing is remembered
  stepHeight: 0.45, // m autostep
  maxSlope: 50, // degrees the player can walk up
  snapToGround: 0.4, // m the controller stays glued to downward steps and slopes
  pushMass: 80, // kg the character weighs when shoving crates
  killY: -6, // sank this far: respawn
}
export const PLAYER_DIMS = { radius: 0.75, height: 1.8 } // capsule the character controller moves

// --- Look ------------------------------------------------------------------
export const RENDER = { exposure: 1.0 }
export const FOG = { near: 170, far: 650 }
// The two lighting moods lighting.js blends between (key N toggles).
export const TIME_OF_DAY = {
  transition: 2.5, // s to blend day <-> night
  day: {
    zenith: '#1576f0',
    horizon: '#a9e2ff',
    sunColor: '#fff4de',
    // Sun + hemi + env together keep the pale sand (#eed39c) near its own tan;
    // much more and ACES washes it (and the props) out to grey-white.
    sunIntensity: 2.4,
    sunElevation: 55, // degrees above the horizon
    sunAzimuth: 35, // degrees, 0 = from +Z
    hemiSky: '#e4f2ff',
    hemiGround: '#9cc98e',
    hemiIntensity: 0.8,
    envIntensity: 0.45,
    lampIntensity: 0,
    stars: 0,
    exposure: 0.95,
  },
  night: {
    zenith: '#050b22',
    horizon: '#24345e',
    sunColor: '#9fb4ff', // the moon
    sunIntensity: 0.55,
    sunElevation: 38,
    sunAzimuth: -60,
    hemiSky: '#3a4c80',
    hemiGround: '#1a1a22',
    hemiIntensity: 0.35,
    envIntensity: 0.25,
    lampIntensity: 30,
    stars: 1,
    exposure: 1.15,
  },
}
export const LIGHT = {
  shadowRange: 40, // half-width of the sun's shadow box around the player
  lampColor: '#ffb35c',
  lampDistance: 22,
}

// Default (fallback) character look, used only when player.glb cannot load.
export const CHARACTER_COLORS = { skin: '#f2c79a', suit: '#2f6fd0', hair: '#4a2f1c' }

export const MATERIAL_PBR = {
  PLAYER: { roughness: 0.7, metalness: 0 },
  GROUND: { roughness: 0.95, metalness: 0 },
}

// --- Graphics presets, picked by the Bloxity graphics_quality setting ----------
export const GRAPHICS_PRESETS = {
  Low: { shadows: false, shadowMap: 512, antialias: false, dpr: 1, bloom: false, particles: 0.35 },
  Medium: { shadows: true, shadowMap: 1024, antialias: false, dpr: 1.25, bloom: false, particles: 0.6 },
  High: { shadows: true, shadowMap: 2048, antialias: true, dpr: 2, bloom: true, particles: 1 },
  Ultra: { shadows: true, shadowMap: 4096, antialias: true, dpr: 2, bloom: true, particles: 1 },
}

// Bloom (postfx.js): only HDR-bright pixels (above threshold, linear, before
// tone mapping) glow: neon rails, waterfall, VIP gate, particles. Sunlit sand
// stays under the threshold.
export const BLOOM = { strength: 0.6, radius: 0.35, threshold: 2.0 }
// Neon materials (propkit.js): k = HDR colour multiplier with bloom on; with
// bloom off they are capped at plainMax so they stay coloured, not white.
export const NEON = { k: 3.5, plainMax: 1.2 }

// Phones and tablets default to a lighter preset when the portal sends no value,
// and any preset is capped there (a phone at DPR 3 renders 9x the pixels; bloom
// is a full-screen multi-pass blur, so it stays off on phones).
export const COARSE_POINTER = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
export const DEFAULT_GRAPHICS = COARSE_POINTER ? 'Medium' : 'High'
export const MOBILE_GRAPHICS_CAP = { dpr: 1.5, shadowMap: 1024, particles: 0.6 }

// The preset to render with on this device.
export function graphicsPreset(name) {
  const p = GRAPHICS_PRESETS[name] ?? GRAPHICS_PRESETS[DEFAULT_GRAPHICS]
  if (!COARSE_POINTER) return p
  const cap = MOBILE_GRAPHICS_CAP
  return { ...p, dpr: Math.min(p.dpr, cap.dpr), shadowMap: Math.min(p.shadowMap, cap.shadowMap), bloom: false, particles: Math.min(p.particles, cap.particles) }
}

// --- HUD (hud.js) ---------------------------------------------------------------
// The player's counters (state.js) start here until saves exist.
export const PLAYER_START = { speed: 1, scareLevel: 10, money: 0 }
export const HUD = {
  design: { w: 1920, h: 992 }, // reference screenshot the layout is measured on (px)
  minScale: 0.45, // smallest px per reference px with a mouse
  touchScale: 0.55, // with touch controls, so every button stays >= 44 px
}

// --- Touch controls (touch.js) --------------------------------------------------
export const TOUCH = {
  deadZone: 0.12, // fraction of the joystick radius that does nothing
  lookScale: 1.5, // touch drag pixels -> look, relative to a mouse pixel
  pinchPixelsPerNotch: 30, // finger spread change that equals one wheel notch
}

// --- Camera (camera.js) -------------------------------------------------------
export const CAMERA = {
  fov: 70,
  near: 0.1,
  far: 1200,
  startPitch: 0.14, // radians above the horizon (low chase cam)
  minPitch: -0.35,
  maxPitch: 1.25,
  firstPersonPitch: 1.45, // |pitch| limit looking up/down in player mode
  eyeHeight: 0.92, // eye height as a fraction of player height (player mode)
  distance: 12.4, // resting boom length, m
  minDistance: 2.5, // wheel in past this enters player mode
  maxDistance: 26,
  followLerp: 14, // 1/s: the one smoothing stage, on the point the camera follows
  targetHeight: 1.2, // look-at point as a fraction of player height
  lookSensitivity: 0.0026, // rad per pixel of mouse movement
  zoomStep: 0.9, // m per wheel notch
  zoomEase: 12, // 1/s the zoom glides to its target
  speedFov: 6, // degrees the FOV widens at sprint speed
  speedEase: 3, // 1/s the speed framing eases in and out
  clearEase: 6, // 1/s the boom eases back out once a wall stops blocking it
}

// --- Bloxity (bloxity.js, avatar/) -------------------------------------------------
// SDK setting keys this game listens for; registering a listener makes the control
// appear in the portal's settings menu.
export const SETTINGS = {
  graphics_quality: { def: DEFAULT_GRAPHICS, type: 'enum', values: ['Low', 'Medium', 'High', 'Ultra'] },
  camera_sensitivity: { def: '1', type: 'number', min: 0.1, max: 5 },
  show_fps: { def: 'false', type: 'bool' },
  fullscreen: { def: 'false', type: 'bool' },
}

// The base rig, measured from player.glb: origin at the feet, 6.4 units tall at bind pose.
export const RIG_HEIGHT = 6.4
// Bind-pose values of the rig nodes the SDK proportions drive.
export const RIG = { armOffsetX: 2, legOffsetX: 0.6, neckOffsetY: 0.6 }
// getProportions() ranges, straight from the SDK spec; clamped before they reach the scene graph.
export const PROPORTIONS = {
  height: { def: 1, min: 0.5, max: 1.6 },
  shoulderWidth: { def: 1, min: 0.5, max: 1.5 },
  armLength: { def: 1, min: 0.05, max: 3 },
  legOffsetX: { def: 1, min: -0.7, max: 5 },
  torsoScaleX: { def: 1, min: 0.3, max: 2 },
  neckHeight: { def: 1, min: 0.94, max: 1.2 },
  headScale: { def: 1, min: 0.3, max: 2.6 },
}

// Procedural animation (avatar/animator.js), ported from Clean Leaves for Loot.
// Rotations are radians in CHARACTER space: +X swings a limb backward, +Y yaws, +Z rolls.
const deg = (d) => (d * Math.PI) / 180
export const ANIM = {
  airborneDelay: 0.07, // s off the ground before the air pose (ignores a step down a ledge)
  // Walk -> run is one cycle at two depths; phase advances with distance travelled.
  locomotion: {
    minFrequency: 0.7,
    maxFrequency: 3.6,
    strideDistance: 3.8, // m per cycle
    idleSpeed: 0.6,
    walkSpeed: 2.5,
    runSpeed: 8,
    sprintSpeed: 13,
    hipSwing: { walk: deg(22), run: deg(42), sprint: deg(56) },
    kneeBend: { walk: deg(30), run: deg(58), sprint: deg(72) },
    armSwing: { walk: deg(18), run: deg(36), sprint: deg(52) },
    elbowBend: { walk: deg(14), run: deg(44), sprint: deg(70) },
    torsoTwist: { walk: deg(4), run: deg(7), sprint: deg(9) },
    torsoLean: { walk: deg(3), run: deg(10), sprint: deg(18) },
    headCounterTwist: { walk: deg(2), run: deg(4), sprint: deg(5) },
    torsoRoll: { walk: deg(2), run: deg(3), sprint: deg(3) },
    bob: { walk: 0.03, run: 0.07, sprint: 0.09 }, // m, on the avatar root
    bankAngle: deg(9),
    bankRate: 8,
  },
  idle: {
    breathFrequency: 0.35,
    breathAmount: deg(1.8),
    breathBob: 0.007,
    basePose: {
      ArmL1: { x: deg(-4), z: deg(8) },
      ArmL2: { x: deg(12) },
      ArmR1: { x: deg(-4), z: deg(-8) },
      ArmR2: { x: deg(12) },
      LegL1: { x: deg(-4) },
      LegR1: { x: deg(4) },
    },
  },
  airborne: {
    rise: {
      LegL1: { x: deg(-38) }, LegR1: { x: deg(8) }, LegL2: { x: deg(62) }, LegR2: { x: deg(40) },
      ArmL1: { x: deg(-40), z: deg(34) }, ArmR1: { x: deg(-30), z: deg(-34) },
      ArmL2: { x: deg(30) }, ArmR2: { x: deg(30) }, Spine1: { x: deg(6) },
    },
    fall: {
      LegL1: { x: deg(-14) }, LegR1: { x: deg(10) }, LegL2: { x: deg(22) }, LegR2: { x: deg(18) },
      ArmL1: { x: deg(-70), z: deg(40) }, ArmR1: { x: deg(-60), z: deg(-40) },
      ArmL2: { x: deg(20) }, ArmR2: { x: deg(20) }, Spine1: { x: deg(-4) },
    },
    velocityReference: 8, // m/s vertical speed that reads as fully rising / falling
  },
  landing: {
    duration: 0.16,
    pose: {
      LegL1: { x: deg(-34) }, LegR1: { x: deg(-34) }, LegL2: { x: deg(58) }, LegR2: { x: deg(58) },
      ArmL1: { x: deg(-18), z: deg(20) }, ArmR1: { x: deg(-18), z: deg(-20) }, Spine1: { x: deg(14) },
    },
    bobY: -0.2,
  },
  transitions: { toLocomotion: 0.14, toAirborne: 0.12, toLanding: 0.06 }, // s to blend a pose change
}

export const FONT_FAMILY = 'Fredoka'

export function clamp(n, min, max) {
  return n < min ? min : n > max ? max : n
}

// Coerce one raw SDK string against its SETTINGS entry.
export function coerceSetting(key, raw) {
  const spec = SETTINGS[key]
  if (!spec) return raw
  const value = raw === '' || raw == null ? spec.def : raw
  if (spec.type === 'bool') return value === 'true' || value === true
  if (spec.type === 'enum') return spec.values.includes(value) ? value : spec.def
  const n = Number(value)
  return clamp(Number.isFinite(n) ? n : Number(spec.def), spec.min, spec.max)
}

// =====================================================================================
// Shops, items and the Index (shops.js, items.js, indexWindow.js, costumes/, auras.js)
// =====================================================================================

// Rarity ladder shared by costumes, auras and items. `text` = the rarity word's colour
// (outlined) on cards; `tile` = Index tile / tab gradient [top, bottom]; `ink` = the dark
// silhouette tint of a not-yet-found item on its tile.
export const RARITY = {
  common: { label: 'Common', text: '#d7dbe2', tile: ['#c9ced6', '#9aa0aa'], ink: '#4a4f58' },
  uncommon: { label: 'Uncommon', text: '#6dfa6d', tile: ['#62d86a', '#2f9f3c'], ink: '#164a1c' },
  rare: { label: 'Rare', text: '#41a8ff', tile: ['#4c9cff', '#2560d8'], ink: '#0e2a66' },
  epic: { label: 'Epic', text: '#c45cff', tile: ['#b43ed6', '#8a22a8'], ink: '#3e0d4e' },
  legendary: { label: 'Legendary', text: '#ffd02e', tile: ['#f4c83c', '#c99a18'], ink: '#5c4407' },
  mythical: { label: 'Mythical', text: '#ff3fe0', tile: ['#ff22f0', '#c00ec4'], ink: '#55045a' },
  cosmic: { label: 'Cosmic', text: '#7d2fd6', tile: ['#5c1a92', '#33094f'], ink: '#1a0429', textCosmicShop: '#62d6ff' },
  secret: { label: 'Secret', text: '#ff3030', tile: ['#ff2020', '#c00606'], ink: '#560303' },
  divine: { label: 'Divine', text: '#ffae1a', tile: ['#ffb43c', '#d47e08'], ink: '#5a3203' },
  horror: { label: 'Horror', text: '#ff7c1a', tile: ['#ff8c22', '#e0640a'], ink: '#5a2502' },
}

// Speed Auras stall (shops.js + auras.js). mult = speed multiplier while worn, price in $,
// colors = the aura's swirl
// [main, highlight, deep]; bg = card art background [inner, outer].
export const AURAS = [
  { id: 'silver', name: 'Silver Aura', rarity: 'common', mult: 1.5, price: 100, colors: ['#e9edf2', '#ffffff', '#8c939c'], bg: ['#f2f3f5', '#9ea3ab'] },
  { id: 'green', name: 'Green Aura', rarity: 'uncommon', mult: 2, price: 2000, colors: ['#36f04a', '#c8ffb4', '#0d8a1c'], bg: ['#5cf05a', '#0f7a14'] },
  { id: 'blue', name: 'Blue Aura', rarity: 'rare', mult: 2.5, price: 35000, colors: ['#2c8cff', '#bfe4ff', '#0b3ab8'], bg: ['#2a7cff', '#06217a'] },
  { id: 'purple', name: 'Purple Aura', rarity: 'epic', mult: 3, price: 700000, colors: ['#a43cff', '#ecc4ff', '#4c0ea0'], bg: ['#b040ff', '#3a0a7a'] },
  { id: 'golden', name: 'Golden Aura', rarity: 'legendary', mult: 3.5, price: 15e6, colors: ['#ffd21a', '#fff6b0', '#b07a00'], bg: ['#ffd84a', '#a86c00'] },
  { id: 'mystic', name: 'Mystic Aura', rarity: 'mythical', mult: 4, price: 350e6, colors: ['#ff2fa8', '#ffc4e8', '#a00a5a'], bg: ['#ff3fa8', '#8a0848'] },
  { id: 'cosmic', name: 'Cosmic Aura', rarity: 'cosmic', mult: 5, price: 10e9, colors: ['#8a4cff', '#ff6af0', '#1c1080'], bg: ['#3a1a9a', '#0c0630'], multi: true },
  { id: 'crimson', name: 'Crimson Aura', rarity: 'secret', mult: 7, price: 200e9, colors: ['#ff1a1a', '#ffb0a0', '#7a0000'], bg: ['#ff2a2a', '#6a0000'] },
  { id: 'magma', name: 'Magma Aura', rarity: 'divine', mult: 10, price: 6e12, colors: ['#ff6a00', '#ffe14a', '#2a0800'], bg: ['#ff7a10', '#3a0a00'], lava: true },
  { id: 'void', name: 'Void Aura', rarity: 'horror', mult: 14, price: 40e12, colors: ['#5a1aff', '#c9a8ff', '#06000f'], bg: ['#2a0a4a', '#050008'], dark: true },
]

// Scare Costumes stall (shops.js + costumes/). mult = scare multiplier while worn.
// bg = card background [top, bottom]; halo = the lighter disc behind the figure.
export const COSTUMES = [
  { id: 'ghost', name: 'Ghost', rarity: 'common', mult: 1.5, price: 150, bg: ['#d6d8e6', '#a9adc2'], halo: '#eceef6' },
  { id: 'skeleton', name: 'Skeleton', rarity: 'uncommon', mult: 2, price: 2500, bg: ['#d8cdb2', '#a89a7a'], halo: '#e8dfca' },
  { id: 'zombie', name: 'Zombie', rarity: 'rare', mult: 2.5, price: 45000, bg: ['#5cbc4c', '#2e8a2a'], halo: '#7dd06a' },
  { id: 'vampire', name: 'Vampire', rarity: 'epic', mult: 3, price: 850000, bg: ['#c42438', '#7a0c1c'], halo: '#d8485a' },
  { id: 'witch', name: 'Witch', rarity: 'legendary', mult: 3.5, price: 18e6, bg: ['#9a50e0', '#5e22a8'], halo: '#b67cf0' },
  { id: 'clown', name: 'Clown', rarity: 'mythical', mult: 4, price: 420e6, bg: ['#f0606a', '#c02c3a'], halo: '#f88a92' },
  { id: 'devil', name: 'Devil', rarity: 'cosmic', mult: 5, price: 12e9, bg: ['#d82020', '#8a0606'], halo: '#e85050', rarityText: '#62d6ff' },
  { id: 'scarecrow', name: 'Scarecrow', rarity: 'secret', mult: 7, price: 250e9, bg: ['#e0a040', '#a8681a'], halo: '#ecbe72' },
  { id: 'reaper', name: 'Grim Reaper', rarity: 'divine', mult: 10, price: 7.5e12, bg: ['#3a3a4a', '#1c1c26'], halo: '#55556a' },
  { id: 'bogbeast', name: 'Bog Beast', rarity: 'horror', mult: 14, price: 50e12, bg: ['#4c9a38', '#24661c'], halo: '#6cb856' },
]

// Shop / sell lines.
export const SHOP = {
  ringRadius: 4.2, // m: standing inside a stall's ring opens its window (plaza.js draws it)
  warmDelay: 8000, // ms after start before the shop card art is pre-rendered in idle time
  noMoney: 'Not enough money!',
  sellEmpty: 'Nothing to sell yet - open packages to get items!',
}

// Index items (items.js / indexWindow.js), found by opening packages. `value` = sell price
// in $ of the rarity's first item, each next item is worth `step` more. `reward` = what
// claiming a found item gives (money + speed stat); finishing a whole rarity unlocks its
// gift (`gift` x the per-item reward).
export const INDEX = {
  order: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'cosmic', 'secret', 'horror'],
  gift: 5,
  step: 0.09,
  rarities: {
    common: { value: 320, reward: { money: 2000, speed: 50 }, items: ['Yo Yo', 'Rubber Duck', 'Teddy Bear', 'Soda Can', 'Alarm Clock', 'Toy Car', 'Basketball', 'Coffee Mug', 'Desk Lamp', 'Sneaker', 'Toaster'] },
    uncommon: { value: 2600, reward: { money: 9000, speed: 250 }, items: ['Skateboard', 'Acoustic Guitar', 'Microwave', 'Desk Chair', 'Boombox', 'Vacuum Cleaner', 'Laptop', 'Electric Fan', 'Mini Fridge', 'Golf Bag', 'Fish Tank'] },
    rare: { value: 16000, reward: { money: 25000, speed: 700 }, items: ['Gaming PC', 'Electric Guitar', 'Recliner', 'Telescope', 'Washing Machine', 'Lawn Mower', 'Grandfather Clock', 'Drone', 'Espresso Machine', 'Globe', 'Synth Keyboard'] },
    epic: { value: 95000, reward: { money: 60000, speed: 1800 }, items: ['Arcade Machine', 'Bicycle', 'Big TV', 'Armchair', 'Gaming Chair', 'Wardrobe', 'Fridge', 'Dining Table', 'Jukebox', 'Pinball Machine', 'Massage Chair'] },
    legendary: { value: 620000, reward: { money: 168000, speed: 7500 }, items: ['Grand Piano', 'Treadmill', 'Drum Kit', 'Pool Table', 'Golden Lamp', 'Fountain', 'Vending Machine', 'Knight Armor', 'Hot Tub', 'Harp', 'Throne'] },
    mythical: { value: 4.2e6, reward: { money: 600000, speed: 30000 }, items: ['Go-Kart', 'Speedboat', 'Quad Bike', 'Jetpack', 'Castle Tower', 'Hover Couch', 'Giant Crystal', 'Robot Arm', 'Jet Ski', 'Motorcycle', 'Sports Car'] },
    cosmic: { value: 31e6, reward: { money: 2.16e6, speed: 100000 }, items: ['Hummer', 'Police Van', 'Camper Van', 'Hot Air Balloon', 'Golden Bell', 'Alien Brain', 'Robot Butler', 'Steam Train', 'UFO', 'Satellite', 'Space Rover'] },
    secret: { value: 260e6, reward: { money: 14.4e6, speed: 750000 }, items: ['Yacht', 'Helicopter', 'Tank', 'Bank Vault', 'Satellite Dish', 'Dino Skeleton', 'Carousel', 'Lighthouse', 'Private Jet', 'Submarine', 'Rocket'] },
    horror: { value: 2.1e9, reward: { money: 120e6, speed: 4.5e6 }, items: ['Jack-o-Lantern', 'Coffin', 'Cauldron', 'Haunted Shrine', 'Tombstone', 'Gargoyle', 'Spellbook', 'Giant Spider', 'Haunted Doll', 'Skull Candles', 'Crystal Ball', 'Sarcophagus', 'Haunted Mirror', 'Raven', 'Bone Throne'] },
  },
}
// What a package from each house tier rolls when opened: [rarity, weight] (items.openPackage).
export const PACKAGE_ODDS = {
  common: [['common', 82], ['uncommon', 15], ['rare', 3]],
  uncommon: [['uncommon', 78], ['rare', 18], ['epic', 4]],
  rare: [['rare', 75], ['epic', 20], ['legendary', 5]],
  epic: [['epic', 70], ['legendary', 22], ['mythical', 7], ['cosmic', 1]],
  legendary: [['legendary', 62], ['mythical', 24], ['cosmic', 9], ['secret', 4], ['horror', 1]],
}

// Item / costume / aura thumbnails (thumbs.js): render size px and the camera's view.
export const THUMBS = { size: 256, yaw: -0.55, pitch: 0.22, fov: 30, margin: 1.12, idleMs: 4000 }

// Game audio (audio/): master level, per-bus levels, reverb, voice budget.
export const AUDIO = {
  volume: 0.8,
  storageKey: 'scare-your-neighbor.sound',
  buses: { ui: 0.8, sfx: 0.9, amb: 0.55 },
  duck: 0.5, // world level while a menu window is open
  maxVoices: 48,
  maxVoicesTouch: 24,
  latency: 0.04,
  latencyTouch: 0.07,
  lead: 0.02,
  reverb: { seconds: 1.6, preDelay: 0.012, early: [[19, 0.45], [31, 0.32], [47, 0.24], [73, 0.16], [97, 0.1]], decay: 1.2, tail: 0.15, darken: 1.8, send: 0.8 },
  footsteps: { grass: 0.32, hard: 0.38, stride: 1.6 }, // levels, m per step at walking pace
  // The scare loop (audio/index.js, audio/sfx.js): m per player footstep walking / sprinting,
  // m per neighbour footstep, distance (m) at which neighbour sounds fade out, wind bed level.
  stride: { walk: 1.15, sprint: 1.6 },
  npcStride: 1.3,
  hearing: 45,
  wind: 0.16,
}
