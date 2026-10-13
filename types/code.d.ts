/**
 * The language highlight.js knows by a name or an alias: cs and C# → csharp; none when unknown.
 * @param {string} name
 * @returns {string | undefined}
 */
export function codeLanguage(name: string): string | undefined;
/**
 * The languages code can be highlighted in, to choose a document's default from.
 * @returns {{ id: string, name: string }[]}
 */
export function codeLanguages(): {
    id: string;
    name: string;
}[];
/**
 * A file's language by its name: Makefile, App.cs, main.tsx; none when highlight.js knows none.
 * @param {string} path
 * @returns {string | undefined}
 */
export function languageOfPath(path: string): string | undefined;
/**
 * Code highlighted in a language highlight.js knows; HTML in it escaped by highlight.js.
 * @param {string} code
 * @param {string} language
 * @returns {string} — HTML
 */
export function highlightCode(code: string, language: string): string;
/**
 * highlight.js's guess at the language of code that names none.
 * @param {string} code
 * @returns {{ language: string | undefined, relevance: number, html: string }}
 */
export function guessCode(code: string): {
    language: string | undefined;
    relevance: number;
    html: string;
};
/**
 * The name highlight.js gives a language: TypeScript for ts.
 * @param {string} language
 */
export function languageName(language: string): string;
/**
 * Whether highlight.js knows the language.
 * @param {string} language
 */
export function knowsLanguage(language: string): boolean;
