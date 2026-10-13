/**
 * @param {{ path: string, text: string, kind: FileKind, line: number | undefined, endLine: number | undefined }} file
 * @returns {{ element: HTMLElement, reveal: (scroller: HTMLElement) => void }} — reveal: scrolls the named lines into
 *   view, once the element is in the page
 */
export function renderText({ path, text, kind, line, endLine }: {
    path: string;
    text: string;
    kind: FileKind;
    line: number | undefined;
    endLine: number | undefined;
}): {
    element: HTMLElement;
    reveal: (scroller: HTMLElement) => void;
};
export type FileKind = import("../kind.js").FileKind;
/**
 * — fills the code element with the text, marked up
 */
export type Painter = (code: HTMLElement, text: string) => void;
