/**
 * @param {string} path
 * @returns {FileKind}
 */
export function kindOfPath(path: string): FileKind;
/**
 * Whether a file of this kind is shown drawn — a document, a page — with its text a choice away.
 * @param {FileKind} kind
 */
export function hasSource(kind: FileKind): kind is "html" | "markdown";
/**
 * — code: any other file,
 *   its text shown as it is, highlighted when its language is known
 */
export type FileKind = "markdown" | "csv" | "text" | "html" | "pdf" | "docx" | "image" | "code";
