import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/' });
Object.assign(globalThis, { window, document: window.document, HTMLScriptElement: window.HTMLScriptElement });
// The libraries are the page's globals already: nothing is loaded, the view goes straight to the file.
Object.assign(window, { JSZip: {}, docx: { renderAsync: async () => {}, defaultOptions: { h: () => document.createElement('div') } } });
// The server has no file for this document.
globalThis.fetch = async () => new Response('', { status: 404 });
const { renderDocx } = await import('../src/view/docx.js');

const source = { url: 'http://localhost/doc.docx', assets: 'http://localhost/assets/', fit: /** @type {const} */ ('none') };

test('a Word document whose file did not come says so in the host’s words', async () => {
  const labels = { fileMissing: 'Файл документа недоступен', pageNotDrawn: (/** @type {string} */ reason) => reason };
  await assert.rejects(renderDocx(document.createElement('div'), { ...source, labels }), { message: 'Файл документа недоступен' });
});

test('without the host’s words it says so in English', async () => {
  await assert.rejects(renderDocx(document.createElement('div'), source), { message: 'the file did not come' });
});
