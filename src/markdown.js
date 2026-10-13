// @ts-check
// Markdown to HTML for a document drawn in a page: markdown-it with no raw HTML — documents come from AI sessions and
// from the web, and HTML in them has nothing to run — but for an empty anchor, which tables of contents put before a
// heading; code highlighted by highlight.js, its language named; notes in square brackets wrapped, for the page to
// light them up; the settings block at the head left out.
import MarkdownIt from 'markdown-it';
import { guessCode, highlightCode, knowsLanguage, languageName } from './code.js';
import { splitFrontMatter } from './links.js';

/**
 * @typedef {import('markdown-it').StateCore} StateCore
 * @typedef {import('markdown-it').StateInline} StateInline
 * @typedef {import('markdown-it').Token} Token
 * @typedef {'explicit' | 'auto' | 'default'} LanguageSource — named in the block, guessed from its text, the
 *   document's default
 * @typedef {{ child: number, offset: number, edge: 'open' | 'close' }} BracketCut — before character offset of the
 *   child's text a note begins or ends
 */

/**
 * Below this certainty a block with no language named is not highlighted as the guessed one: measured on samples,
 * plain text, paths and logs score 0–2, real code from 3 (bash) to 11 (TypeScript).
 */
const autoMinRelevance = 3;

/**
 * A code block's highlighting: in the language named, when highlight.js knows it — plain text when it does not; with
 * none named, in the language highlight.js guesses from the text when it is sure enough — else notes and folder trees
 * would come out coloured as CSS — then in the document's default, then none. '' leaves the block to markdown-it,
 * plain.
 * @param {string | undefined} fallbackLanguage
 * @returns {(code: string, lang: string) => string}
 */
function highlighter(fallbackLanguage) {
  return (code, lang) => {
    const language = lang.trim().toLowerCase();
    try {
      if (language !== '') return knowsLanguage(language) ? codeBlock(highlightCode(code, language), language, 'explicit') : '';
      const guess = guessCode(code);
      if (guess.relevance >= autoMinRelevance && guess.language !== undefined) return codeBlock(guess.html, guess.language, 'auto');
      if (fallbackLanguage !== undefined && knowsLanguage(fallbackLanguage)) return codeBlock(highlightCode(code, fallbackLanguage), fallbackLanguage, 'default');
      return '';
    } catch {
      return ''; // a language highlight.js stumbles on leaves the block plain
    }
  };
}

/** @param {string} text */
function escapeAttribute(text) {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * The highlighted block whole: markdown-it takes a string starting with <pre as it is — so the block carries its
 * language's name and where it came from, for the page to show in its corner.
 * @param {string} highlighted — escaped by highlight.js
 * @param {string} language
 * @param {LanguageSource} source
 */
function codeBlock(highlighted, language, source) {
  const name = languageName(language);
  return `<pre data-lang="${escapeAttribute(name)}" data-lang-source="${source}"><code class="language-${escapeAttribute(language)}">${highlighted}</code></pre>`;
}

/**
 * An empty anchor <a id="…"></a>, or the old <a name="…"></a>: the name is the second group, the quote the first — the
 * closing one must match it. No quotes in the name: else the group would reach through a quote into the next attribute
 * and <a id="x" onclick="…"> would pass for an anchor.
 */
const anchorTag = /^<a\s+(?:id|name)\s*=\s*(["'])([^"']*)\1\s*>\s*<\/a\s*>/i;

/**
 * @param {StateInline} state
 * @param {boolean} silent
 */
function anchorRule(state, silent) {
  if (state.src.charCodeAt(state.pos) !== 0x3c) return false; // <
  const match = anchorTag.exec(state.src.slice(state.pos, state.posMax));
  const name = match?.[2]?.trim();
  if (match === null || name === undefined || name === '') return false;
  if (!silent) state.push('doc_anchor', 'a', 0).attrSet('id', name);
  state.pos += match[0].length;
  return true;
}

/**
 * A paragraph of anchors alone is no paragraph: an empty <p> would add space before the heading.
 * @param {StateCore} state
 */
function unwrapAnchorParagraphs(state) {
  state.tokens.forEach((token, index, tokens) => {
    const open = tokens[index - 1];
    const close = tokens[index + 1];
    if (token.type !== 'inline' || open?.type !== 'paragraph_open' || close?.type !== 'paragraph_close') return;
    const children = token.children ?? [];
    const anchorsOnly =
      children.some((child) => child.type === 'doc_anchor') &&
      children.every((child) => child.type === 'doc_anchor' || child.type === 'softbreak' || (child.type === 'text' && child.content.trim() === ''));
    if (!anchorsOnly) return;
    open.hidden = true;
    close.hidden = true;
  });
}

/**
 * Targets of links such as [Section](#section-x): tables of contents mark them with an empty anchor before the
 * heading. Exactly an empty anchor with one attribute passes; its name is escaped, it has no content.
 * @param {import('markdown-it').MarkdownIt} md
 */
function docAnchors(md) {
  md.inline.ruler.before('autolink', 'doc_anchor', anchorRule);
  md.core.ruler.after('inline', 'doc_anchor_paragraph', unwrapAnchorParagraphs);
  md.renderer.rules.doc_anchor = (tokens, index) => {
    const id = tokens[index]?.attrGet('id');
    return typeof id === 'string' && id !== '' ? `<a id="${md.utils.escapeHtml(id)}"></a>` : '';
  };
}

/**
 * A pair of brackets that is no note: nothing inside — [] or [ ] — or a task's mark [x] at the start of a list item.
 * @param {string | undefined} inner — the text between the brackets when both are in one piece of text; none when
 *   markup is inside, and then the pair cannot be empty
 * @param {boolean} atLineStart
 * @param {boolean} inListItem
 */
function skipsPair(inner, atLineStart, inListItem) {
  if (inner === undefined) return false;
  return inner.trim() === '' || (atLineStart && inListItem && /^[xX]$/.test(inner));
}

/**
 * Where a line's notes in square brackets begin and end: a pair is a [ and a ] at one level of markup — a bracket
 * opened inside bold closes only there, else the wrapping would tear the markup. Brackets are looked for in text only:
 * code, links and pictures are other tokens.
 * @param {readonly Token[]} children
 * @param {boolean} inListItem
 * @returns {BracketCut[]}
 */
function bracketCuts(children, inListItem) {
  /** @type {BracketCut[]} */
  const cuts = [];
  /** @type {{ child: number, offset: number, depth: number }[]} */
  const open = [];
  let depth = 0;
  children.forEach((token, child) => {
    if (token.nesting < 0) {
      depth--;
      // the markup closed: its unclosed brackets find no pair any more
      while ((open.at(-1)?.depth ?? -1) > depth) open.pop();
    }
    if (token.type === 'text') {
      const chars = [...token.content];
      chars.forEach((char, offset) => {
        if (char === '[') open.push({ child, offset, depth });
        if (char !== ']' || open.at(-1)?.depth !== depth) return;
        const start = open.pop();
        if (start === undefined) return;
        const inner = start.child === child ? chars.slice(start.offset + 1, offset).join('') : undefined;
        if (skipsPair(inner, start.child === 0 && start.offset === 0, inListItem)) return;
        cuts.push({ child: start.child, offset: start.offset, edge: 'open' }, { child, offset: offset + 1, edge: 'close' });
      });
    }
    if (token.nesting > 0) depth++;
  });
  return cuts;
}

/**
 * @param {StateCore} state
 * @param {string} content
 */
function textToken(state, content) {
  const token = new state.Token('text', '', 0);
  token.content = content;
  return token;
}

/**
 * A text token cut at the cuts: text, a note's start, text, its end…; at one place the end of a note comes before the
 * start of the next: [a][b].
 * @param {StateCore} state
 * @param {Token} token
 * @param {readonly BracketCut[]} cuts
 * @returns {Token[]}
 */
function cutText(state, token, cuts) {
  const ordered = [...cuts].sort((a, b) => a.offset - b.offset || (a.edge === b.edge ? 0 : a.edge === 'close' ? -1 : 1));
  const chars = [...token.content];
  /** @type {Token[]} */
  const parts = [];
  let from = 0;
  for (const cut of ordered) {
    if (cut.offset > from) parts.push(textToken(state, chars.slice(from, cut.offset).join('')));
    parts.push(new state.Token(cut.edge === 'open' ? 'md_bracket_open' : 'md_bracket_close', 'span', cut.edge === 'open' ? 1 : -1));
    from = cut.offset;
  }
  if (from < chars.length) parts.push(textToken(state, chars.slice(from).join('')));
  return parts;
}

/**
 * @param {StateCore} state
 */
function markBrackets(state) {
  state.tokens.forEach((token, index, tokens) => {
    if (token.type !== 'inline' || token.children === null) return;
    // a list item's line: list_item_open, paragraph_open, inline
    const cuts = bracketCuts(token.children, tokens[index - 2]?.type === 'list_item_open');
    if (cuts.length === 0) return;
    token.children = token.children.flatMap((child, at) => {
      const here = cuts.filter((cut) => cut.child === at);
      return here.length === 0 ? [child] : cutText(state, child, here);
    });
  });
}

/**
 * Notes in square brackets — [ask Pete] — wrapped always; the page lights them up when it chooses to (.md-bracket).
 * @param {import('markdown-it').MarkdownIt} md
 */
function bracketNotes(md) {
  md.core.ruler.before('text_join', 'md_bracket', markBrackets);
  md.renderer.rules.md_bracket_open = () => '<span class="md-bracket">';
  md.renderer.rules.md_bracket_close = () => '</span>';
}

/**
 * @param {string | undefined} fallbackLanguage
 */
function createRenderer(fallbackLanguage) {
  return new MarkdownIt({ html: false, linkify: true, breaks: false, highlight: highlighter(fallbackLanguage) }).use(docAnchors).use(bracketNotes);
}

/**
 * @param {string} source — the markdown
 * @param {{ fallbackLanguage?: string }} [options] fallbackLanguage: the language of code blocks that name none and
 *   whose language is not guessed
 * @returns {string} — HTML
 */
export function renderMarkdown(source, { fallbackLanguage } = {}) {
  return createRenderer(fallbackLanguage).render(splitFrontMatter(source).body);
}
