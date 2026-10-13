// @ts-check
// Finding in an open document: what a query matches, and where a match lies among the pieces of the text. No DOM.
//
// A document's text comes in pieces — text nodes of markup, lines of a PDF's text layer. It is searched as one string,
// so a match is found across a change of formatting too ("ma" plain, "tch" bold), then laid back onto the pieces, where
// it is highlighted.

const special = /[.*+?^${}()|[\]\\]/g;

/**
 * @typedef {{ text: string, block: unknown }} TextPiece — block: what the piece belongs to; pieces of one block join
 *   edge to edge, of different ones with a line break
 * @typedef {{ start: number, end: number }} TextMatch — [start, end) in the joined string, in JS string units
 */

/**
 * The query as a pattern: any case; ё and е one letter; a space matching any run of white space, line breaks too;
 * the signs patterns use found as they are.
 * @param {string} query
 * @returns {RegExp | undefined} — none: nothing to look for
 */
export function queryPattern(query) {
  const words = query.trim().split(/\s+/).filter((word) => word !== '');
  if (words.length === 0) return undefined;
  const word = (/** @type {string} */ letters) => [...letters].map((char) => (/[её]/iu.test(char) ? '[её]' : char.replace(special, '\\$&'))).join('');
  return new RegExp(words.map(word).join('\\s+'), 'giu');
}

/**
 * Every match in the text, in order.
 * @param {string} text
 * @param {RegExp} pattern — from queryPattern
 * @returns {TextMatch[]}
 */
export function findAll(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => ({ start: match.index, end: match.index + match[0].length }));
}

/**
 * The pieces as one string: those of one block edge to edge, of different ones with a line break — else the end of a
 * paragraph would run into the start of the next.
 * @param {readonly TextPiece[]} pieces
 * @returns {{ text: string, starts: number[] }} — starts[i]: where piece i starts in the string
 */
export function joinPieces(pieces) {
  let text = '';
  /** @type {number[]} */
  const starts = [];
  /** @type {unknown} */
  let block;
  pieces.forEach((piece, index) => {
    if (index > 0 && piece.block !== block) text += '\n';
    block = piece.block;
    starts.push(text.length);
    text += piece.text;
  });
  return { text, starts };
}

/**
 * The last piece whose start is not right of the value — strictly left of it, if strict; by halves.
 * @param {readonly number[]} starts
 * @param {number} value
 * @param {boolean} strict
 */
function lastPieceAt(starts, value, strict) {
  let low = 0;
  let high = starts.length - 1;
  let found = 0;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const start = starts[middle] ?? 0;
    if (strict ? start < value : start <= value) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

/**
 * A match of the joined string as pieces and offsets in them, of its start and of its end. A match does not start or
 * end on a break between blocks — a query has no white space at its edges — and an empty piece, standing where the
 * next one does, takes no start.
 * @param {readonly number[]} starts — from joinPieces
 * @param {number} start
 * @param {number} end
 * @returns {{ from: [number, number], to: [number, number] }}
 */
export function spanOf(starts, start, end) {
  const from = lastPieceAt(starts, start, false);
  const to = lastPieceAt(starts, end, true);
  return { from: [from, start - (starts[from] ?? 0)], to: [to, end - (starts[to] ?? 0)] };
}

/**
 * The next (1) or the previous (-1) match, round, as a browser goes through them.
 * @param {number} index
 * @param {number} count
 * @param {1 | -1} direction
 */
export function stepMatch(index, count, direction) {
  return (index + direction + count) % count;
}
