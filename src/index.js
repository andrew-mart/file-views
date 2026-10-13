// @ts-check
// file-views in the browser: a file drawn by what it is (renderFile), and the pieces it is made of for a host that
// draws on its own — a page, a PDF or a Word document drawn into its place (renderDocument), a markdown document's
// diagrams, finding in what is shown.
export { codeLanguage, codeLanguages, highlightCode, languageOfPath } from './code.js';
export { csvDelimiterOf, csvLines } from './csv.js';
export { queryPattern, stepMatch } from './find-text.js';
export { hasSource, kindOfPath } from './kind.js';
export { docLinkTarget, splitFrontMatter } from './links.js';
export { renderMarkdown } from './markdown.js';
export { drawDiagrams } from './view/diagrams.js';
export { hasDocumentView, renderDocument } from './view/documents.js';
export { domFinder } from './view/find-dom.js';
export { renderFile } from './view/render.js';

/**
 * @typedef {import('./kind.js').FileKind} FileKind
 * @typedef {import('./view/diagrams.js').DiagramLabels} DiagramLabels
 * @typedef {import('./view/documents.js').DocumentKind} DocumentKind
 * @typedef {import('./view/labels.js').DocumentLabels} DocumentLabels
 * @typedef {import('./view/documents.js').DocumentSource} DocumentSource
 * @typedef {import('./view/documents.js').DocumentView} DocumentView
 * @typedef {import('./view/find-dom.js').Finder} Finder
 * @typedef {import('./view/page.js').Heading} Heading
 * @typedef {import('./view/page.js').PageScroll} PageScroll
 * @typedef {import('./view/render.js').FileTarget} FileTarget
 * @typedef {import('./view/render.js').FileView} FileView
 * @typedef {import('./view/render.js').Host} Host
 * @typedef {import('./view/render.js').TextReply} TextReply
 * @typedef {import('./view/render.js').ViewOptions} ViewOptions
 */
