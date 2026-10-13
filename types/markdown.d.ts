/**
 * @param {string} source — the markdown
 * @param {{ fallbackLanguage?: string }} [options] fallbackLanguage: the language of code blocks that name none and
 *   whose language is not guessed
 * @returns {string} — HTML
 */
export function renderMarkdown(source: string, { fallbackLanguage }?: {
    fallbackLanguage?: string;
}): string;
export type StateCore = import("markdown-it").StateCore;
export type StateInline = import("markdown-it").StateInline;
export type Token = import("markdown-it").Token;
/**
 * — named in the block, guessed from its text, the
 * document's default
 */
export type LanguageSource = "explicit" | "auto" | "default";
/**
 * — before character offset of the
 * child's text a note begins or ends
 */
export type BracketCut = {
    child: number;
    offset: number;
    edge: "open" | "close";
};
