// @ts-check
// The pieces of file-views that need no page — for a server that renders markdown itself, checks a Word document's
// styles, tells a file's kind, or for a find bar that counts its matches: no DOM, no window.
export { codeLanguage, codeLanguages, highlightCode, languageOfPath } from './code.js';
export { csvDelimiterOf, csvLines } from './csv.js';
export { keepsDocxLink, keepsDocxSelector, localUrlsOnly } from './docx-safety.js';
export { queryPattern, stepMatch } from './find-text.js';
export { hasSource, kindOfPath } from './kind.js';
export { docLinkTarget, splitFrontMatter } from './links.js';
export { renderMarkdown } from './markdown.js';

/**
 * @typedef {import('./kind.js').FileKind} FileKind
 * @typedef {import('./links.js').DocLink} DocLink
 */
