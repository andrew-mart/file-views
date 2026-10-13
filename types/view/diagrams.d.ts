/**
 * Draws the document's diagrams: their blocks the first time, the drawn ones again — in the theme asked for. One after
 * another: the library draws in a scratch node of the page, and two at once would get in each other's way. Throws
 * nothing: a diagram not drawn stays its text.
 * @param {HTMLElement} doc
 * @param {{ assets: string, theme: 'light' | 'dark', labels?: DiagramLabels }} options — assets: the address of the
 *   library's assets
 */
export function drawDiagrams(doc: HTMLElement, { assets, theme, labels }: {
    assets: string;
    theme: "light" | "dark";
    labels?: DiagramLabels;
}): Promise<void>;
export type Mermaid = {
    initialize: (config: Record<string, unknown>) => void;
    render: (id: string, text: string) => Promise<unknown>;
};
/**
 * — a picture's alternative text, the
 *  words under a diagram not drawn
 */
export type DiagramLabels = {
    diagram: string;
    notDrawn: (reason: string) => string;
};
