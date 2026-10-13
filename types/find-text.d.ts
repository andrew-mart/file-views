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
export function queryPattern(query: string): RegExp | undefined;
/**
 * Every match in the text, in order.
 * @param {string} text
 * @param {RegExp} pattern — from queryPattern
 * @returns {TextMatch[]}
 */
export function findAll(text: string, pattern: RegExp): TextMatch[];
/**
 * The pieces as one string: those of one block edge to edge, of different ones with a line break — else the end of a
 * paragraph would run into the start of the next.
 * @param {readonly TextPiece[]} pieces
 * @returns {{ text: string, starts: number[] }} — starts[i]: where piece i starts in the string
 */
export function joinPieces(pieces: readonly TextPiece[]): {
    text: string;
    starts: number[];
};
/**
 * A match of the joined string as pieces and offsets in them, of its start and of its end. A match does not start or
 * end on a break between blocks — a query has no white space at its edges — and an empty piece, standing where the
 * next one does, takes no start.
 * @param {readonly number[]} starts — from joinPieces
 * @param {number} start
 * @param {number} end
 * @returns {{ from: [number, number], to: [number, number] }}
 */
export function spanOf(starts: readonly number[], start: number, end: number): {
    from: [number, number];
    to: [number, number];
};
/**
 * The next (1) or the previous (-1) match, round, as a browser goes through them.
 * @param {number} index
 * @param {number} count
 * @param {1 | -1} direction
 */
export function stepMatch(index: number, count: number, direction: 1 | -1): number;
/**
 * — block: what the piece belongs to; pieces of one block join
 *   edge to edge, of different ones with a line break
 */
export type TextPiece = {
    text: string;
    block: unknown;
};
/**
 * — [start, end) in the joined string, in JS string units
 */
export type TextMatch = {
    start: number;
    end: number;
};
