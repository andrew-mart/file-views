// @ts-check
// A document drawn by its own viewer — an HTML page, a PDF, a Word document — with what the host can do with it once
// drawn: find in it, list its headings, zoom it, darken it, keep and restore its scroll. Each viewer gives what it can.
import { renderDocx } from './docx.js';
import { renderPage } from './page.js';
import { renderPdf } from './pdf.js';

/**
 * @typedef {import('./page.js').Heading} Heading
 * @typedef {import('./page.js').PageScroll} PageScroll
 * @typedef {import('./find-dom.js').Finder} Finder
 * @typedef {'html' | 'pdf' | 'docx'} DocumentKind
 * @typedef {{ dispose: () => void, reveal?: () => void, scroll?: PageScroll, headings?: () => Heading[], offsetOf?: (node: Element) => number, keys?: Window, finder?: Finder, setZoom?: (zoom: number) => void, rezoom?: () => void, setDark?: (on: boolean) => void }} DocumentView
 *   — dispose: lets go of what the view holds; reveal: shows a page once its look, zoom and place are laid on it;
 *   scroll: a page's own window's — a page scrolls itself, not the host's area; headings: for a table of contents;
 *   offsetOf: a heading's place in what scrolls; keys: the window keys pressed in a page go to; finder: finding in the
 *   document; setZoom: a page's own zoom — the host zooms the others itself; rezoom: drawn again after the host's zoom
 *   changed (a PDF's canvases); setDark: a page's dark look
 * @typedef {{ kind: DocumentKind, url: string, assets: string, scripts: 'on' | 'off', scroller: HTMLElement | undefined, fit: 'width' | 'none' }} DocumentSource
 *   — url: the document's bytes — a page's address, under which what it loads beside it resolves; assets: the address
 *   of the library's assets; scripts: whether a page runs its scripts; scroller: what scrolls a PDF's pages — none, the
 *   window; fit: a Word document's pages fitted to the width, or left to the host's zoom
 */

/**
 * Draws the document into the container, in place of what it held.
 * @param {HTMLElement} container
 * @param {DocumentSource} source
 * @returns {Promise<DocumentView>} — once it is drawn; rejects when it cannot be
 */
export function renderDocument(container, source) {
  switch (source.kind) {
    case 'html':
      return renderPage(container, source);
    case 'pdf':
      return renderPdf(container, source);
    case 'docx':
      return renderDocx(container, source);
    default: {
      /** @type {never} */
      const unknown = source.kind;
      throw new Error(`no viewer for ${String(unknown)}`);
    }
  }
}

/**
 * Whether a file of this kind is drawn by its own viewer.
 * @param {string} kind
 * @returns {kind is DocumentKind}
 */
export function hasDocumentView(kind) {
  return kind === 'html' || kind === 'pdf' || kind === 'docx';
}
