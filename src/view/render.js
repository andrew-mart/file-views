// @ts-check
// A file drawn in a host's page by what it is: a markdown document or an HTML page drawn — or their text — a table with
// its columns coloured, text and code with numbered lines, a picture, a PDF or a Word document as its pages.
import { h } from '../dom.js';
import { kindOfPath } from '../kind.js';
import { renderDocx } from './docx.js';
import { renderMarkdownDocument } from './markdown.js';
import { renderPdf } from './pdf.js';
import { renderText } from './text.js';

/**
 * @typedef {import('../kind.js').FileKind} FileKind
 * @typedef {{ path: string, line: number | undefined, endLine: number | undefined }} FileTarget — line, endLine: the
 *   lines a link names, marked and scrolled to in the file's text
 * @typedef {{ ok: true, text: string } | { ok: false, message: string }} TextReply — message: why the text is not
 *   there, in the host's words, shown in its place
 * @typedef {object} Host — what the host does for the views: its server holds the files
 * @property {(path: string) => Promise<TextReply>} text — a file's text
 * @property {(path: string, scripts: 'on' | 'off') => string} documentUrl — the address of a document's bytes — a
 *   page, a PDF, a Word document — under which what lies beside it resolves too (a page's styles and pictures); a
 *   page sent with the sandbox policy for its scripts (server: sandboxPolicy)
 * @property {(path: string) => string} imageUrl — the address of a picture
 * @property {string} assets — the address the library's assets are served at, ending in / (server: assetFile)
 * @property {((link: HTMLAnchorElement, target: FileTarget) => void) | undefined} [fileLink] makes a document's link
 *   to another file open it the host's way; without it such a link only names the file
 * @property {((root: HTMLElement) => void) | undefined} [decorate] anything more the host does to a drawn document
 * @property {(() => 'light' | 'dark') | undefined} [theme] the page's theme, for diagrams; light without it
 * @typedef {{ view: 'document' | 'source', scripts: 'on' | 'off' }} ViewOptions — view: a markdown document or a page
 *   drawn, or its text; scripts: whether a page runs its scripts
 * @typedef {{ kind: FileKind, dispose: () => void }} FileView — dispose: lets go of what the view holds — a PDF's
 *   pages — and of what still loads
 */

/**
 * Draws the file into the container, in place of what it held; the container scrolls it.
 * @param {HTMLElement} container
 * @param {FileTarget} target
 * @param {ViewOptions} options
 * @param {Host} host
 * @returns {FileView}
 */
export function renderFile(container, target, options, host) {
  const kind = kindOfPath(target.path);
  let disposed = false;
  let letGo = () => {};
  const show = (/** @type {Node} */ node) => {
    if (!disposed) container.replaceChildren(node);
  };
  if (kind === 'image') show(renderImage(host.imageUrl(target.path), target.path));
  else if (kind === 'html' && options.view === 'document') show(renderPage(host.documentUrl(target.path, options.scripts), target.path, options.scripts));
  else if (kind === 'pdf' || kind === 'docx') {
    const url = host.documentUrl(target.path, 'off');
    const pages = kind === 'pdf' ? renderPdf({ url, assets: host.assets, scroller: container }) : renderDocx({ url, assets: host.assets });
    letGo = pages.dispose;
    show(pages.element);
  } else {
    show(message('Loading…'));
    void host.text(target.path).then((reply) => {
      if (disposed) return;
      if (!reply.ok) return show(message(reply.message));
      if (kind === 'markdown' && options.view === 'document') return show(renderMarkdownDocument({ path: target.path, text: reply.text, host, theme: host.theme?.() ?? 'light' }));
      const text = renderText({ path: target.path, text: reply.text, kind, line: target.line, endLine: target.endLine });
      show(text.element);
      text.reveal(container);
    });
  }
  return {
    kind,
    dispose() {
      disposed = true;
      letGo();
    },
  };
}

/**
 * A page drawn in a frame from its folder, what it loads beside it coming from there too. Its scripts off: no script
 * runs, and the frame shares the host's origin only to be drawn; on: they run in an origin of their own, out of reach
 * of the host's page.
 * @param {string} url
 * @param {string} path
 * @param {'on' | 'off'} scripts
 */
function renderPage(url, path, scripts) {
  const sandbox = `${scripts === 'on' ? 'allow-scripts' : 'allow-same-origin'} allow-popups allow-popups-to-escape-sandbox`;
  return h('iframe', { className: 'fv-frame', title: path, attrs: { sandbox, src: url, referrerpolicy: 'no-referrer' } });
}

/**
 * The picture, fitted to the width; a click shows it at its own size. One that does not load leaves a word instead.
 * @param {string} url
 * @param {string} path
 */
function renderImage(url, path) {
  const image = h('img', { className: 'fv-image', attrs: { alt: path, src: url } });
  image.addEventListener('click', () => image.classList.toggle('fv-zoomed'));
  image.addEventListener('error', () => image.replaceWith(message('The picture is not shown: the file is gone, too large, or not a picture.')));
  return image;
}

/**
 * @param {string} text
 */
function message(text) {
  return h('div', { className: 'fv-message', text });
}
