/**
 * @param {HTMLElement} container — the frame takes its place in it
 * @param {{ url: string, scripts: 'on' | 'off', frame?: 'scroll' | 'grow', scroller?: HTMLElement | undefined }} source
 *   — url: the page's address, under which what it loads beside it resolves; frame: the frame scrolls its page, or
 *   grows as tall as its page and the scroller scrolls it — a phone may not scroll a frame in a sheet; scroller: what
 *   scrolls the host's area — none, the window
 * @returns {Promise<PageView>} — once the page has loaded
 */
export function renderPage(container: HTMLElement, { url, scripts, frame: framing, scroller }: {
    url: string;
    scripts: "on" | "off";
    frame?: "scroll" | "grow";
    scroller?: HTMLElement | undefined;
}): Promise<PageView>;
/**
 * — what scrolls the host's area, an element or the window: how tall its view is; where its scrolled content starts
 * in the window; how far it is scrolled; scrolled to a place; where its scroll events come
 */
export type ScrollArea = {
    height: () => number;
    origin: () => number;
    top: () => number;
    to: (top: number) => void;
    events: EventTarget;
};
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
