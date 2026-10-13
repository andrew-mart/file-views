// @ts-check
// Mermaid diagrams in a document drawn as pictures. The library (mermaid.js among the assets, large) loads the first
// time a diagram is met. A diagram goes in as an SVG picture, not as markup: a picture runs no script, whatever the
// diagram's text holds — and the host's page beside it may do things for its user. A diagram the library cannot read
// keeps its text, the reason under it.
import { h } from '../dom.js';
import { isRecord } from '../narrow.js';
import { loadLibrary } from './library.js';

/**
 * @typedef {{ initialize: (config: Record<string, unknown>) => void, render: (id: string, text: string) => Promise<unknown> }} Mermaid
 */

/**
 * Draws the document's mermaid blocks, one after another: the library draws in a scratch node of the page, and two at
 * once would get in each other's way.
 * @param {HTMLElement} doc
 * @param {{ assets: string, theme: 'light' | 'dark' }} options — assets: the address of the library's assets
 */
export async function drawDiagrams(doc, { assets, theme }) {
  const blocks = [...doc.querySelectorAll('pre > code.language-mermaid')].flatMap((code) => (code.parentElement === null ? [] : [{ code, block: code.parentElement }]));
  if (blocks.length === 0) return;
  const mermaid = await loadLibrary('mermaid', new URL('mermaid.js', assets).href).catch((/** @type {unknown} */ error) => error);
  if (!isMermaid(mermaid)) {
    for (const { block } of blocks) failed(block, mermaid);
    return;
  }
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, theme: theme === 'dark' ? 'dark' : 'default' });
  for (const { code, block } of blocks) {
    try {
      const drawn = await mermaid.render(`fv-diagram-${crypto.randomUUID()}`, code.textContent ?? '');
      if (!isRecord(drawn) || typeof drawn.svg !== 'string') throw new Error('mermaid gave no picture');
      const picture = h('img', { attrs: { alt: 'Diagram', src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNaturalSize(drawn.svg))}` } });
      block.replaceWith(h('div', { className: 'fv-diagram' }, [picture]));
    } catch (error) {
      failed(block, error);
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
 * The block stays as text, with why it is not drawn under it.
 * @param {Element} block
 * @param {unknown} error
 */
function failed(block, error) {
  block.after(h('p', { className: 'fv-diagram-error', text: `The diagram is not drawn: ${error instanceof Error ? error.message : String(error)}` }));
}

/**
 * The SVG at its own size, from its viewBox: mermaid sets width="100%", and a picture without a size of its own would
 * stretch to the column; at its own size its words read, a wide one scrolling sideways. DOMParser runs nothing.
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
