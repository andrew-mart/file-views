// @ts-check
// A markdown file drawn as a document: rendered by markdown.js — no raw HTML in it — its pictures and links read from
// where it lies, its headings named for the links to them, its code blocks with a copy button, its mermaid diagrams
// drawn.
import DOMPurify from 'dompurify';
import { h } from '../dom.js';
import { docLinkTarget } from '../links.js';
import { renderMarkdown } from '../markdown.js';
import { drawDiagrams } from './diagrams.js';

/**
 * @typedef {import('./render.js').Host} Host
 */

/**
 * @param {{ path: string, text: string, host: Host, theme: 'light' | 'dark' }} file
 * @returns {HTMLElement}
 */
export function renderMarkdownDocument({ path, text, host, theme }) {
  const doc = h('div', { className: 'fv-markdown' });
  // markdown.js lets no raw HTML through — what it makes is its own markup and escaped text — and DOMPurify checks that
  // over again: the host's page beside the document may do things for its user
  doc.append(DOMPurify.sanitize(renderMarkdown(text), { RETURN_DOM_FRAGMENT: true }));
  for (const image of doc.querySelectorAll('img')) {
    const target = docLinkTarget(path, image.getAttribute('src') ?? '');
    if (target.kind === 'file') image.setAttribute('src', host.imageUrl(target.path));
  }
  for (const link of doc.querySelectorAll('a[href]')) readLink(path, link, host);
  nameHeadings(doc);
  for (const block of doc.querySelectorAll('pre')) {
    if (block.querySelector('code.language-mermaid') === null) block.append(copyButton(block.textContent ?? ''));
  }
  // a link to a place in the document goes there in the view, not to the page's own address
  doc.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a.fv-anchor') : null;
    if (link === null) return;
    event.preventDefault();
    const id = link.getAttribute('data-anchor');
    [...doc.querySelectorAll('[id]')].find((element) => element.id === id)?.scrollIntoView({ block: 'start' });
  });
  host.decorate?.(doc);
  void drawDiagrams(doc, { assets: host.assets, theme });
  return doc;
}

/**
 * A link read from where the document lies: a file — for the host to open — a place in the document, or a page on the
 * web, in a new tab.
 * @param {string} path
 * @param {Element} link
 * @param {Host} host
 */
function readLink(path, link, host) {
  const target = docLinkTarget(path, link.getAttribute('href') ?? '');
  if (target.kind === 'web') {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  } else if (target.kind === 'anchor') {
    link.classList.add('fv-anchor');
    link.setAttribute('data-anchor', slug(target.id));
  } else if (host.fileLink !== undefined && link instanceof HTMLAnchorElement) {
    host.fileLink(link, { path: target.path, line: target.line, endLine: undefined });
  } else {
    link.removeAttribute('href');
    link.setAttribute('title', target.path);
  }
}

/**
 * Each heading gets the name GitHub gives it — its words in lower case joined by hyphens — so links to it find it;
 * a second heading of the same words gets -1, a third -2.
 * @param {HTMLElement} doc
 */
function nameHeadings(doc) {
  /** @type {Map<string, number>} */
  const seen = new Map();
  for (const heading of doc.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const name = slug(heading.textContent ?? '');
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    heading.id = count === 0 ? name : `${name}-${count}`;
  }
}

/**
 * @param {string} words
 */
function slug(words) {
  return words.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
}

/**
 * @param {string} code
 */
function copyButton(code) {
  const button = h('button', { className: 'fv-copy', text: 'Copy', attrs: { type: 'button' } });
  button.addEventListener('click', () => {
    void navigator.clipboard.writeText(code).then(() => {
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = 'Copy'), 1500);
    });
  });
  return button;
}
