/**
 * @param {HTMLElement} container — the pages take its place
 * @param {{ url: string, assets: string, scroller: HTMLElement | undefined }} source — url: the PDF's bytes; assets:
 *   the address of the library's assets; scroller: what scrolls the pages — none: the page's window
 * @returns {Promise<PdfView>} — once the pages have their places
 */
export function renderPdf(container: HTMLElement, { url, assets, scroller }: {
    url: string;
    assets: string;
    scroller: HTMLElement | undefined;
}): Promise<PdfView>;
/**
 * The part of pdf.js the view uses.
 */
export type Viewport = {
    width: number;
    height: number;
};
/**
 * The part of pdf.js the view uses.
 */
export type RenderTask = {
    promise: Promise<unknown>;
    cancel: () => void;
};
/**
 * The part of pdf.js the view uses.
 */
export type TextContent = {
    items: {
        str?: string;
        hasEOL?: boolean;
    }[];
};
/**
 * The part of pdf.js the view uses.
 */
export type PdfPage = {
    getViewport: (options: {
        scale: number;
    }) => Viewport;
    render: (options: {
        canvasContext: CanvasRenderingContext2D;
        viewport: Viewport;
    }) => RenderTask;
    streamTextContent: () => unknown;
    getTextContent: () => Promise<TextContent>;
};
/**
 * The part of pdf.js the view uses.
 */
export type OutlineItem = {
    title: string;
    dest: unknown;
    items?: OutlineItem[];
};
/**
 * The part of pdf.js the view uses.
 */
export type PdfDocument = {
    numPages: number;
    getPage: (number: number) => Promise<PdfPage>;
    getOutline: () => Promise<OutlineItem[] | null>;
    getDestination: (name: string) => Promise<unknown[] | null>;
    getPageIndex: (reference: unknown) => Promise<number>;
};
/**
 * The part of pdf.js the view uses.
 */
export type LoadingTask = {
    promise: Promise<PdfDocument>;
    destroy: () => Promise<void>;
};
/**
 * The part of pdf.js the view uses.
 */
export type TextLayer = {
    render: () => Promise<unknown>;
    cancel: () => void;
    textDivs: HTMLElement[];
};
/**
 * The part of pdf.js the view uses.
 */
export type Pdfjs = {
    getDocument: (options: Record<string, unknown>) => LoadingTask;
    GlobalWorkerOptions: {
        workerSrc: string;
    };
    TextLayer: new (options: {
        textContentSource: unknown;
        container: HTMLElement;
        viewport: Viewport;
    }) => TextLayer;
};
/**
 * The part of pdf.js the view uses.
 */
export type PageSlot = {
    element: HTMLElement;
    page: PdfPage;
    viewport: Viewport;
    task: RenderTask | undefined;
    text: TextLayer | undefined;
    ready: Promise<void> | undefined;
};
/**
 * The part of pdf.js the view uses.
 */
export type PdfMatch = {
    page: number;
    start: number;
    end: number;
    range: Range | undefined;
};
/**
 * The part of pdf.js the view uses.
 */
export type Heading = import("./page.js").Heading;
/**
 * The part of pdf.js the view uses.
 */
export type Finder = import("./find-dom.js").Finder;
/**
 * The part of pdf.js the view uses.
 */
export type PdfView = {
    dispose: () => void;
    headings: () => Heading[];
    rezoom: () => void;
    finder: Finder;
};
