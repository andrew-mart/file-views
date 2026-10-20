import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/' });
Object.assign(globalThis, {
  window,
  document: window.document,
  DOMParser: window.DOMParser,
  XMLSerializer: window.XMLSerializer,
  SVGSVGElement: window.SVGSVGElement,
  HTMLElement: window.HTMLElement,
  HTMLImageElement: window.HTMLImageElement,
  HTMLScriptElement: window.HTMLScriptElement,
});
const { drawDiagrams } = await import('../src/view/diagrams.js');

/**
 * mermaid that draws every diagram as this SVG.
 * @param {string} svg
 */
function mermaidDrawing(svg) {
  Reflect.set(window, 'mermaid', { initialize() {}, render: async () => ({ svg }) });
}

/** @param {string} source */
function documentWith(source) {
  const doc = window.document.createElement('div');
  doc.innerHTML = '<pre><code class="language-mermaid"></code></pre>';
  const code = doc.querySelector('code');
  if (code !== null) code.textContent = source;
  return doc;
}

/** @param {HTMLElement} doc */
function pictureSvg(doc) {
  const src = doc.querySelector('.fv-diagram > img')?.getAttribute('src') ?? '';
  return new window.DOMParser().parseFromString(decodeURIComponent(src.replace(/^data:image\/svg\+xml;charset=utf-8,/, '')), 'image/svg+xml');
}

test('a diagram whose labels break lines and keep spaces is drawn as a picture a browser shows: its SVG is XML', async () => {
  // mermaid gives its SVG as HTML: a label's line break an unclosed <br>, its space &nbsp; — a picture read as XML
  // stopped at them and showed broken. (mermaid also puts xmlns on the label's div; left out here: jsdom writes it twice)
  mermaidDrawing('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><foreignObject width="120" height="40"><div><span>строка 1<br>строка 2&nbsp;!</span></div></foreignObject></svg>');
  const doc = documentWith('flowchart TD\n  A["строка 1<br>строка 2&nbsp;!"]');

  await drawDiagrams(doc, { assets: 'http://localhost/assets/', theme: 'light' });

  const svg = pictureSvg(doc);
  assert.equal(svg.documentElement.nodeName, 'svg');
  assert.equal(svg.getElementsByTagName('br').length, 1);
  assert.equal(svg.documentElement.textContent, 'строка 1строка 2\u00a0!');
});
