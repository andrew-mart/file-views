/**
 * @param {string} filePath — the document's absolute path
 * @param {string} href — a link or a picture's address in it
 * @returns {DocLink}
 */
export function docLinkTarget(filePath: string, href: string): DocLink;
/**
 * The settings block (YAML between --- lines) at the very head of a markdown document, and the text after it.
 * @param {string} text
 * @returns {{ frontMatter: string | undefined, body: string }}
 */
export function splitFrontMatter(text: string): {
    frontMatter: string | undefined;
    body: string;
};
/**
 * — file: a path next to the document or above it, with the line a #L42 names; anchor: a place in the document
 * itself; web: an address with a scheme
 */
export type DocLink = {
    kind: "file";
    path: string;
    line: number | undefined;
} | {
    kind: "anchor";
    id: string;
} | {
    kind: "web";
};
