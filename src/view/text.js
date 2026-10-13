// @ts-check
// A file's text with its lines numbered, painted by what the file is: code highlighted, a table's columns coloured,
// plain text with its web addresses as links; the lines a link names marked and scrolled into view.
import { highlightCode, languageOfPath } from '../code.js';
import { csvDelimiterOf, csvLines } from '../csv.js';
import { h } from '../dom.js';

/**
 * @typedef {import('../kind.js').FileKind} FileKind
 * @typedef {(code: HTMLElement, text: string) => void} Painter — fills the code element with the text, marked up
 */

/** Height of a line, px, and the room above the first: the mark over the named lines is placed by them
 * (file-views.css, .fv-code). */
const lineHeight = 20;
const paddingTop = 10;
/** Larger files are shown plain so the page does not freeze. */
const paintLimit = 400 * 1024;

/**
 * @param {{ path: string, text: string, kind: FileKind, line: number | undefined, endLine: number | undefined }} file
 * @returns {{ element: HTMLElement, reveal: (scroller: HTMLElement) => void }} — reveal: scrolls the named lines into
 *   view, once the element is in the page
 */
export function renderText({ path, text, kind, line, endLine }) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const code = h('code');
  if (text.length <= paintLimit) painterOf(kind, path)(code, lines.join('\n'));
  else code.textContent = lines.join('\n');
  const gutter = h('span', { className: 'fv-gutter', text: lines.map((_, index) => index + 1).join('\n') });
  const view = h('div', { className: 'fv-text' }, [h('pre', { className: 'fv-code' }, [gutter, code])]);
  if (line === undefined) return { element: view, reveal: () => {} };
  if (line > lines.length) {
    const element = h('div', {}, [h('div', { className: 'fv-message', text: `There is no line ${line}: the file has ${lines.length} ${lines.length === 1 ? 'line' : 'lines'}.` }), view]);
    return { element, reveal: () => {} };
  }
  const last = Math.min(Math.max(endLine ?? line, line), lines.length);
  const top = paddingTop + (line - 1) * lineHeight;
  const mark = h('div', { className: 'fv-line-mark' });
  mark.style.top = `${top}px`;
  mark.style.height = `${(last - line + 1) * lineHeight}px`;
  view.prepend(mark);
  return {
    element: view,
    reveal(scroller) {
      scroller.scrollTop = Math.max(0, top - scroller.clientHeight / 3);
      scroller.scrollLeft = 0;
    },
  };
}

/**
 * @param {FileKind} kind
 * @param {string} path
 * @returns {Painter}
 */
function painterOf(kind, path) {
  if (kind === 'csv') return paintColumns;
  if (kind === 'text') return paintAddresses;
  const language = languageOfPath(path);
  if (language === undefined) return (code, text) => (code.textContent = text);
  return (code, text) => {
    // highlight.js escapes the text itself; the markup holds only its spans
    code.innerHTML = highlightCode(text, language);
    code.classList.add('hljs');
  };
}

/**
 * A table's cells coloured by their column, eight colours over and over; the signs between them left plain.
 * @type {Painter}
 */
function paintColumns(code, text) {
  const delimiter = csvDelimiterOf(text);
  /** @type {(Node | string)[]} */
  const parts = [];
  for (const [index, line] of csvLines(text, delimiter).entries()) {
    if (index > 0) parts.push('\n');
    for (const piece of line) parts.push(piece.column === undefined ? piece.text : h('span', { className: `fv-csv-c${piece.column % 8}`, text: piece.text }));
  }
  code.replaceChildren(...parts);
}

/** A web address in text, without the sign that ends the sentence after it. */
const webAddress = /https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]]/g;

/**
 * Text as it is, its web addresses links to open in a new tab.
 * @type {Painter}
 */
function paintAddresses(code, text) {
  /** @type {(Node | string)[]} */
  const parts = [];
  let position = 0;
  for (const found of text.matchAll(webAddress)) {
    parts.push(text.slice(position, found.index), h('a', { text: found[0], attrs: { href: found[0], target: '_blank', rel: 'noopener noreferrer' } }));
    position = found.index + found[0].length;
  }
  parts.push(text.slice(position));
  code.replaceChildren(...parts.filter((part) => part !== ''));
}
