// @ts-check
// Code highlighted by highlight.js — its common languages — and the language of a file told by its name.
import hljs from 'highlight.js/lib/common';

/** Extensions highlight.js does not take for a name of a language it knows. */
/** @type {ReadonlyMap<string, string>} */
const languageByExtension = new Map([
  ['mjs', 'javascript'],
  ['cjs', 'javascript'],
  ['jsx', 'javascript'],
  ['tsx', 'typescript'],
  ['jsonl', 'json'],
  ['html', 'xml'],
  ['htm', 'xml'],
  ['svg', 'xml'],
  ['csproj', 'xml'],
  ['props', 'xml'],
  ['targets', 'xml'],
  ['toml', 'ini'],
]);

/**
 * The language highlight.js knows by a name or an alias: cs and C# → csharp; none when unknown.
 * @param {string} name
 * @returns {string | undefined}
 */
export function codeLanguage(name) {
  const key = name.trim().toLowerCase();
  if (key === '') return undefined;
  const language = hljs.getLanguage(key);
  if (language === undefined) return undefined;
  return hljs.listLanguages().find((id) => hljs.getLanguage(id) === language);
}

/**
 * The languages code can be highlighted in, to choose a document's default from.
 * @returns {{ id: string, name: string }[]}
 */
export function codeLanguages() {
  return hljs
    .listLanguages()
    .map((id) => ({ id, name: hljs.getLanguage(id)?.name ?? id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A file's language by its name: Makefile, App.cs, main.tsx; none when highlight.js knows none.
 * @param {string} path
 * @returns {string | undefined}
 */
export function languageOfPath(path) {
  const name = (path.split(/[\\/]/).pop() ?? '').toLowerCase();
  if (name === 'makefile') return 'makefile';
  const extension = /\.([^.]+)$/.exec(name)?.[1];
  if (extension === undefined) return undefined;
  return languageByExtension.get(extension) ?? codeLanguage(extension);
}

/**
 * Code highlighted in a language highlight.js knows; HTML in it escaped by highlight.js.
 * @param {string} code
 * @param {string} language
 * @returns {string} — HTML
 */
export function highlightCode(code, language) {
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

/**
 * highlight.js's guess at the language of code that names none.
 * @param {string} code
 * @returns {{ language: string | undefined, relevance: number, html: string }}
 */
export function guessCode(code) {
  const guess = hljs.highlightAuto(code);
  return { language: guess.language, relevance: guess.relevance, html: guess.value };
}

/**
 * The name highlight.js gives a language: TypeScript for ts.
 * @param {string} language
 */
export function languageName(language) {
  return hljs.getLanguage(language)?.name ?? language;
}

/**
 * Whether highlight.js knows the language.
 * @param {string} language
 */
export function knowsLanguage(language) {
  return hljs.getLanguage(language) !== undefined;
}
