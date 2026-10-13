/**
 * @param {{ url: string, assets: string }} source — url: the document's bytes; assets: the address of the library's
 *   assets
 * @returns {{ element: HTMLElement, dispose: () => void }}
 */
export function renderDocx({ url, assets }: {
    url: string;
    assets: string;
}): {
    element: HTMLElement;
    dispose: () => void;
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
