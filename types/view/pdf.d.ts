/**
 * @param {{ url: string, assets: string, scroller: HTMLElement }} source — url: the PDF's bytes; assets: the address of
 *   the library's assets; scroller: the element that scrolls the pages
 * @returns {{ element: HTMLElement, dispose: () => void }} — dispose: lets go of the document
 */
export function renderPdf({ url, assets, scroller }: {
    url: string;
    assets: string;
    scroller: HTMLElement;
}): {
    element: HTMLElement;
    dispose: () => void;
};
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
export type PdfPage = {
    getViewport: (options: {
        scale: number;
    }) => Viewport;
    render: (options: {
        canvasContext: CanvasRenderingContext2D;
        viewport: Viewport;
    }) => RenderTask;
    streamTextContent: () => unknown;
};
/**
 * The part of pdf.js the view uses.
 */
export type PdfDocument = {
    numPages: number;
    getPage: (number: number) => Promise<PdfPage>;
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
};
