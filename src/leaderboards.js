// The leaderboards, both kinds, in one place:
//   * the GAME boards: the room server ranks every saved player (backend leaderboard.ts: Top Earners, Most
//     Scares, Top Thieves, Longest Playing) and net.js receives the top lists and this player's rank;
//   * the BLOXITY boards: Legion.SDK.leaderboard, the ones behind the trophy button in the Boxity toolbar.
//     This module defines them (bloxity.js), submits this player's scores to them and reads their top rows.
// The plaza board (plaza.js) turns through all of them every LEADERBOARD.rotateEvery seconds, so a player
// sees the game's ranking and Bloxity's side by side. Offline (no server) the game pages show this player.
import { LEADERBOARD } from './config.js'
import { formatMoney } from './state.js'
import { stats } from './stats.js'
import { net, leaderboard as roomBoards } from './net.js'
import { displayName, getTopBoard, submitScore } from './bloxity.js'

const UNITS = ['K', 'M', 'B', 'T', 'Qa']
function compact(n) {
  n = Math.floor(n)
  if (n < 10000) return n.toLocaleString('en-US')
  let i = -1
  while (n >= 1000 && i < UNITS.length - 1) {
    n /= 1000
    i++
  }
  return `${Number(n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2))}${UNITS[i]}`
}
function duration(s) {
  s = Math.floor(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}
const FORMATS = { money: formatMoney, count: compact, compact, time: duration }

// This player's own numbers, by saved stat name.
const mine = () => ({ earned: stats.earned, scares: stats.scares, steals: stats.steals, playtime: net.playtime })

export function createLeaderboards(plaza) {
  const pages = [
    ...LEADERBOARD.boards.map((b) => ({ kind: 'game', ...b })),
    ...LEADERBOARD.bloxity.map((b) => ({ kind: 'bloxity', title: b.label, ...b })),
  ]
  const bloxityRows = new Map() // board id -> [[name, value]] from getTop
  let index = 0
  let timer = 0
  let repaintT = 0
  let shown = ''
  let bloxityAt = -Infinity
  let submitAt = 0
  let sentKey = ''

  function pageContent(p) {
    const fmt = FORMATS[p.format] ?? compact
    if (p.kind === 'bloxity') {
      const rows = bloxityRows.get(p.id)
      return rows ? { title: p.title, sub: 'Boxity leaderboard', rows: rows.map(([n, v]) => [n, fmt(v)]) } : null // not reachable: skipped
    }
    const list = roomBoards.boards?.[p.stat]
    if (net.connected && list) {
      const rank = roomBoards.ranks?.[p.stat]
      return { title: p.title, sub: rank ? `All players · you: #${rank}` : 'All players', rows: list.map((r) => [r.name, fmt(r.value)]) }
    }
    const v = mine()[p.stat]
    return { title: p.title, sub: 'You (offline)', rows: v > 0 ? [[displayName(), fmt(v)]] : [] }
  }

  // The next page that has something to show.
  function pick(step) {
    for (let n = 0; n < pages.length; n++) {
      index = (index + step + pages.length) % pages.length
      const c = pageContent(pages[index])
      if (c) return c
    }
    return pageContent(pages[0])
  }

  function repaint(content) {
    const key = JSON.stringify(content)
    if (key === shown) return
    shown = key
    plaza.setBoard(content)
  }

  async function refreshBloxity() {
    bloxityAt = performance.now()
    for (const b of LEADERBOARD.bloxity) {
      const top = await getTopBoard(b.id, LEADERBOARD.rows)
      if (top) bloxityRows.set(b.id, top.rows.map((r) => [r.name, r.score]))
    }
  }

  // Sends the scores that changed to Bloxity ('best' boards: the lifetime totals only ever go up).
  function submit(force = false) {
    const now = performance.now()
    if (!force && now - submitAt < LEADERBOARD.submitEvery * 1000) return
    const own = mine()
    for (const b of LEADERBOARD.bloxity) {
      const score = Math.floor(own[b.stat])
      const key = `${b.id}:${score}`
      if (score <= 0 || sentKey.includes(`|${key}|`)) continue
      sentKey = sentKey.replace(new RegExp(`\\|${b.id}:\\d+\\|`), '') + `|${key}|`
      void submitScore(b.id, score)
    }
    submitAt = now
  }
  window.addEventListener('pagehide', () => submit(true))
  document.addEventListener('visibilitychange', () => document.hidden && submit(true))

  repaint(pageContent(pages[0]))
  return {
    // Called every frame (cheap): turns the page, refreshes Bloxity's rows, submits scores.
    update(dt) {
      timer += dt
      if (timer >= LEADERBOARD.rotateEvery) {
        timer = 0
        repaint(pick(1))
      }
      repaintT += dt
      if (repaintT >= 1) {
        repaintT = 0
        repaint(pageContent(pages[index]) ?? pick(1)) // new data on the page being shown
      }
      if (performance.now() - bloxityAt > LEADERBOARD.bloxityEvery * 1000) void refreshBloxity()
      submit()
    },
    // Repaints the current page right away (a new room list arrived).
    refresh() {
      repaint(pageContent(pages[index]) ?? pick(1))
    },
  }
}
