import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// An element with an id is window[id] in a browser, and in jsdom too — from the window's prototype, not its own.
const { window } = new JSDOM('<!doctype html><html><head></head><body><a id="mermaid"></a></body></html>', { url: 'http://localhost/' });
Object.assign(globalThis, { window, document: window.document, HTMLScriptElement: window.HTMLScriptElement });
const { loadLibrary } = await import('../src/view/library.js');

test('an element with the library’s name is not taken for the library: its script is loaded', async () => {
  // A table of contents puts <a id="mermaid"></a> before its heading; the document's diagrams stayed text,
  // signed «[object HTMLAnchorElement]».
  const mermaid = { render() {} };
  const loading = loadLibrary('mermaid', 'http://localhost/mermaid.js');
  const script = document.getElementById('file-views-mermaid');
  assert.ok(script instanceof window.HTMLScriptElement, 'the library’s script is put in the page');
  Reflect.set(window, 'mermaid', mermaid);
  script.dispatchEvent(new window.Event('load'));

  assert.equal(await loading, mermaid);
});

test('a script that set no global gives undefined, not the element with its name', async () => {
  const anchor = document.createElement('a');
  anchor.id = 'JSZip';
  document.body.append(anchor);
  const loading = loadLibrary('JSZip', 'http://localhost/jszip.js');
  document.getElementById('file-views-JSZip')?.dispatchEvent(new window.Event('load'));

  assert.equal(await loading, undefined);
});
