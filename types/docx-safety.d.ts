/**
 * Whether a rule of the document's styles stays: each selector of its list starts at an element of the document, from
 * where it goes down to the document's parts and on to their next siblings, never up to the viewer's page.
 * @param {string} selector — one, or a list with commas
 * @returns {boolean}
 */
export function keepsDocxSelector(selector: string): boolean;
/**
 * Whether a property's value names only addresses inside the document: its pictures and fonts come as data: and blob:
 * addresses; any other would tell a server the document is open. A variable inside a function that takes an address
 * as a string is an unknown address.
 * @param {string} value
 * @returns {boolean}
 */
export function localUrlsOnly(value: string): boolean;
/**
 * Whether a link of the document keeps its address: a place in the document — how Word marks its table of
 * contents — a page on the web, a mail. The scheme is read as the browser reads it: an address that looks like
 * https: but starts with an invisible sign is, to the browser, a path on the viewer's own page.
 * @param {string | undefined} href — the attribute as it is
 * @returns {boolean}
 */
export function keepsDocxLink(href: string | undefined): boolean;
