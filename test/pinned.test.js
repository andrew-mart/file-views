import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasBackground, isPinned, pinnedWithBackground } from '../src/pinned.js';

// Sticky and fixed elements are pinned; the rest are not
test('isPinned_Should_TakeStickyAndFixed', () => {
  assert.deepEqual(['sticky', '-webkit-sticky', 'fixed', 'static', 'relative', 'absolute', ''].map(isPinned), [true, true, true, false, false, false, false]);
});

// An element has a ground only when it is at all opaque
test('hasBackground_Should_SeeGroundOnlyWhenAtAllOpaque', () => {
  assert.deepEqual(
    ['rgb(255, 255, 255)', 'rgba(1, 2, 3, 0.5)', 'rgb(1 2 3 / 50%)', 'rgb(1 2 3 / 0.2)', 'color(srgb 1 1 1)', 'rgba(0, 0, 0, 0)', 'transparent', 'rgb(1 2 3 / 0)', 'rgb(1 2 3 / 0%)', 'rgba(10, 20, 30, 0.0)', ''].map(hasBackground),
    [true, true, true, true, true, false, false, false, false, false, false],
  );
});

// Only pinned elements with a ground of their own get one: a transparent sticky line is transparent in a browser too,
// and nothing slides under a plain paragraph
test('pinnedWithBackground_Should_PickPinnedElementsWithGround', () => {
  const styles = new Map([
    ['header', { position: 'sticky', backgroundColor: 'rgb(255, 255, 255)' }],
    ['menu', { position: 'fixed', backgroundColor: 'rgb(240, 240, 240)' }],
    ['glass', { position: 'sticky', backgroundColor: 'rgba(0, 0, 0, 0)' }],
    ['paragraph', { position: 'static', backgroundColor: 'rgb(255, 238, 204)' }],
  ]);

  assert.deepEqual(pinnedWithBackground([...styles.keys()], (name) => styles.get(name) ?? { position: '', backgroundColor: '' }), ['header', 'menu']);
});
