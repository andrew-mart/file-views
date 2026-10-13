// @ts-check
// Mermaid diagrams in a markdown document drawn as pictures. The library (mermaid.js among the assets, large) loads the
// first time a diagram is met. A diagram goes in as an SVG picture, not as markup: a picture runs no script, whatever
// the diagram's text holds — and the host's page beside it may do things for its user. The cost: a diagram's words
// cannot be selected or found in the document. A diagram the library cannot read keeps its text, the reason under it,
// and is not tried again.
import { h } from '../dom.js';
import { isRecord } from '../narrow.js';
import { loadLibrary } from './library.js';

/**
 * @typedef {{ initialize: (config: Record<string, unknown>) => void, render: (id: string, text: string) => Promise<unknown> }} Mermaid
 * @typedef {{ diagram: string, notDrawn: (reason: string) => string }} DiagramLabels — a picture's alternative text, the
 *   words under a diagram not drawn
 */

/** Blocks not tried yet: one that failed is marked and left. */
const sources = 'pre:not([data-diagram-failed]) > code.language-mermaid';
const drawn = '.fv-diagram > img';

/** @type {DiagramLabels} */
const englishLabels = { diagram: 'Diagram', notDrawn: (reason) => `The diagram is not drawn: ${reason}` };

/**
 * Draws the document's diagrams: their blocks the first time, the drawn ones again — in the theme asked for. One after
 * another: the library draws in a scratch node of the page, and two at once would get in each other's way. Throws
 * nothing: a diagram not drawn stays its text.
 * @param {HTMLElement} doc
 * @param {{ assets: string, theme: 'light' | 'dark', labels?: DiagramLabels }} options — assets: the address of the
 *   library's assets
 */
export async function drawDiagrams(doc, { assets, theme, labels = englishLabels }) {
  const blocks = [...doc.querySelectorAll(sources)];
  const pictures = [...doc.querySelectorAll(drawn)].flatMap((picture) => (picture instanceof HTMLImageElement ? [picture] : []));
  if (blocks.length === 0 && pictures.length === 0) return;
  const mermaid = await loadLibrary('mermaid', new URL('mermaid.js', assets).href).catch((/** @type {unknown} */ error) => error);
  if (!isMermaid(mermaid)) {
    for (const code of blocks) failed(code, mermaid, labels);
    return;
  }
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, theme: theme === 'dark' ? 'dark' : 'default' });
  for (const code of blocks) {
    const block = code.parentElement;
    if (block === null) continue;
    try {
      const source = code.textContent ?? '';
      // at its own size, not squeezed to the column: a wide diagram's words would not read; wider than the column, it
      // scrolls sideways as a wide code block does
      const picture = h('img', { attrs: { alt: labels.diagram, 'data-source': source, src: await diagramAddress(mermaid, source) } });
      block.replaceWith(h('div', { className: 'fv-diagram' }, [picture]));
    } catch (error) {
      failed(code, error, labels);
    }
  }
  for (const picture of pictures) {
    try {
      picture.src = await diagramAddress(mermaid, picture.dataset.source ?? '');
    } catch {
      // one drawn before and not drawn again stays in the earlier theme: better than nothing
    }
  }
}

/**
 * @param {unknown} value
 * @returns {value is Mermaid}
 */
function isMermaid(value) {
  return isRecord(value) && typeof value.initialize === 'function' && typeof value.render === 'function';
}

/**
 * The block stays as text, marked tried, with why it is not drawn under it.
 * @param {Element} code
 * @param {unknown} error
 * @param {DiagramLabels} labels
 */
function failed(code, error, labels) {
  const block = code.parentElement;
  if (!(block instanceof HTMLElement)) return;
  block.dataset.diagramFailed = '';
  block.after(h('p', { className: 'fv-diagram-error', text: labels.notDrawn(error instanceof Error ? error.message : String(error)) }));
}

/**
 * The diagram's SVG as a data: address for a picture.
 * @param {Mermaid} mermaid
 * @param {string} text
 */
async function diagramAddress(mermaid, text) {
  const drawn = await mermaid.render(`fv-diagram-${crypto.randomUUID()}`, text);
  if (!isRecord(drawn) || typeof drawn.svg !== 'string') throw new Error('mermaid gave no picture');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNaturalSize(drawn.svg))}`;
}

/**
 * The SVG at its own size, from its viewBox: mermaid sets width="100%", and a picture without a size of its own would
 * stretch to the column. DOMParser runs nothing.
 * @param {string} svg
 */
function withNaturalSize(svg) {
  const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  const box = root instanceof SVGSVGElement ? root.viewBox.baseVal : undefined;
  if (box !== undefined && box.width > 0 && box.height > 0) {
    root.setAttribute('width', String(Math.ceil(box.width)));
    root.setAttribute('height', String(Math.ceil(box.height)));
  }
  return new XMLSerializer().serializeToString(root);
}
