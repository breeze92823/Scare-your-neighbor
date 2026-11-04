// Small inline SVG icons for the shop / sell / Index windows (dark outline, flat fills).
const O = 'stroke="#1b1b2a" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"'
const svg = (body, vb = '0 0 64 64') => `<svg viewBox="${vb}" aria-hidden="true">${body}</svg>`

export const SHOP_ICONS = {
  // Premium currency: a white hexagon coin with a hollow centre.
  gem: svg(`<path d="M32 4 56 18v28L32 60 8 46V18z" fill="#fff" ${O}/><path d="M32 17 45 24.5v15L32 47 19 39.5v-15z" fill="#a52fe0" stroke="#1b1b2a" stroke-width="3"/><path d="M32 24 39 28v8l-7 4-7-4v-8z" fill="#fff"/>`),
  // Index gift: a red-ribboned present.
  gift: svg(`<rect x="8" y="26" width="48" height="32" rx="3" fill="#ffb03a" ${O}/><rect x="5" y="18" width="54" height="12" rx="3" fill="#ffc85a" ${O}/><path d="M27 18h10v40H27z" fill="#e8343a" ${O}/><path d="M32 18c-10-14-22-6-14 0zM32 18c10-14 22-6 14 0z" fill="#e8343a" ${O}/>`),
  check: svg(`<path d="M12 34l13 13 27-29" fill="none" stroke="#1b1b2a" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 34l13 13 27-29" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  lock: svg(`<path d="M20 30v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#1b1b2a" stroke-width="10"/><path d="M20 30v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#c9ced6" stroke-width="5"/><rect x="11" y="29" width="42" height="29" rx="5" fill="#9aa1ad" ${O}/><circle cx="32" cy="41" r="4.5" fill="#1b1b2a"/>`),
}

// The window close X: white, chunky, with a dark outline.
export const CLOSE_X = svg(`<path d="M30 30 L70 70 M70 30 L30 70" stroke="#1b1b2a" stroke-width="26" stroke-linecap="round"/><path d="M30 30 L70 70 M70 30 L30 70" stroke="#fff" stroke-width="14" stroke-linecap="round"/>`, '0 0 100 100')
