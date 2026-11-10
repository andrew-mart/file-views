import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameGrowth, grown } from '../src/view/frame-height.js';

/**
 * The frame's heights, one after each of the page's heights measured at its time, from a frame first as tall as given.
 * @param {number} first
 * @param {readonly (readonly [number, number])[]} measured — [the page's height, when it was measured, in ms]
 */
const heights = (first, measured) => {
  let growth = frameGrowth(first);
  return measured.map(([height, at]) => {
    growth = grown(growth, height, at);
    return growth.height;
  });
};

// A frame that grows takes its page's height as it changes — taller as pictures load, shorter as a section folds, taller
// again as more is loaded by the same step each time, seconds apart; but a page whose height follows its frame's — as
// min-height: 100vh with a margin under it — grows by the same step each time the frame does, at once: after a few such
// steps it is followed no further, or it would grow without end
test('grown_Should_TakePagesHeight_ButStopChasingPageThatGrowsWithItsFrame', () => {
  assert.deepEqual(
    {
      changing: heights(700, [[1200, 0], [1500, 2000], [900, 5000]]),
      loadingMore: heights(700, [[1200, 0], [1700, 3000], [2200, 6000], [2700, 9000]]),
      chasing: heights(700, [[720, 0], [740, 16], [760, 32], [780, 48], [800, 64], [820, 5000]]),
      fraction: heights(700, [[1200.4, 0]]),
    },
    {
      changing: [1200, 1500, 900],
      loadingMore: [1200, 1700, 2200, 2700],
      chasing: [720, 740, 760, 760, 760, 760],
      fraction: [1201],
    },
  );
});
