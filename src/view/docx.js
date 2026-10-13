// @ts-check
// A Word document drawn by docx-preview (docx-preview.js and jszip.js among the assets): its pages with their margins,
// headers and footers, in the host's own page. So what of the document is kept is checked (docx-safety.js): its styles
// only where they start at the document, its links only to places in it, the web and mail, and an HTML piece it holds
// (altChunk) in a frame that runs nothing and fetches nothing.
import { h } from '../dom.js';
import { keepsDocxLink, keepsDocxSelector, localUrlsOnly } from '../docx-safety.js';
import { isRecord } from '../narrow.js';
import { loadLibrary } from './library.js';

/**
 * The part of docx-preview the view uses: its own element builder, wrapped, and the drawing.
 * @typedef {(element: unknown) => Node} ElementBuilder
 * @typedef {{ renderAsync: (data: Blob, body: HTMLElement, styles: HTMLElement, options: Record<string, unknown>) => Promise<unknown>, defaultOptions: { h: ElementBuilder } }} DocxPreview
 */

/** An HTML piece of the document: no script, form, pop-up or navigation; its frame keeps the page's origin only to
 * fit its height to what it holds — with no script that gives the piece nothing. */
const pieceSandbox = 'allow-same-origin';
/** Only pictures and fonts inside the document: an address outside would tell a server the document is open. */
const piecePolicy = "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:";

/**
 * @typedef {import('./page.js').Heading} Heading
 * @typedef {{ dispose: () => void, headings: () => Heading[] }} DocxView
 */

/**
 * @param {HTMLElement} container — the pages take its place
 * @param {{ url: string, assets: string, fit: 'width' | 'none' }} source — url: the document's bytes; assets: the
 *   address of the library's assets; fit: a page wider than the room made smaller to fit, as the room changes — or left
 *   to the host's own zoom
 * @returns {Promise<DocxView>} — once the pages are drawn
 */
export async function renderDocx(container, { url, assets, fit }) {
  // docx-preview finds JSZip as a global of the page
  await loadLibrary('JSZip', new URL('jszip.js', assets).href);
  const docx = await loadLibrary('docx', new URL('docx-preview.js', assets).href);
  if (!isDocxPreview(docx)) throw new Error('docx-preview is not what file-views knows');
  const response = await fetch(url);
  if (!response.ok) throw new Error('the file did not come');
  const bytes = await response.blob();
  const pages = h('div', { className: 'fv-docx' });
  container.replaceChildren(pages);
  // the library puts the document's styles here, out of the page: they go in checked
  const styles = h('div');
  await docx.renderAsync(bytes, pages, styles, {
    inWrapper: true,
    breakPages: true,
    renderAltChunks: true,
    h: sandboxingPieces(docx.defaultOptions.h),
    renderHeaders: true,
    renderFooters: true,
    ignoreLastRenderedPageBreak: false,
  });
  pages.prepend(...[...styles.querySelectorAll('style')].map((style) => checkedStyle(style.textContent ?? '')));
  for (const link of pages.querySelectorAll('a[href]')) keepLink(link, pages);
  const fitting = fit === 'width' ? fitToWidth(pages) : undefined;
  return {
    dispose: () => fitting?.disconnect(),
    // Word's headings are no h1–h6 but paragraphs of a style: docx-preview puts it in their class — docx_heading1,
    // docx_heading2 — the level at its end
    headings: () =>
      [...pages.querySelectorAll('p[class*="docx_heading"]')].flatMap((node) => {
        const level = Number(/docx_heading(\d)/.exec(node.className)?.[1]);
        return Number.isFinite(level) ? [{ level, text: node.textContent ?? '', node }] : [];
      }),
  };
}

/**
 * The pages made smaller to fit when wider than the room, and again as the room gets wider or narrower: the widest
 * sets the scale for all.
 * @param {HTMLElement} pages
 * @returns {ResizeObserver | undefined}
 */
function fitToWidth(pages) {
  const wrapper = pages.querySelector('.docx-wrapper');
  if (!(wrapper instanceof HTMLElement)) return undefined;
  const widest = Math.max(...[...wrapper.querySelectorAll(':scope > section')].map((page) => (page instanceof HTMLElement ? page.offsetWidth : 0)));
  let room = 0;
  const fitting = new ResizeObserver(() => {
    // its height changes with the scale; only a new width is fitted to
    if (pages.clientWidth === room) return;
    room = pages.clientWidth;
    wrapper.style.zoom = widest > room - 2 * margin && room > 2 * margin ? String((room - 2 * margin) / widest) : '';
  });
  fitting.observe(pages);
  return fitting;
}

/** Room around the pages, px. */
const margin = 16;

/**
 * docx-preview's element builder, but the frame of an HTML piece of the document gets its sandbox and policy as it is
 * made: the library writes the piece in later, when the page already shows it, and a sandbox set after drawing would
 * come too late — the piece would load with scripts in the viewer's origin.
 * @param {ElementBuilder} build
 * @returns {ElementBuilder}
 */
function sandboxingPieces(build) {
  return (described) => {
    const made = build(described);
    if (!(made instanceof HTMLIFrameElement)) return made;
    made.setAttribute('sandbox', pieceSandbox);
    made.setAttribute('csp', piecePolicy);
    made.classList.add('fv-docx-piece');
    made.addEventListener('load', () => {
      const content = made.contentDocument?.documentElement;
      if (content !== undefined) made.style.height = `${content.scrollHeight}px`;
    });
    return made;
  };
}

/**
 * The document's styles, rule by rule as the browser reads them, with only the rules that start at the document and
 * only the addresses inside it.
 * @param {string} text
 * @returns {HTMLStyleElement}
 */
function checkedStyle(text) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(text);
  const style = h('style', { text: keptRules(sheet.cssRules).join('\n') });
  if (!(style instanceof HTMLStyleElement)) throw new Error('no style element made');
  return style;
}

/**
 * @param {CSSRuleList} rules
 * @returns {string[]}
 */
function keptRules(rules) {
  return [...rules].flatMap((rule) => {
    if (rule instanceof CSSStyleRule) return keepsDocxSelector(rule.selectorText) ? [`${rule.selectorText} { ${localDeclarations(rule.style)} }`] : [];
    if (rule instanceof CSSFontFaceRule) return [`@font-face { ${localDeclarations(rule.style)} }`];
    if (rule instanceof CSSMediaRule) {
      const inner = keptRules(rule.cssRules);
      return inner.length > 0 ? [`@media ${rule.conditionText} { ${inner.join('\n')} }`] : [];
    }
    return [];
  });
}

/**
 * A rule's declarations without those that fetch from outside: a rule with none of them is kept as written — a
 * shorthand with var() taken apart would lose its values; otherwise property by property.
 * @param {CSSStyleDeclaration} style
 */
function localDeclarations(style) {
  if (localUrlsOnly(style.cssText)) return style.cssText;
  return [...style]
    .filter((name) => localUrlsOnly(style.getPropertyValue(name)))
    .map((name) => `${name}: ${style.getPropertyValue(name)}${style.getPropertyPriority(name) === 'important' ? ' !important' : ''};`)
    .join(' ');
}

/**
 * A link of the document: to a place in it — Word's table of contents — it goes there in the view; to the web or
 * mail, in a new tab; anything else loses its address.
 * @param {Element} link
 * @param {HTMLElement} pages
 */
function keepLink(link, pages) {
  const href = link.getAttribute('href') ?? undefined;
  if (!keepsDocxLink(href)) {
    link.removeAttribute('href');
    return;
  }
  if (href === undefined || !href.startsWith('#')) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    return;
  }
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const id = decodeURIComponent(href.slice(1));
    [...pages.querySelectorAll('[id]')].find((one) => one.id === id)?.scrollIntoView({ block: 'start' });
  });
}

/**
 * @param {unknown} value
 * @returns {value is DocxPreview}
 */
function isDocxPreview(value) {
  return isRecord(value) && typeof value.renderAsync === 'function' && isRecord(value.defaultOptions) && typeof value.defaultOptions.h === 'function';
}
