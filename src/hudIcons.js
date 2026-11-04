// Inline SVG icons for the HUD (hud.js) and its windows: chunky flat fills with a
// dark outline, like the reference screenshots.
const O = 'stroke="#1b1b2a" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"'
const svg = (body) => `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`

export const ICONS = {
  // Index: blue book with a golden eye on the cover.
  index: svg(
    `<path d="M16 8h34a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H16z" fill="#fff" ${O}/><path d="M14 6h34a4 4 0 0 1 4 4v38a4 4 0 0 1-4 4H14z" fill="#2f6fe0" ${O}/><rect x="9" y="6" width="9" height="50" rx="3" fill="#1d47a8" ${O}/><path d="M22 28c4-7 18-7 24 0-6 7-20 7-24 0z" fill="#ffd21a" ${O}/><circle cx="34" cy="28" r="4" fill="#1b1b2a"/><path d="M24 42h20" stroke="#ffd21a" stroke-width="3.5" stroke-linecap="round"/>`,
  ),
  // Shop: red shopping basket.
  shop: svg(
    `<path d="M18 26c0-16 28-16 28 0" fill="none" stroke="#1b1b2a" stroke-width="8" stroke-linecap="round"/><path d="M18 26c0-16 28-16 28 0" fill="none" stroke="#c9d2de" stroke-width="3.5" stroke-linecap="round"/><path d="M9 28h46l-6 26a4 4 0 0 1-4 3H19a4 4 0 0 1-4-3z" fill="#e8343a" ${O}/><path d="M24 34l1 16M32 34v16M40 34l-1 16" stroke="#8a1c22" stroke-width="3.5" stroke-linecap="round"/><rect x="5" y="22" width="54" height="9" rx="4" fill="#ff6a6a" ${O}/>`,
  ),
  // Deliveries: a taped cardboard box.
  box: svg(
    `<path d="M32 8 57 19 32 30 7 19z" fill="#f4c983" ${O}/><path d="M7 19l25 11v27L7 46z" fill="#dc9a4e" ${O}/><path d="M57 19 32 30v27l25-11z" fill="#c07a34" ${O}/><path d="M19 13.5 44 24.5v8" fill="none" stroke="#a8692a" stroke-width="4" stroke-linecap="round"/>`,
  ),
  // Inventory: orange suitcase with straps.
  bag: svg(
    `<path d="M24 20v-6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6" fill="none" stroke="#1b1b2a" stroke-width="7"/><path d="M24 20v-6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6" fill="none" stroke="#8a4a10" stroke-width="3"/><rect x="7" y="19" width="50" height="36" rx="7" fill="#f28a1c" ${O}/><path d="M7 30h50" stroke="#c4650e" stroke-width="3.5"/><path d="M19 19v36M45 19v36" stroke="#9a4c0a" stroke-width="5"/><rect x="15" y="27" width="8" height="7" rx="1.5" fill="#ffd21a" ${O}/><rect x="41" y="27" width="8" height="7" rx="1.5" fill="#ffd21a" ${O}/>`,
  ),
  // Speed: blue sneaker.
  speed: svg(
    `<path d="M6 42c0-9 3-19 9-22l9 6c6 3 13 3 18 5 9 4 16 5 16 12v3H6z" fill="#3a9cff" ${O}/><path d="M24 26l-3 6M30 28l-3 6M36 30l-3 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M6 45h52v4a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#fff" ${O}/>`,
  ),
  // Scare level: white ghost.
  scare: svg(
    `<path d="M13 56V29a19 19 0 0 1 38 0v27l-6.3-5-6.3 5-6.4-5-6.3 5-6.4-5z" fill="#fff" ${O}/><ellipse cx="25" cy="29" rx="4" ry="6" fill="#1b1b2a"/><ellipse cx="39" cy="29" rx="4" ry="6" fill="#1b1b2a"/><ellipse cx="32" cy="42" rx="5" ry="4" fill="#ff6aa8" ${O}/><ellipse cx="18" cy="37" rx="3" ry="2" fill="#ffb3cf"/><ellipse cx="46" cy="37" rx="3" ry="2" fill="#ffb3cf"/>`,
  ),
  // Money: a stack of green bills with a paper band.
  money: svg(
    `<g transform="rotate(-14 32 36)"><rect x="8" y="30" width="46" height="22" rx="3" fill="#2f9a3c" ${O}/><rect x="10" y="24" width="46" height="22" rx="3" fill="#3fbf4c" ${O}/><circle cx="33" cy="35" r="6" fill="#8ff08f" ${O}/><rect x="19" y="23" width="7" height="24" fill="#ffd21a" ${O}/></g>`,
  ),
  lock: svg(
    `<path d="M20 30v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#1b1b2a" stroke-width="10"/><path d="M20 30v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#6b7180" stroke-width="5"/><rect x="11" y="29" width="42" height="29" rx="5" fill="#9aa1ad" ${O}/><circle cx="32" cy="41" r="4.5" fill="#1b1b2a"/><path d="M32 43v8" stroke="#1b1b2a" stroke-width="4" stroke-linecap="round"/>`,
  ),
}
