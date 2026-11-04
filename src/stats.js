// Lifetime counters the leaderboards rank (saved by net.js, backend LEADERBOARD_STATS): money earned
// (state.js counts every gain), successful scares and stolen packages (neighbours.js).
export const stats = { earned: 0, scares: 0, steals: 0 }

export const addStat = (key, n = 1) => {
  stats[key] += n
}

// The saved part (net.js store).
export const statsStore = {
  snapshot: () => ({ earned: Math.floor(stats.earned), scares: stats.scares, steals: stats.steals }),
  hydrate(doc) {
    for (const key of Object.keys(stats)) if (Number.isFinite(doc[key]) && doc[key] >= 0) stats[key] = Math.max(stats[key], doc[key])
  },
}
