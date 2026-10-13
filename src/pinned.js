// @ts-check
// A page's pinned elements — sticky headers and fixed bars. A page's dark look takes the ground off all its elements
// (view/page.js), else light grounds show through in patches; but text slides under a pinned header as the page
// scrolls, and with no ground the lines overlap. Such elements keep a ground, a dark one. Which do is decided by the
// page's own style before it is darkened: only what covered the text with its ground in a browser.

/**
 * Whether the element sticks to an edge as the page scrolls.
 * @param {string} position
 */
export function isPinned(position) {
  return position === 'sticky' || position === '-webkit-sticky' || position === 'fixed';
}

/**
 * Whether the element has a ground of its own: a computed colour comes as rgb(…), rgba(…, a) or rgb(… / a), the last
 * figure its opacity; transparent and nothing — no ground.
 * @param {string} color
 */
export function hasBackground(color) {
  if (color === '' || color === 'transparent') return false;
  const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(color);
  if (slash !== null) return Number(slash[1]) > 0;
  const rgba = /^rgba\(([^)]*)\)$/.exec(color);
  if (rgba !== null) return Number(rgba[1]?.split(',')[3] ?? 1) > 0;
  return true;
}

/**
 * The elements that get a dark ground.
 * @template T
 * @param {Iterable<T>} elements
 * @param {(element: T) => { position: string, backgroundColor: string }} styleOf
 * @returns {T[]}
 */
export function pinnedWithBackground(elements, styleOf) {
  /** @type {T[]} */
  const picked = [];
  for (const element of elements) {
    const style = styleOf(element);
    if (isPinned(style.position) && hasBackground(style.backgroundColor)) picked.push(element);
  }
  return picked;
}
