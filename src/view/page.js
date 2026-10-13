// @ts-check
// An HTML page drawn in a frame from its folder — what it loads beside it coming from there too — as it is: its own
// fonts, layout and colours. Its scripts off, the frame shares the host's origin so the page can be read — its
// headings, its text to find in, a dark look laid over it, its scroll — and nothing in it runs. Its scripts on, they
// run in an origin of their own, out of reach of the host's page: the page cannot be read then, and its scroll comes by
// messages from the bridge the host's server adds to it (server: withScrollBridge).
import { h } from '../dom.js';
import { pinnedWithBackground } from '../pinned.js';
import { domFinder, findAllName, findCurrentName } from './find-dom.js';

/**
 * @typedef {import('./find-dom.js').Finder} Finder
 * @typedef {{ level: number, text: string, node: Element }} Heading
 * @typedef {{ get: () => number, set: (top: number) => void, subscribe: (listener: () => void) => void, max?: () => number }} PageScroll
 * @typedef {{ dispose: () => void, reveal?: () => void, scroll?: PageScroll, headings?: () => Heading[], offsetOf?: (node: Element) => number, keys?: Window, finder?: Finder, setZoom?: (zoom: number) => void, setDark?: (on: boolean) => void }} PageView
 */

/** The page's sandbox: the frame's and the server's (server: sandboxPolicy) add up — only what both allow is allowed.
 * Links that open a new window (target="_blank", as job sites save their pages) need allow-popups, and
 * allow-popups-to-escape-sandbox lets the site opened run as it should. */
const sandboxWithoutScripts = 'allow-same-origin allow-popups allow-popups-to-escape-sandbox';
const sandboxWithScripts = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';

/** How long a page may stay hidden waiting for its look: load waits for its pictures too, and a slow one could take
 * forever. */
const hideUntilLookMs = 1000;
const darkStyleId = 'fv-dark';
const findStyleId = 'fv-find';
/** The mark of a pinned element with a ground of its own: the dark look leaves it a ground (pinned.js). */
const pinnedAttribute = 'data-fv-pinned';

/** The find highlights in the page's own document: the host's styles do not reach into the frame. */
const findPageCss = `
  ::highlight(${findAllName}) { background-color: #ffe25a !important; color: #111 !important; }
  ::highlight(${findCurrentName}) { background-color: #ff9632 !important; color: #111 !important; }
`;

/**
 * A page's dark look, laid in its document: not an inversion — photos and coloured diagrams would come out as
 * negatives. Saved pages have rules for every element, so colours are forced with !important; pictures and videos are
 * the content and are left alone; pinned elements with a ground of their own keep a dark one — text slides under them.
 */
const darkPageCss = `
  html, body { background: #17161a !important; }
  body, body * { color: #e8e6e3 !important; border-color: #3a3841 !important; }
  body *:not(img):not(video):not(canvas):not(svg):not(iframe) { background-color: transparent !important; }
  body [${pinnedAttribute}] { background-color: #17161a !important; }
  a, a * { color: #8fb8ff !important; }
  code, pre, blockquote { background-color: #201f25 !important; }
  img, video, canvas, svg { filter: none !important; }
`;

/**
 * @param {HTMLElement} container — the frame takes its place in it
 * @param {{ url: string, scripts: 'on' | 'off' }} source — url: the page's address, under which what it loads beside
 *   it resolves
 * @returns {Promise<PageView>} — once the page has loaded
 */
export async function renderPage(container, { url, scripts }) {
  const frame = h('iframe', { className: 'fv-frame', attrs: { sandbox: scripts === 'on' ? sandboxWithScripts : sandboxWithoutScripts, src: url, referrerpolicy: 'no-referrer' } });
  // The page stays hidden until its look is laid on it: drawn in its own light colours before load, after which a dark
  // look comes, it would flash white over the whole area. reveal shows it once the view is ready; a page whose
  // pictures keep load waiting shows as it is after a while.
  frame.style.visibility = 'hidden';
  const giveUp = setTimeout(() => (frame.style.visibility = ''), hideUntilLookMs);
  const reveal = () => {
    clearTimeout(giveUp);
    frame.style.visibility = '';
  };
  container.replaceChildren(frame);
  await new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));

  // The page's document may not be reachable: a page with scripts has an origin of its own on purpose, and the browser
  // may deem one without them so. It shows anyway, without a look, finding or headings; the scroll of a page with
  // scripts comes by its bridge.
  const win = readableWindow(frame);
  if (win === undefined) {
    reveal();
    if (scripts !== 'on') return { dispose: () => {} };
    const bridge = bridgedScroll(frame);
    return { dispose: bridge.dispose, scroll: bridge.scroll };
  }
  const pageDocument = win.document;
  const findStyle = pageDocument.createElement('style');
  findStyle.id = findStyleId;
  findStyle.textContent = findPageCss;
  (pageDocument.head ?? pageDocument.documentElement).append(findStyle);

  return {
    dispose: () => {},
    reveal,
    scroll: {
      get: () => win.scrollY,
      // instant: a saved page may ask for smooth scrolling, and going back to a place is no jump by a link
      set: (top) => win.scrollTo({ top, left: 0, behavior: 'instant' }),
      subscribe: (listener) => win.addEventListener('scroll', listener, { passive: true }),
      max: () => pageDocument.documentElement.scrollHeight - win.innerHeight,
    },
    setDark: (on) => {
      const existing = pageDocument.getElementById(darkStyleId);
      if (!on) {
        existing?.remove();
        return;
      }
      if (existing !== null) return;
      // pinned elements are marked before the look: after it every ground is transparent, and a header with its own
      // could not be told from one without
      const all = pageDocument.body?.querySelectorAll('*') ?? [];
      for (const node of pinnedWithBackground(all, (element) => win.getComputedStyle(element))) node.setAttribute(pinnedAttribute, '');
      const style = pageDocument.createElement('style');
      style.id = darkStyleId;
      style.textContent = darkPageCss;
      (pageDocument.head ?? pageDocument.documentElement).append(style);
    },
    headings: () => [...pageDocument.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((node) => ({ level: Number(node.tagName[1]), text: node.textContent ?? '', node })),
    // in the page's document: it scrolls, not the host's
    offsetOf: (node) => Math.max(0, Math.round(node.getBoundingClientRect().top + win.scrollY - 12)),
    // keys pressed in the page go to its window, not the host's
    keys: win,
    finder: domFinder(pageDocument.body ?? pageDocument.documentElement),
    // the page's own root: the frame keeps its size, the text in it grows or shrinks and wraps, as in a browser
    setZoom: (zoom) => {
      pageDocument.documentElement.style.zoom = zoom === 1 ? '' : String(zoom);
    },
  };
}

/**
 * @param {HTMLIFrameElement} frame
 * @returns {Window | undefined}
 */
function readableWindow(frame) {
  try {
    const win = frame.contentWindow;
    return win !== null && win.document !== null ? win : undefined;
  } catch {
    return undefined; // an origin of its own: nothing of it to read
  }
}

/**
 * The scroll of a page with scripts, by its bridge's messages: the last place the page told, or was sent to. Messages
 * count only from its own frame; once the frame is gone there is nothing to listen to.
 * @param {HTMLIFrameElement} frame
 * @returns {{ scroll: PageScroll, dispose: () => void }}
 */
function bridgedScroll(frame) {
  let top = 0;
  /** @type {(() => void)[]} */
  const listeners = [];
  /** @param {MessageEvent} event */
  const onMessage = (event) => {
    if (!frame.isConnected) {
      window.removeEventListener('message', onMessage);
      return;
    }
    const data = event.data;
    if (event.source !== frame.contentWindow || typeof data !== 'object' || data === null || data.fileViews !== 'scroll' || typeof data.top !== 'number') return;
    top = data.top;
    for (const listener of listeners) listener();
  };
  window.addEventListener('message', onMessage);
  return {
    scroll: {
      get: () => top,
      set: (value) => {
        top = value;
        // the page's origin is opaque, there is no name to send to: *; a scroll place is no secret
        frame.contentWindow?.postMessage({ fileViews: 'scroll-to', top: value }, '*');
      },
      subscribe: (listener) => {
        listeners.push(listener);
      },
    },
    dispose: () => window.removeEventListener('message', onMessage),
  };
}
