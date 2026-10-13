/**
 * @param {Element} root — the document's body
 * @param {{ viewTop?: () => number, scroller?: Element | undefined }} [options] viewTop: the top of what is in view,
 *   in the document's window: matches above are passed; scroller: what scrolls — a markdown or Word document's area;
 *   none for a page, its window scrolls
 * @returns {Finder}
 */
export function domFinder(root: Element, { viewTop, scroller }?: {
    viewTop?: () => number;
    scroller?: Element | undefined;
}): Finder;
/**
 * @typedef {{ search: (pattern: RegExp) => Promise<number>, firstInView: () => number, show: (index: number) => Promise<void>, clear: () => void }} Finder
 *   — search: lights every match, says how many; firstInView: the first match not above what is in view, to start
 *   from as a browser does; show: lights one as the current and brings it into view; clear: lights none
 */
/** Names of the highlights: every match, and the current one (file-views.css, ::highlight()). */
export const findAllName: "fv-find";
export const findCurrentName: "fv-find-current";
/**
 * — search: lights every match, says how many; firstInView: the first match not above what is in view, to start
 * from as a browser does; show: lights one as the current and brings it into view; clear: lights none
 */
export type Finder = {
    search: (pattern: RegExp) => Promise<number>;
    firstInView: () => number;
    show: (index: number) => Promise<void>;
    clear: () => void;
};
