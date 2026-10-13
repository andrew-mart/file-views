/**
 * @typedef {import('./page.js').Heading} Heading
 * @typedef {import('./labels.js').DocumentLabels} DocumentLabels
 * @typedef {{ dispose: () => void, headings: () => Heading[] }} DocxView
 */
/**
 * @param {HTMLElement} container — the pages take its place
 * @param {{ url: string, assets: string, fit: 'width' | 'none', labels?: DocumentLabels }} source — url: the document's
 *   bytes; assets: the address of the library's assets; fit: a page wider than the room made smaller to fit, as the room
 *   changes — or left to the host's own zoom; labels: what the view says, in the host's language
 * @returns {Promise<DocxView>} — once the pages are drawn
 */
export function renderDocx(container: HTMLElement, { url, assets, fit, labels }: {
    url: string;
    assets: string;
    fit: "width" | "none";
    labels?: DocumentLabels;
}): Promise<DocxView>;
export type Heading = import("./page.js").Heading;
export type DocumentLabels = import("./labels.js").DocumentLabels;
export type DocxView = {
    dispose: () => void;
    headings: () => Heading[];
};
/**
 * The part of docx-preview the view uses: its own element builder, wrapped, and the drawing.
 */
export type ElementBuilder = (element: unknown) => Node;
/**
 * The part of docx-preview the view uses: its own element builder, wrapped, and the drawing.
 */
export type DocxPreview = {
    renderAsync: (data: Blob, body: HTMLElement, styles: HTMLElement, options: Record<string, unknown>) => Promise<unknown>;
    defaultOptions: {
        h: ElementBuilder;
    };
};
