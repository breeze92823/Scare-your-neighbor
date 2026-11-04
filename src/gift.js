// The Free Gift on the plaza (plaza.js draws it): walk up to it, press E / tap the prompt, watch a Bloxity
// rewarded ad (Legion.SDK.ads.showRewarded) and get GIFT.reward $. The money is only paid on a
// 'completed' ad; with the room server connected the ad's reward token is verified server-side first
// (backend adGift: it checks the token with Bloxity, sets the amount and enforces the cooldown), so a
// forged "completed" earns nothing. Offline (no server) a completed ad pays locally. While the gift is
// cooling down its name sprite changes and the prompt says how long is left.
import { Vector3 } from 'three'
import { GIFT } from './config.js'
import { adsAvailable, showRewardedAd } from './bloxity.js'
import { claimGift, gift as giftNet, net } from './net.js'
import { formatMoney, state } from './state.js'
import { sfx } from './audio/index.js'
import { player } from './player.js'

const RED = '#ff5a5a'
const GREEN = '#4dff5a'

export function createGift({ ui, plaza }) {
  const at = new Vector3(GIFT.x, 2.2, GIFT.z)
  let busy = false // an ad (or its verification) is in progress
  let localNextAt = 0 // epoch ms: the local cooldown (offline, or until the server's answer lands)
  let tag = GIFT.tagReady

  const nextAt = () => Math.max(localNextAt, giftNet.nextAt)
  const wait = () => Math.max(0, Math.ceil((nextAt() - Date.now()) / 1000))

  async function claim() {
    if (busy || player.stunned > 0) return
    if (wait() > 0) return ui.toast(GIFT.toastWait.replace('{s}', wait()), RED)
    busy = true
    try {
      const ad = await showRewardedAd(GIFT.placement)
      if (ad.status !== 'completed') {
        // Only a finished ad pays: skipped / denied (too soon, none left today) / no fill / blocked.
        const unavailable = ad.status === 'no-fill' || ad.status === 'blocked' || ad.status === 'disabled' || ad.status === 'error'
        ui.toast(unavailable ? GIFT.toastNoAd : GIFT.toastDenied, RED)
        sfx.deny()
        return
      }
      let amount = GIFT.reward
      if (net.connected) {
        const res = await claimGift(ad.rewardToken)
        if (!res.ok) {
          ui.toast(res.reason === 'cooldown' ? GIFT.toastWait.replace('{s}', wait() || GIFT.cooldown) : GIFT.toastNoAd, RED)
          sfx.deny()
          return
        }
        amount = Number.isFinite(res.amount) ? res.amount : amount
      }
      localNextAt = Date.now() + GIFT.cooldown * 1000
      state.add('money', amount)
      sfx.sell(1)
      ui.toast(GIFT.toastPaid.replace('{amount}', formatMoney(amount)), GREEN, 2.8, '#08360c')
    } finally {
      busy = false
    }
  }

  return {
    claim,
    get busy() {
      return busy
    },
    // After neighbours.update (which clears the prompt) -- only touches the prompt while you stand at the gift.
    update(pos) {
      const cooling = wait() > 0
      const next = busy ? '...' : cooling ? GIFT.tagBusy : GIFT.tagReady
      if (next !== tag) {
        tag = next
        plaza.setGiftTag(next === '...' ? GIFT.tagReady : next)
      }
      if (Math.hypot(pos.x - GIFT.x, pos.z - GIFT.z) > GIFT.range || player.stunned > 0) return
      const action = busy ? 'Watching...' : cooling ? `Wait ${wait()}s` : adsAvailable() ? `Watch Ad  +${formatMoney(GIFT.reward)}` : 'No ad right now'
      ui.setPrompt({ object: 'Free Gift', action, at, fn: claim })
    },
  }
}
