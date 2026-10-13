import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepsDocxLink, keepsDocxSelector, localUrlsOnly } from '../src/docx-safety.js';

// A Word document's styles are its own: a rule stays only when each of its selectors starts at an element of the
// document — from there it reaches the document's parts and nothing of the host's page
test('keepsDocxSelector_Should_KeepRulesThatStartAtDocument', () => {
  for (const selector of [
    '.docx-wrapper',
    '.docx-wrapper > section.docx',
    'section.docx > article',
    '.docx p',
    '.docx table td',
    'p.docx_heading1',
    'span.docx_strong',
    'table.docx_tablegrid td',
    '.docx-num-1-0:before',
    '.docx_heading1, .docx-num-1-0::before',
  ]) {
    assert.equal(keepsDocxSelector(selector), true, selector);
  }
});

// A rule that starts anywhere else goes — a class inside :not(), :is(), :has() or an attribute is no element of the
// document, and one selector of a list starting elsewhere takes the whole rule with it
test('keepsDocxSelector_Should_DropRulesThatStartElsewhere', () => {
  for (const selector of [
    'body',
    '#doc-list > li',
    '#doc-list li[title^="C:\\\\Users"]',
    ':root',
    '*',
    '.z',
    'div:not(.docx) span',
    '#preview:has(.docx) .doc-title',
    ':is(.docx, #doc-list) li',
    'span.docx_strong, #doc-list > li',
    '[class=".docx"] p',
    '.docxfake p',
  ]) {
    assert.equal(keepsDocxSelector(selector), false, selector);
  }
});

// The document's pictures and fonts come as data: and blob: addresses; any other address would tell a server that
// the document is open — an address hidden in a variable too
test('localUrlsOnly_Should_AllowOnlyAddressesInsideDocument', () => {
  assert.deepEqual(
    ['red', 'url("data:font/woff2;base64,AAAA")', 'url(blob:app://host/1a2b)', 'url(https://evil.example/opened)', "url('//evil.example/x')", 'url(x.png)', 'image-set("https://evil.example/a.png" 1x)', 'url(data:x) , url(https://evil.example)', 'image-set(var(--x) 1x)'].map(localUrlsOnly),
    [true, true, true, false, false, false, false, false, false],
  );
});

// A link in the document keeps its address when it goes to a place in the document — a # with a name after it — or to
// a page on the web or a mail, in any case and with spaces around; a script, a file, another scheme, a share — or an
// address that only looks like a web address, which the browser would take for a path on the host's page — loses it
test('keepsDocxLink_Should_KeepPlacesWebAndMailOnly', () => {
  for (const href of ['#_Toc123', ' #_Toc7 ', 'https://example.com/terms', 'HTTP://example.com', 'mailto:legal@example.com', '  https://example.com  ']) {
    assert.equal(keepsDocxLink(href), true, href);
  }
  for (const href of ['#', "javascript:alert('x')", ' JavaScript:alert(1)', 'vbscript:msgbox', 'data:text/html,<script>1</script>', 'file:///C:/Windows/system32/calc.exe', 'ms-settings:', '\\\\evil.example\\share\\x.pdf', '', '\u00A0https://example.com', '\u200Bhttps://example.com', undefined]) {
    assert.equal(keepsDocxLink(href), false, String(href));
  }
});
