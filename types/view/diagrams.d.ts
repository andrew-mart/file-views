/**
 * @typedef {{ initialize: (config: Record<string, unknown>) => void, render: (id: string, text: string) => Promise<unknown> }} Mermaid
 */
/**
 * Draws the document's mermaid blocks, one after another: the library draws in a scratch node of the page, and two at
 * once would get in each other's way.
 * @param {HTMLElement} doc
 * @param {{ assets: string, theme: 'light' | 'dark' }} options — assets: the address of the library's assets
 */
export function drawDiagrams(doc: HTMLElement, { assets, theme }: {
    assets: string;
    theme: "light" | "dark";
}): Promise<void>;
export type Mermaid = {
    initialize: (config: Record<string, unknown>) => void;
    render: (id: string, text: string) => Promise<unknown>;
};
