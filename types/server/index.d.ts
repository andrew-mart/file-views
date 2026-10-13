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
