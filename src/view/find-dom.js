// @ts-check
// Finding in a document's markup — a markdown or Word document in the host's page, a page in its own frame. Matches
// are lit by the CSS Custom Highlight API: ranges over the text nodes, no element added — a <mark> around them would
// break a Word document's layout and shift the scroll. The highlights live in the document's own window: a page's is
// its frame's, and the ::highlight() styles go there too (view/page.js puts them).
import { findAll, joinPieces, spanOf } from '../find-text.js';

/**
 * @typedef {{ search: (pattern: RegExp) => Promise<number>, firstInView: () => number, show: (index: number) => Promise<void>, clear: () => void }} Finder
 *   — search: lights every match, says how many; firstInView: the first match not above what is in view, to start
 *   from as a browser does; show: lights one as the current and brings it into view; clear: lights none
 */

/** Names of the highlights: every match, and the current one (file-views.css, ::highlight()). */
export const findAllName = 'fv-find';
export const findCurrentName = 'fv-find-current';

/** Blocks: the text of neighbouring blocks is separate lines — a paragraph's end does not run into the next's start. */
const blocks = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'CAPTION', 'CENTER', 'DD', 'DETAILS', 'DIV', 'DL', 'DT',
  'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'LEGEND',
  'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'TD', 'TH', 'TR', 'UL',
]);
/** Text a page never shows. */
const unseen = 'script, style, noscript, template, textarea';

/**
 * @param {Element} root — the document's body
 * @param {{ viewTop?: () => number, scroller?: Element | undefined }} [options] viewTop: the top of what is in view,
 *   in the document's window: matches above are passed; scroller: what scrolls — a markdown or Word document's area;
 *   none for a page, its window scrolls
 * @returns {Finder}
 */
export function domFinder(root, { viewTop = () => 0, scroller } = {}) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  /** @type {Range[]} */
  let ranges = [];

  /**
   * The text nodes in order, each with its line: the stretch of text between borders — a block, a <br>. Pieces of a
   * line join edge to edge, of different lines with a line break: else "Ann<br>Director" would read "AnnDirector".
   * @returns {{ node: Text, text: string, block: object }[]}
   */
  const pieces = () => {
    if (win === null) return [];
    /** @type {{ node: Text, text: string, block: object }[]} */
    const found = [];
    const filter = win.NodeFilter;
    const walker = doc.createTreeWalker(root, filter.SHOW_ELEMENT | filter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (node instanceof win.Element) {
          // what is never shown goes whole, with what is inside; of the other elements only a break is wanted
          if (node.matches(unseen)) return filter.FILTER_REJECT;
          return node.tagName === 'BR' ? filter.FILTER_ACCEPT : filter.FILTER_SKIP;
        }
        return node instanceof win.Text && node.data !== '' ? filter.FILTER_ACCEPT : filter.FILTER_REJECT;
      },
    });
    /** @type {object | undefined} */
    let line;
    /** @type {Element | null} */
    let lineBlock = null;
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      if (!(node instanceof win.Text)) {
        line = undefined;
        continue;
      }
      let block = node.parentElement;
      while (block !== null && block !== root && !blocks.has(block.tagName)) block = block.parentElement;
      if (line === undefined || block !== lineBlock) {
        line = {};
        lineBlock = block;
      }
      found.push({ node, text: node.data, block: line });
    }
    return found;
  };

  const clear = () => {
    win?.CSS.highlights.delete(findAllName);
    win?.CSS.highlights.delete(findCurrentName);
    ranges = [];
  };

  /** @param {RegExp} pattern */
  const search = async (pattern) => {
    clear();
    if (win === null) return 0;
    const list = pieces();
    const { text, starts } = joinPieces(list);
    ranges = findAll(text, pattern).flatMap(({ start, end }) => {
      const { from, to } = spanOf(starts, start, end);
      const first = list[from[0]];
      const last = list[to[0]];
      if (first === undefined || last === undefined) return [];
      const range = doc.createRange();
      range.setStart(first.node, from[1]);
      range.setEnd(last.node, to[1]);
      return [range];
    });
    if (ranges.length > 0) {
      // not new Highlight(...ranges): tens of thousands of arguments would overflow the stack
      const all = new win.Highlight();
      for (const range of ranges) all.add(range);
      win.CSS.highlights.set(findAllName, all);
    }
    return ranges.length;
  };

  const firstInView = () => {
    const top = viewTop();
    const index = ranges.findIndex((range) => range.getBoundingClientRect().bottom > top);
    return index === -1 ? 0 : index;
  };

  /**
   * The match into view: its parent to the middle first — it brings nested scrolls along (a code block scrolling
   * sideways). A long parent — a code block of a hundred lines in one text node — puts its own middle there, the match
   * still out of view: then the area moves on by the gap between the match and the middle of the view. Instantly: a
   * saved page may ask for smooth scrolling, and a measure after it would land halfway.
   * @param {Range} range
   */
  const reveal = (range) => {
    if (win === null) return;
    range.startContainer.parentElement?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    const box = range.getBoundingClientRect();
    const top = viewTop();
    const bottom = scroller === undefined ? win.innerHeight : scroller.getBoundingClientRect().bottom;
    if (box.top >= top && box.bottom <= bottom) return;
    const delta = (box.top + box.bottom) / 2 - (top + bottom) / 2;
    (scroller ?? win).scrollBy({ top: delta, behavior: 'instant' });
  };

  /** @param {number} index */
  const show = async (index) => {
    const range = ranges[index];
    if (range === undefined || win === null) return;
    const current = new win.Highlight(range);
    // the current one over all the others
    current.priority = 1;
    win.CSS.highlights.set(findCurrentName, current);
    reveal(range);
  };

  return { search, firstInView, show, clear };
}
