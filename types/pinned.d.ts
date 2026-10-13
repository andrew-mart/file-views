/**
 * Whether the element sticks to an edge as the page scrolls.
 * @param {string} position
 */
export function isPinned(position: string): position is "sticky" | "-webkit-sticky" | "fixed";
/**
 * Whether the element has a ground of its own: a computed colour comes as rgb(…), rgba(…, a) or rgb(… / a), the last
 * figure its opacity; transparent and nothing — no ground.
 * @param {string} color
 */
export function hasBackground(color: string): boolean;
/**
 * The elements that get a dark ground.
 * @template T
 * @param {Iterable<T>} elements
 * @param {(element: T) => { position: string, backgroundColor: string }} styleOf
 * @returns {T[]}
 */
export function pinnedWithBackground<T>(elements: Iterable<T>, styleOf: (element: T) => {
    position: string;
    backgroundColor: string;
}): T[];
