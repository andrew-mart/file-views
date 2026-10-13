// @ts-check
// What a file is, to show it as such: by its extension, in any case.

/**
 * @typedef {'markdown' | 'csv' | 'text' | 'html' | 'pdf' | 'docx' | 'image' | 'code'} FileKind — code: any other file,
 *   its text shown as it is, highlighted when its language is known
 */

/** @type {ReadonlyMap<string, FileKind>} */
const kindByExtension = new Map([
  ['md', 'markdown'],
  ['markdown', 'markdown'],
  ['mdown', 'markdown'],
  ['csv', 'csv'],
  ['tsv', 'csv'],
  ['txt', 'text'],
  ['log', 'text'],
  ['html', 'html'],
  ['htm', 'html'],
  ['pdf', 'pdf'],
  ['docx', 'docx'],
  ['png', 'image'],
  ['jpg', 'image'],
  ['jpeg', 'image'],
  ['gif', 'image'],
  ['webp', 'image'],
]);

/**
 * @param {string} path
 * @returns {FileKind}
 */
export function kindOfPath(path) {
  const extension = /\.(\w+)$/.exec(path)?.[1]?.toLowerCase();
  return (extension === undefined ? undefined : kindByExtension.get(extension)) ?? 'code';
}

/**
 * Whether a file of this kind is shown drawn — a document, a page — with its text a choice away.
 * @param {FileKind} kind
 */
export function hasSource(kind) {
  return kind === 'markdown' || kind === 'html';
}
