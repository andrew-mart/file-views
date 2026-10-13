// @ts-check
// Libraries that come as one script setting a global of the page — mermaid, JSZip, docx-preview — loaded the first time
// they are needed.
import { h } from '../dom.js';

/**
 * The global the library set — the window's own property. An element with an id is `window[id]` too, from the
 * window's prototype: `<a id="mermaid">` in a document would pass for mermaid.
 * @param {string} name
 * @returns {unknown}
 */
const globalOf = (name) => (Object.hasOwn(window, name) ? Reflect.get(window, name) : undefined);

/**
 * The library, loaded once for the page by a <script> tag; a load that failed is tried again the next time.
 * @param {string} name — the global it sets
 * @param {string} url — its script
 * @returns {Promise<unknown>}
 */
export function loadLibrary(name, url) {
  const loaded = globalOf(name);
  if (loaded !== undefined) return Promise.resolve(loaded);
  const id = `file-views-${name}`;
  const known = document.getElementById(id);
  const script = known instanceof HTMLScriptElement ? known : h('script', { attrs: { id, src: url } });
  if (script !== known) document.head.append(script);
  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => resolve(globalOf(name)));
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error(`${name} did not load`));
    });
  });
}
