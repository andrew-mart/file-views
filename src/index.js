// @ts-check
// file-views in the browser: a file drawn by what it is (renderFile), and the pieces it is made of for a host that
// draws on its own.
export { codeLanguage, codeLanguages, highlightCode, languageOfPath } from './code.js';
export { csvDelimiterOf, csvLines } from './csv.js';
export { hasSource, kindOfPath } from './kind.js';
export { docLinkTarget, splitFrontMatter } from './links.js';
export { renderMarkdown } from './markdown.js';
export { renderFile } from './view/render.js';

/**
 * @typedef {import('./kind.js').FileKind} FileKind
 * @typedef {import('./view/render.js').FileTarget} FileTarget
 * @typedef {import('./view/render.js').FileView} FileView
 * @typedef {import('./view/render.js').Host} Host
 * @typedef {import('./view/render.js').TextReply} TextReply
 * @typedef {import('./view/render.js').ViewOptions} ViewOptions
 */
