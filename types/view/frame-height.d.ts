/**
 * A frame as tall as given, not grown yet.
 * @param {number} height
 * @returns {Growth}
 */
export function frameGrowth(height: number): Growth;
/**
 * The frame once its page was measured this tall at this time.
 * @param {Growth} growth
 * @param {number} measured — the page's height
 * @param {number} at — when, in ms
 * @returns {Growth}
 */
export function grown(growth: Growth, measured: number, at: number): Growth;
/**
 * — height: the frame's; step: what it
 *   grew by last; at: when, in ms; repeats: how many times in a row it grew by that step at once
 */
export type Growth = {
    height: number;
    step: number;
    at: number;
    repeats: number;
};
