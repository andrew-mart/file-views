// @ts-check
// A PDF drawn by pdf.js (pdfjs/ among the assets): its pages as pictures fitted to the width, the text over them
// invisible, to select, copy and find in. The pages get their places at their size at once — a place to go back to
// lands on its page, not past a document still growing — and are drawn as they come near and let go once far away:
// a long document would otherwise hold a canvas of megabytes for every page. Its table of contents is the file's own
// bookmarks, none made up: a PDF has no styles or levels, only lines placed on pages.
import { h } from '../dom.js';
import { findAll, joinPieces, spanOf } from '../find-text.js';
import { isRecord } from '../narrow.js';
import { findAllName, findCurrentName } from './find-dom.js';
import { englishDocumentLabels } from './labels.js';

/**
 * The part of pdf.js the view uses.
 * @typedef {{ width: number, height: number }} Viewport
 * @typedef {{ promise: Promise<unknown>, cancel: () => void }} RenderTask
 * @typedef {{ items: { str?: string, hasEOL?: boolean }[] }} TextContent
 * @typedef {{ getViewport: (options: { scale: number }) => Viewport, render: (options: { canvasContext: CanvasRenderingContext2D, viewport: Viewport }) => RenderTask, streamTextContent: () => unknown, getTextContent: () => Promise<TextContent> }} PdfPage
 * @typedef {{ title: string, dest: unknown, items?: OutlineItem[] }} OutlineItem
 * @typedef {{ numPages: number, getPage: (number: number) => Promise<PdfPage>, getOutline: () => Promise<OutlineItem[] | null>, getDestination: (name: string) => Promise<unknown[] | null>, getPageIndex: (reference: unknown) => Promise<number> }} PdfDocument
 * @typedef {{ promise: Promise<PdfDocument>, destroy: () => Promise<void> }} LoadingTask
 * @typedef {{ render: () => Promise<unknown>, cancel: () => void, textDivs: HTMLElement[] }} TextLayer
 * @typedef {{ getDocument: (options: Record<string, unknown>) => LoadingTask, GlobalWorkerOptions: { workerSrc: string }, TextLayer: new (options: { textContentSource: unknown, container: HTMLElement, viewport: Viewport }) => TextLayer }} Pdfjs
 * @typedef {{ element: HTMLElement, page: PdfPage, viewport: Viewport, task: RenderTask | undefined, text: TextLayer | undefined, ready: Promise<void> | undefined }} PageSlot
 * @typedef {{ page: number, start: number, end: number, range: Range | undefined }} PdfMatch
 * @typedef {import('./page.js').Heading} Heading
 * @typedef {import('./find-dom.js').Finder} Finder
 * @typedef {import('./labels.js').DocumentLabels} DocumentLabels
 * @typedef {{ dispose: () => void, headings: () => Heading[], rezoom: () => void, finder: Finder }} PdfView
 */

/** Room around the pages, px: their width is the scroller's less this on each side. */
const margin = 16;

/**
 * @param {HTMLElement} container — the pages take its place
 * @param {{ url: string, assets: string, scroller: HTMLElement | undefined, labels?: DocumentLabels }} source — url: the
 *   PDF's bytes; assets: the address of the library's assets; scroller: what scrolls the pages — none: the page's
 *   window; labels: what the view says, in the host's language
 * @returns {Promise<PdfView>} — once the pages have their places
 */
export async function renderPdf(container, { url, assets, scroller, labels = englishDocumentLabels }) {
  const library = new URL('pdfjs/', assets);
  const pdfjs = await import(new URL('pdf.mjs', library).href);
  if (!isPdfjs(pdfjs)) throw new Error('pdf.js is not what file-views knows');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.mjs', library).href;
  const loading = pdfjs.getDocument({
    url,
    cMapUrl: new URL('cmaps/', library).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('standard_fonts/', library).href,
    wasmUrl: new URL('wasm/', library).href,
    iccUrl: new URL('iccs/', library).href,
    // fonts are not compiled into code: a PDF is data from anywhere
    isEvalSupported: false,
  });
  const file = await loading.promise;

  const pages = h('div', { className: 'fv-pages' });
  container.replaceChildren(pages);
  pages.addEventListener('mousedown', holdSelectionInText);
  // the first page's width fitted to the room sets the scale for all
  const first = await file.getPage(1);
  const room = Math.max(240, (scroller ?? container).clientWidth - 2 * margin);
  const scale = room / first.getViewport({ scale: 1 }).width;
  /** @type {PageSlot[]} */
  const slots = [];
  for (let number = 1; number <= file.numPages; number++) {
    const page = number === 1 ? first : await file.getPage(number);
    const viewport = page.getViewport({ scale });
    const element = h('div', { className: 'fv-pdf-page', attrs: { 'data-page': String(number) } });
    element.style.width = `${Math.round(viewport.width)}px`;
    element.style.height = `${Math.round(viewport.height)}px`;
    // the text layer measures itself and its lines by it (file-views.css, .fv-pdf-page)
    element.style.setProperty('--scale-factor', String(scale));
    pages.append(element);
    slots.push({ element, page, viewport, task: undefined, text: undefined, ready: undefined });
  }

  // Finding: the text of every page comes from pdf.js, not from the text layers — only drawn pages have one, and the
  // count and the steps go through the whole file. A match keeps its page and its offsets in the page's text; its range
  // in the layer's lines is made when the page is drawn and dropped when it is let go — the lines come in the order of
  // getTextContent's items with text (TextLayer.textDivs). A first search of a large file waits a while for every
  // page's text, and meanwhile the search may be closed or another begun: each search and each clearing moves the
  // generation on, and a result come late paints nothing.
  /** @type {Promise<{ text: string, starts: number[] }[]> | undefined} */
  let textsLoad;
  /** @type {{ text: string, starts: number[] }[]} */
  let pageTexts = [];
  /** @type {PdfMatch[]} */
  let matches = [];
  let current = -1;
  let generation = 0;
  // the promise is kept, not the result: searches typed while the text loads wait for the same load
  const loadTexts = () => {
    textsLoad ??= Promise.all(
      slots.map(async ({ page }) => {
        const content = await page.getTextContent().catch(() => ({ items: [] }));
        let line = 0;
        const pieces = content.items.flatMap((item) => {
          if (item.str === undefined) return [];
          const piece = { text: item.str, block: line };
          if (item.hasEOL === true) line++;
          return [piece];
        });
        return joinPieces(pieces);
      }),
    );
    return textsLoad;
  };
  /** The matches' ranges on a drawn page, in its text layer's lines. @param {number} pageIndex */
  const placeRanges = (pageIndex) => {
    const divs = slots[pageIndex]?.text?.textDivs;
    const texts = pageTexts[pageIndex];
    for (const match of matches) {
      if (match.page !== pageIndex) continue;
      match.range = undefined;
      if (divs === undefined || divs.length === 0 || texts === undefined) continue;
      const { from, to } = spanOf(texts.starts, match.start, match.end);
      const start = divs[from[0]]?.firstChild;
      const end = divs[to[0]]?.firstChild;
      if (start === undefined || start === null || end === undefined || end === null) continue;
      const range = document.createRange();
      range.setStart(start, from[1]);
      range.setEnd(end, to[1]);
      match.range = range;
    }
  };
  const paint = () => {
    if (matches.length === 0) {
      CSS.highlights.delete(findAllName);
      CSS.highlights.delete(findCurrentName);
      return;
    }
    const all = new Highlight();
    for (const match of matches) if (match.range !== undefined) all.add(match.range);
    CSS.highlights.set(findAllName, all);
    const chosen = matches[current]?.range;
    if (chosen === undefined) {
      CSS.highlights.delete(findCurrentName);
      return;
    }
    const highlight = new Highlight(chosen);
    highlight.priority = 1;
    CSS.highlights.set(findCurrentName, highlight);
  };

  /** The page as a picture at the screen's density — and the zoom's — and its text over it, invisible. @param {PageSlot} slot */
  const draw = (slot) => {
    if (slot.ready !== undefined) return slot.ready;
    const ratio = window.devicePixelRatio * (slot.element.currentCSSZoom || 1);
    const canvas = h('canvas', { attrs: { width: String(Math.round(slot.viewport.width * ratio)), height: String(Math.round(slot.viewport.height * ratio)) } });
    const context = canvas.getContext('2d');
    if (context === null) return Promise.resolve();
    context.scale(ratio, ratio);
    const layer = h('div', { className: 'textLayer' });
    slot.element.replaceChildren(canvas, layer);
    const task = slot.page.render({ canvasContext: context, viewport: slot.viewport });
    const text = new pdfjs.TextLayer({ textContentSource: slot.page.streamTextContent(), container: layer, viewport: slot.viewport });
    slot.task = task;
    slot.text = text;
    const pageIndex = slots.indexOf(slot);
    slot.ready = Promise.all([task.promise, text.render()]).then(
      () => {
        // drawn while a search is on: its matches get lit
        if (matches.length === 0) return;
        placeRanges(pageIndex);
        paint();
      },
      (/** @type {unknown} */ error) => {
        // a page let go while it was being drawn is no failure
        if (isRecord(error) && (error.name === 'RenderingCancelledException' || error.name === 'AbortException')) return;
        slot.element.replaceChildren(h('div', { className: 'fv-message', text: labels.pageNotDrawn(error instanceof Error ? error.message : String(error)) }));
      },
    );
    return slot.ready;
  };
  /** A page far out of view lets its picture go, its place staying at its size: nothing on screen moves. @param {PageSlot} slot */
  const release = (slot) => {
    if (slot.task === undefined) return;
    slot.task.cancel();
    slot.text?.cancel();
    slot.task = undefined;
    slot.text = undefined;
    slot.ready = undefined;
    const pageIndex = slots.indexOf(slot);
    if (matches.some((match) => match.page === pageIndex)) {
      for (const match of matches) if (match.page === pageIndex) match.range = undefined;
      paint();
    }
    slot.element.replaceChildren();
  };
  // a screen's height of pages ahead is drawn before it comes into view, and kept until that far behind
  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slot = slots.find((one) => one.element === entry.target);
        if (slot === undefined) continue;
        if (entry.isIntersecting) void draw(slot);
        else release(slot);
      }
    },
    { root: scroller ?? null, rootMargin: '100% 0px' },
  );
  for (const slot of slots) watcher.observe(slot.element);

  const headings = await outlineOf(file, slots);

  return {
    dispose: () => {
      watcher.disconnect();
      generation++;
      void loading.destroy();
    },
    headings: () => headings,
    // after a change of zoom the drawn pages are drawn again at the new density, else they would stay blurred
    rezoom: () => {
      for (const slot of slots) {
        if (slot.task === undefined) continue;
        release(slot);
        void draw(slot);
      }
    },
    finder: {
      async search(pattern) {
        const mine = ++generation;
        const texts = await loadTexts();
        if (mine !== generation) return 0; // the search was closed or another begun meanwhile
        pageTexts = texts;
        matches = texts.flatMap(({ text }, page) => findAll(text, pattern).map((found) => ({ page, ...found, range: undefined })));
        current = -1;
        slots.forEach((slot, index) => {
          if (slot.text !== undefined) placeRanges(index);
        });
        paint();
        return matches.length;
      },
      firstInView() {
        const top = (scroller ?? document.documentElement).getBoundingClientRect().top;
        const page = slots.findIndex((slot) => slot.element.getBoundingClientRect().bottom > top);
        const index = matches.findIndex((match) => match.page >= Math.max(page, 0));
        return index === -1 ? 0 : index;
      },
      async show(index) {
        const match = matches[index];
        const slot = match === undefined ? undefined : slots[match.page];
        if (match === undefined || slot === undefined) return;
        current = index;
        const mine = generation;
        // a page not drawn is drawn at once: without its lines there is nothing to scroll to
        await draw(slot);
        if (mine !== generation || matches[index] !== match) return;
        if (match.range === undefined) placeRanges(match.page);
        paint();
        match.range?.startContainer.parentElement?.scrollIntoView({ block: 'center', inline: 'nearest' });
      },
      clear() {
        generation++;
        matches = [];
        current = -1;
        paint();
      },
    },
  };
}

/**
 * The file's bookmarks as headings, each at its page; a bookmark leading nowhere is left out.
 * @param {PdfDocument} file
 * @param {readonly PageSlot[]} slots
 * @returns {Promise<Heading[]>}
 */
async function outlineOf(file, slots) {
  const outline = await file.getOutline().catch(() => null);
  if (outline === null || outline.length === 0) return [];
  /** @type {Heading[]} */
  const items = [];
  /** @param {readonly OutlineItem[]} nodes @param {number} level */
  const walk = async (nodes, level) => {
    for (const item of nodes) {
      const page = await pageOf(file, item.dest);
      const slot = page === undefined ? undefined : slots[page];
      if (slot !== undefined) items.push({ level, text: item.title, node: slot.element });
      if (item.items !== undefined && item.items.length > 0) await walk(item.items, Math.min(level + 1, 6));
    }
  };
  await walk(outline, 1);
  return items;
}

/**
 * The page a bookmark leads to, from 0; none when it cannot be told.
 * @param {PdfDocument} file
 * @param {unknown} dest
 * @returns {Promise<number | undefined>}
 */
async function pageOf(file, dest) {
  try {
    const resolved = typeof dest === 'string' ? await file.getDestination(dest) : dest;
    if (!Array.isArray(resolved) || resolved[0] === undefined || resolved[0] === null) return undefined;
    return await file.getPageIndex(resolved[0]);
  } catch {
    return undefined; // a bookmark pdf.js cannot follow
  }
}

/**
 * While a PDF's text is being selected with the mouse, only the pages' text can be: everything else is unselectable
 * (.fv-pdf-selecting) until the button is let go. Chromium ends a selection in the element under the pointer: over a
 * line that is the line, but over a page's margin, a gap between lines or pages or the panel beside it, their end —
 * after all the document's text — and the selection flew to the end of the document. Over what cannot be selected it
 * leaves the selection where the text reached. Let go when the window loses focus too: a button released over another
 * window is not heard.
 * @param {MouseEvent} event
 */
function holdSelectionInText(event) {
  if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest('.textLayer') === null) return;
  document.body.classList.add('fv-pdf-selecting');
  const letGo = () => {
    document.body.classList.remove('fv-pdf-selecting');
    window.removeEventListener('pointerup', letGo);
    window.removeEventListener('blur', letGo);
  };
  window.addEventListener('pointerup', letGo);
  window.addEventListener('blur', letGo);
}

/**
 * @param {unknown} value
 * @returns {value is Pdfjs}
 */
function isPdfjs(value) {
  // GlobalWorkerOptions is a class: its settings are static fields
  return isRecord(value) && typeof value.getDocument === 'function' && typeof value.TextLayer === 'function' && typeof value.GlobalWorkerOptions === 'function';
}
