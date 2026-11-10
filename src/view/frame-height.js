// @ts-check
// How tall a page's frame that grows is: as its page, measured as it changes — but a page whose height follows its
// frame's, as min-height: 100vh with a margin under it, grows by the same step each time the frame does, at once, and
// would grow without end: after a few such steps it is followed no further.

/**
 * @typedef {{ height: number, step: number, at: number, repeats: number }} Growth — height: the frame's; step: what it
 *   grew by last; at: when, in ms; repeats: how many times in a row it grew by that step at once
 */

/** Growing by the same step within this long of the last time is the page chasing its frame, not loading more. */
const chaseMs = 1000;
/** After this many such steps the page is followed no further. */
const chaseSteps = 3;

/**
 * A frame as tall as given, not grown yet.
 * @param {number} height
 * @returns {Growth}
 */
export function frameGrowth(height) {
  return { height, step: 0, at: Number.NEGATIVE_INFINITY, repeats: 0 };
}

/**
 * The frame once its page was measured this tall at this time.
 * @param {Growth} growth
 * @param {number} measured — the page's height
 * @param {number} at — when, in ms
 * @returns {Growth}
 */
export function grown(growth, measured, at) {
  if (growth.repeats >= chaseSteps) return growth;
  const height = Math.ceil(measured);
  const step = height - growth.height;
  if (step === 0) return growth;
  const chasing = step > 0 && step === growth.step && at - growth.at < chaseMs;
  const repeats = chasing ? growth.repeats + 1 : 0;
  return repeats >= chaseSteps ? { ...growth, repeats } : { height, step, at, repeats };
}
