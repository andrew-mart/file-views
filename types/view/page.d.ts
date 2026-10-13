/**
 * @param {HTMLElement} container — the frame takes its place in it
 * @param {{ url: string, scripts: 'on' | 'off' }} source — url: the page's address, under which what it loads beside
 *   it resolves
 * @returns {Promise<PageView>} — once the page has loaded
 */
export function renderPage(container: HTMLElement, { url, scripts }: {
    url: string;
    scripts: "on" | "off";
}): Promise<PageView>;
export type Finder = import("./find-dom.js").Finder;
export type Heading = {
    level: number;
    text: string;
    node: Element;
};
export type PageScroll = {
    get: () => number;
    set: (top: number) => void;
    subscribe: (listener: () => void) => void;
    max?: () => number;
};
export type PageView = {
    dispose: () => void;
    reveal?: () => void;
    scroll?: PageScroll;
    headings?: () => Heading[];
    offsetOf?: (node: Element) => number;
    keys?: Window;
    finder?: Finder;
    setZoom?: (zoom: number) => void;
    setDark?: (on: boolean) => void;
};
