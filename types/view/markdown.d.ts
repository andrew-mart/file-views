/**
 * @typedef {import('./render.js').Host} Host
 */
/**
 * @param {{ path: string, text: string, host: Host, theme: 'light' | 'dark' }} file
 * @returns {HTMLElement}
 */
export function renderMarkdownDocument({ path, text, host, theme }: {
    path: string;
    text: string;
    host: Host;
    theme: "light" | "dark";
}): HTMLElement;
export type Host = import("./render.js").Host;
