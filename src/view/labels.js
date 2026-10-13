// @ts-check
// What a document's viewer says to its reader — in the host's language when the host gives its words, in English when
// it does not.

/**
 * @typedef {{ fileMissing: string, pageNotDrawn: (reason: string) => string }} DocumentLabels — the words when the
 *   document's file did not come; the words in place of a PDF page not drawn
 */

/** @type {DocumentLabels} */
export const englishDocumentLabels = {
  fileMissing: 'the file did not come',
  pageNotDrawn: (reason) => `This page is not drawn: ${reason}`,
};
