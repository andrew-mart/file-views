import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findAll, joinPieces, queryPattern, spanOf, stepMatch } from '../src/find-text.js';

/** How many times the query is found in the text. @param {string} text @param {string} query */
const count = (text, query) => {
  const pattern = queryPattern(query);
  assert.ok(pattern);
  return findAll(text, pattern).length;
};

// Case does not matter, and ё and е are one letter
test('queryPattern_Should_IgnoreCase_And_TakeYoAndYeAsOneLetter', () => {
  assert.deepEqual([count('Ёлка, ёлка, ЕЛКА и елка', 'ёлка'), count('Ёлка, ёлка, ЕЛКА и елка', 'ЕЛКА')], [4, 4]);
});

// A space in the query matches any run of white space, a line break too
test('queryPattern_Should_MatchSpaceWithAnyWhiteSpace', () => {
  assert.deepEqual([count('moving plan', 'moving plan'), count('moving\nplan', 'moving plan'), count('moving  \t plan', 'moving   plan')], [1, 1, 1]);
});

// The query is found as written: the signs patterns use are signs
test('queryPattern_Should_FindSignsAsTheyAre', () => {
  assert.deepEqual([count('a.b(c) and axb(c)', 'a.b(c)'), count('C++ and C', 'C++'), count('[x] and x', '[x]')], [1, 1, 1]);
});

// An empty query has nothing to look for
test('queryPattern_Should_GiveNothing_ForEmptyQuery', () => {
  assert.deepEqual([queryPattern(''), queryPattern('   ')], [undefined, undefined]);
});

// Matches come in order, with their start and end
test('findAll_Should_GiveMatchesInOrder', () => {
  const pattern = queryPattern('yes');
  assert.ok(pattern);
  assert.deepEqual(findAll('yes, yes and yes', pattern), [
    { start: 0, end: 3 },
    { start: 5, end: 8 },
    { start: 13, end: 16 },
  ]);
});

// Pieces of one block join edge to edge, of different ones with a line break: the end of a paragraph does not run into
// the start of the next
test('joinPieces_Should_JoinBlockEdgeToEdge_AndBlocksWithLineBreak', () => {
  const first = { id: 'p1' };
  const second = { id: 'p2' };
  const { text } = joinPieces([{ text: 'end', block: first }, { text: 'start', block: second }]);

  assert.deepEqual(
    { joined: joinPieces([{ text: 'mov', block: first }, { text: 'ing', block: first }, { text: 'start', block: second }]), across: count(text, 'dst'), apart: count(text, 'end start') },
    { joined: { text: 'moving\nstart', starts: [0, 3, 7] }, across: 0, apart: 1 },
  );
});

// A match is laid back onto pieces and offsets — across a border between pieces too; empty pieces do not throw it off
test('spanOf_Should_LayMatchOntoPieces_AcrossBorders_AndPastEmptyPieces', () => {
  const across = joinPieces([{ text: 'hal', block: 1 }, { text: 'fway', block: 1 }]);
  const pattern = queryPattern('alfw');
  assert.ok(pattern);
  const [match] = findAll(across.text, pattern);
  assert.ok(match);
  const empty = joinPieces([{ text: 'ab', block: 1 }, { text: '', block: 1 }, { text: 'cd', block: 1 }]);

  assert.deepEqual([spanOf(across.starts, match.start, match.end), empty.text, spanOf(empty.starts, 0, 2), spanOf(empty.starts, 2, 4)], [
    { from: [0, 1], to: [1, 2] },
    'abcd',
    { from: [0, 0], to: [0, 2] },
    { from: [2, 0], to: [2, 2] },
  ]);
});

// Going through the matches goes round
test('stepMatch_Should_GoRound', () => {
  assert.deepEqual([stepMatch(16, 17, 1), stepMatch(0, 17, -1), stepMatch(3, 17, 1)], [0, 16, 4]);
});
