/**
 * The media type a file is sent with, by its extension; application/octet-stream for one not known.
 * @param {string} path
 */
export function mediaTypeOf(path: string): string;
/**
 * A file in a document's folder or below it: the document itself — a page, a PDF, a Word document — and what a page
 * loads beside it. Nothing outside the folder: no .. steps out, no absolute path, no link in the folder that leads out.
 * @param {string} folder — the document's folder, absolute
 * @param {string} relative — the file's path from it
 * @param {{ maxBytes: number }} options
 * @returns {Promise<FolderFile>}
 */
export function folderFileAt(folder: string, relative: string, { maxBytes }: {
    maxBytes: number;
}): Promise<FolderFile>;
/**
 * The Content-Security-Policy a document from its folder is sent with: a sandbox — also when opened in a tab of its
 * own — that runs no script; asked to, it runs them in an origin of its own, out of reach of the host's page and of
 * what the host serves to it.
 * @param {'on' | 'off'} scripts
 */
export function sandboxPolicy(scripts: "on" | "off"): string;
/**
 * Text from a file's bytes: UTF-8 — its mark at the head dropped — and what is not UTF-8 as Windows-1251, the old
 * Russian text files.
 * @param {Uint8Array} bytes
 */
export function decodeText(bytes: Uint8Array): string;
/**
 * The file of the library's assets at a path under their address — file-views.js, pdfjs/cmaps/78-H.bcmap — none for a
 * path that names none, nothing above the folders.
 * @param {string} path — decoded, with forward slashes
 * @returns {string | undefined}
 */
export function assetFile(path: string): string | undefined;
/**
 * A page's file with the scroll bridge at its end.
 * @param {Uint8Array} page
 * @returns {Uint8Array}
 */
export function withScrollBridge(page: Uint8Array): Uint8Array;
/**
 * The scroll bridge of a page with scripts: such a page has an origin of its own and the host's page cannot read its
 * document, so its scroll goes by messages — page to host { fileViews: 'scroll', top } after scrolling, at most every
 * 50 ms (a timer, not a frame: a window not in view has no frames); host to page { fileViews: 'scroll-to', top } to go
 * back to a place. Going back may not hold at once — the order comes at load, before the page may have its size, and the
 * browser cuts the scroll to nothing — so the place is kept and set again while the document grows, until it holds, 3 s
 * pass, or the reader scrolls. The bridge listens only to the parent window, the host only to its frame (view/page.js):
 * a page can fake a scroll message and spoil only its own kept place. Plain ASCII, added at the end of the page's file:
 * neither its doctype nor its encoding are touched.
 */
export const scrollBridge: "<script>\n(function () {\n  var host = window.parent;\n  if (host === window) return;\n  var root = document.documentElement;\n  var sent = null;\n  var queued = false;\n  var wanted = null;\n  var until = 0;\n  function report() {\n    queued = false;\n    var top = Math.round(window.scrollY);\n    if (top === sent) return;\n    sent = top;\n    host.postMessage({ fileViews: 'scroll', top: top }, '*');\n  }\n  function place() {\n    if (wanted === null) return;\n    window.scrollTo({ top: wanted, left: 0, behavior: 'instant' });\n    if (Math.round(window.scrollY) >= wanted || Date.now() > until) wanted = null;\n  }\n  function release() {\n    wanted = null;\n  }\n  window.addEventListener('scroll', function () {\n    if (queued) return;\n    queued = true;\n    setTimeout(report, 50);\n  }, { passive: true });\n  ['wheel', 'keydown', 'pointerdown', 'touchstart'].forEach(function (type) {\n    window.addEventListener(type, release, { passive: true, capture: true });\n  });\n  new ResizeObserver(place).observe(root);\n  window.addEventListener('resize', place);\n  window.addEventListener('message', function (e) {\n    if (e.source !== host || !e.data || e.data.fileViews !== 'scroll-to' || typeof e.data.top !== 'number') return;\n    wanted = e.data.top;\n    until = Date.now() + 3000;\n    place();\n  });\n})();\n</script>\n";
export type FolderFileRefusal = "not-absolute" | "not-found" | "not-a-file" | "too-large" | "outside";
export type FolderFile = {
    ok: true;
    path: string;
    size: number;
    mediaType: string;
} | {
    ok: false;
    error: FolderFileRefusal;
};
