// @ts-check
// The server side of file-views, for the host's own server: a file beside a document drawn in a page — fenced to the
// document's folder — the sandbox a page comes in, text decoded, and the library's files for the browser — the views
// and what they load as they go: pdf.js, mermaid, docx-preview.
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative as relativePath, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {'not-absolute' | 'not-found' | 'not-a-file' | 'too-large' | 'outside'} FolderFileRefusal
 * @typedef {{ ok: true, path: string, size: number, mediaType: string } | { ok: false, error: FolderFileRefusal }} FolderFile
 */

/** Media types of documents and of what a page loads beside it; and of the library's own files. */
/** @type {ReadonlyMap<string, string>} */
const mediaTypes = new Map([
  ['.html', 'text/html'],
  ['.htm', 'text/html'],
  ['.css', 'text/css'],
  ['.js', 'text/javascript'],
  ['.mjs', 'text/javascript'],
  ['.json', 'application/json'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
  ['.pdf', 'application/pdf'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.mp3', 'audio/mpeg'],
  ['.txt', 'text/plain'],
  // compiled as it streams in only with its own type: pdf.js's decoders
  ['.wasm', 'application/wasm'],
]);

/**
 * The media type a file is sent with, by its extension; application/octet-stream for one not known.
 * @param {string} path
 */
export function mediaTypeOf(path) {
  return mediaTypes.get(extname(path).toLowerCase()) ?? 'application/octet-stream';
}

/**
 * A file in a document's folder or below it: the document itself — a page, a PDF, a Word document — and what a page
 * loads beside it. Nothing outside the folder: no .. steps out, no absolute path, no link in the folder that leads out.
 * @param {string} folder — the document's folder, absolute
 * @param {string} relative — the file's path from it
 * @param {{ maxBytes: number }} options
 * @returns {Promise<FolderFile>}
 */
export async function folderFileAt(folder, relative, { maxBytes }) {
  if (!isAbsolute(folder)) return { ok: false, error: 'not-absolute' };
  const path = resolve(folder, relative);
  if (!isInside(folder, path)) return { ok: false, error: 'outside' };
  const info = await stat(path).catch(() => undefined);
  if (info === undefined) return { ok: false, error: 'not-found' };
  if (!info.isFile()) return { ok: false, error: 'not-a-file' };
  const [realFolder, realPath] = await Promise.all([realpath(folder), realpath(path)]);
  if (!isInside(realFolder, realPath)) return { ok: false, error: 'outside' };
  if (info.size > maxBytes) return { ok: false, error: 'too-large' };
  return { ok: true, path, size: info.size, mediaType: mediaTypeOf(path) };
}

/**
 * @param {string} folder
 * @param {string} path
 */
function isInside(folder, path) {
  const steps = relativePath(folder, path);
  return steps !== '' && !steps.startsWith('..') && !isAbsolute(steps);
}

/**
 * The Content-Security-Policy a document from its folder is sent with: a sandbox — also when opened in a tab of its
 * own — that runs no script; asked to, it runs them in an origin of its own, out of reach of the host's page and of
 * what the host serves to it.
 * @param {'on' | 'off'} scripts
 */
export function sandboxPolicy(scripts) {
  return `sandbox ${scripts === 'on' ? 'allow-scripts' : 'allow-same-origin'} allow-popups allow-popups-to-escape-sandbox`;
}

/**
 * Text from a file's bytes: UTF-8 — its mark at the head dropped — and what is not UTF-8 as Windows-1251, the old
 * Russian text files.
 * @param {Uint8Array} bytes
 */
export function decodeText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1251').decode(bytes);
  }
}

/**
 * @param {string} specifier
 */
const fileOf = (specifier) => fileURLToPath(import.meta.resolve(specifier));
const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
const pdfjsRoot = dirname(fileOf('pdfjs-dist/package.json'));

/**
 * The library's files for the browser by their path under the address the host serves them at: the views bundled with
 * what they need, their styles, and the libraries they load as they go. docx-preview's ES build imports 'jszip' by
 * name, which a browser cannot resolve: it comes as a script setting a global, as mermaid does.
 * @type {ReadonlyMap<string, string>}
 */
const assetFiles = new Map([
  ['file-views.js', join(packageRoot, 'dist', 'file-views.js')],
  ['file-views.css', join(packageRoot, 'styles', 'file-views.css')],
  ['mermaid.js', fileOf('mermaid/dist/mermaid.min.js')],
  ['jszip.js', fileOf('jszip/dist/jszip.min.js')],
  // its package names only its main files: the script is found beside them
  ['docx-preview.js', join(dirname(fileOf('docx-preview')), 'docx-preview.min.js')],
  ['pdfjs/pdf.mjs', join(pdfjsRoot, 'build', 'pdf.min.mjs')],
  ['pdfjs/pdf.worker.mjs', join(pdfjsRoot, 'build', 'pdf.worker.min.mjs')],
]);

/** Folders of pdf.js it loads its parts from as it goes: character maps, fonts, decoders, colour profiles. */
/** @type {ReadonlyMap<string, string>} */
const assetFolders = new Map(['cmaps', 'standard_fonts', 'wasm', 'iccs'].map((name) => [`pdfjs/${name}/`, join(pdfjsRoot, name)]));

/**
 * The file of the library's assets at a path under their address — file-views.js, pdfjs/cmaps/78-H.bcmap — none for a
 * path that names none, nothing above the folders.
 * @param {string} path — decoded, with forward slashes
 * @returns {string | undefined}
 */
export function assetFile(path) {
  const file = assetFiles.get(path);
  if (file !== undefined) return file;
  for (const [prefix, folder] of assetFolders) {
    if (!path.startsWith(prefix)) continue;
    const inside = resolve(folder, path.slice(prefix.length));
    return inside.startsWith(folder + sep) ? inside : undefined;
  }
  return undefined;
}
