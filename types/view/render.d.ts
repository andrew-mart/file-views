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
export function renderFile(container: HTMLElement, target: FileTarget, options: ViewOptions, host: Host): FileView;
export type FileKind = import("../kind.js").FileKind;
/**
 * — line, endLine: the
 *  lines a link names, marked and scrolled to in the file's text
 */
export type FileTarget = {
    path: string;
    line: number | undefined;
    endLine: number | undefined;
};
/**
 * — message: why the text is not
 *  there, in the host's words, shown in its place
 */
export type TextReply = {
    ok: true;
    text: string;
} | {
    ok: false;
    message: string;
};
/**
 * — what the host does for the views: its server holds the files
 */
export type Host = {
    /**
     * — a file's text
     */
    text: (path: string) => Promise<TextReply>;
    /**
     * — the address of a document's bytes — a
     * page, a PDF, a Word document — under which what lies beside it resolves too (a page's styles and pictures); a
     * page sent with the sandbox policy for its scripts (server: sandboxPolicy)
     */
    documentUrl: (path: string, scripts: "on" | "off") => string;
    /**
     * — the address of a picture
     */
    imageUrl: (path: string) => string;
    /**
     * — the address the library's assets are served at, ending in / (server: assetFile)
     */
    assets: string;
    /**
     * makes a document's link
     * to another file open it the host's way; without it such a link only names the file
     */
    fileLink?: ((link: HTMLAnchorElement, target: FileTarget) => void) | undefined;
    /**
     * anything more the host does to a drawn document
     */
    decorate?: ((root: HTMLElement) => void) | undefined;
    /**
     * the page's theme, for diagrams; light without it
     */
    theme?: (() => "light" | "dark") | undefined;
};
/**
 * — view: a markdown document or a page
 *  drawn, or its text; scripts: whether a page runs its scripts
 */
export type ViewOptions = {
    view: "document" | "source";
    scripts: "on" | "off";
};
/**
 * — dispose: lets go of what the view holds — a PDF's
 *  pages — and of what still loads
 */
export type FileView = {
    kind: FileKind;
    dispose: () => void;
};
