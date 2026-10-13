/**
 * @typedef {{ fileMissing: string, pageNotDrawn: (reason: string) => string }} DocumentLabels — the words when the
 *   document's file did not come; the words in place of a PDF page not drawn
 */
/** @type {DocumentLabels} */
export const englishDocumentLabels: DocumentLabels;
/**
 * — the words when the
 *   document's file did not come; the words in place of a PDF page not drawn
 */
export type DocumentLabels = {
    fileMissing: string;
    pageNotDrawn: (reason: string) => string;
};
