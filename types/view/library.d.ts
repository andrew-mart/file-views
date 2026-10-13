/**
 * The library, loaded once for the page by a <script> tag; a load that failed is tried again the next time.
 * @param {string} name — the global it sets
 * @param {string} url — its script
 * @returns {Promise<unknown>}
 */
export function loadLibrary(name: string, url: string): Promise<unknown>;
