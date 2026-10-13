import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// DOMPurify binds to window on import: the DOM is set up before the views load.
const { window } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
Object.assign(globalThis, { window, document: window.document, Element: window.Element, HTMLAnchorElement: window.HTMLAnchorElement, HTMLScriptElement: window.HTMLScriptElement });
const { renderFile } = await import('../src/view/render.js');

/** @typedef {import('../src/view/render.js').Host} Host */

/**
 * A host whose server holds these texts; it records what is asked of it.
 * @param {Record<string, string>} texts
 */
function hostWith(texts) {
  /** @type {string[]} */
  const asked = [];
  /** @type {Host} */
  const host = {
    text: async (path) => {
      asked.push(path);
      const text = texts[path];
      return text === undefined ? { ok: false, message: 'No such file here.' } : { ok: true, text };
    },
    documentUrl: (path, scripts) => `/doc?path=${encodeURIComponent(path)}${scripts === 'on' ? '&scripts=1' : ''}`,
    imageUrl: (path) => `/image?path=${encodeURIComponent(path)}`,
    assets: 'http://localhost/assets/',
    fileLink: (link, target) => {
      link.setAttribute('data-path', target.path);
      if (target.line !== undefined) link.setAttribute('data-line', String(target.line));
    },
  };
  return { host, asked };
}

/**
 * @param {string} path
 * @param {Host} host
 * @param {{ line?: number, view?: 'document' | 'source', scripts?: 'on' | 'off' }} [options]
 */
function drawn(path, host, { line, view = 'document', scripts = 'off' } = {}) {
  const container = window.document.createElement('div');
  window.document.body.append(container);
  const shown = renderFile(container, { path, line, endLine: undefined }, { view, scripts }, host);
  return { container, shown };
}
const settled = () => new Promise((done) => setTimeout(done, 10));

// A markdown document is drawn as a document: its pictures and links read from where it lies — a picture shown from
// the file next to it, a linked file opened the host's way — a page on the web in a new tab; the settings block at its
// head is not shown
test('renderFile_Should_DrawMarkdownAsDocument_WithLinksReadFromItsFolder', async () => {
  const { host } = hostWith({ 'D:/dev/x/docs/README.md': '---\ntitle: Guide\n---\n# Guide\n\n![shot](img/shot.png)\n\nSee [the app](../src/App.cs#L12) and [the site](https://example.com).\n' });

  const { container } = drawn('D:/dev/x/docs/README.md', host);
  await settled();

  const doc = container.querySelector('.fv-markdown');
  const links = [...(doc?.querySelectorAll('a') ?? [])].map((link) => ({ text: link.textContent, path: link.getAttribute('data-path'), line: link.getAttribute('data-line'), target: link.getAttribute('target') }));
  assert.deepEqual(
    { heading: doc?.querySelector('h1')?.textContent, settings: doc?.textContent?.includes('title: Guide'), picture: doc?.querySelector('img')?.getAttribute('src'), links },
    {
      heading: 'Guide',
      settings: false,
      picture: '/image?path=D%3A%2Fdev%2Fx%2Fdocs%2Fimg%2Fshot.png',
      links: [
        { text: 'the app', path: 'D:/dev/x/src/App.cs', line: '12', target: null },
        { text: 'the site', path: null, line: null, target: '_blank' },
      ],
    },
  );
});

// A link to a heading of the document goes to it in the view; the page's own address stays as it is
test('renderFile_Should_GoToHeading_When_DocumentLinksToIt', async () => {
  const { host } = hostWith({ 'D:/dev/x/guide.md': '[Install](#install-on-windows)\n\n## Install on Windows\n\n## Install on Windows\n' });
  const { container } = drawn('D:/dev/x/guide.md', host);
  await settled();
  /** @type {string[]} */
  const reached = [];
  for (const heading of container.querySelectorAll('h2')) heading.scrollIntoView = () => reached.push(heading.id);
  const link = container.querySelector('.fv-markdown a');
  assert.ok(link);

  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(click);

  assert.deepEqual({ reached, stays: click.defaultPrevented, ids: [...container.querySelectorAll('h2')].map((heading) => heading.id) }, { reached: ['install-on-windows'], stays: true, ids: ['install-on-windows', 'install-on-windows-1'] });
});

// A document's text is its source, the lines a link names marked
test('renderFile_Should_ShowSourceWithLinkedLineMarked', async () => {
  const { host } = hostWith({ 'D:/dev/x/notes.md': '# Notes\n\nfirst\n\nsecond\n' });

  const { container } = drawn('D:/dev/x/notes.md', host, { line: 5, view: 'source' });
  await settled();

  assert.deepEqual(
    { code: container.querySelector('.fv-code code')?.textContent, gutter: container.querySelector('.fv-gutter')?.textContent, mark: container.querySelector('.fv-line-mark')?.getAttribute('style') },
    { code: '# Notes\n\nfirst\n\nsecond', gutter: '1\n2\n3\n4\n5', mark: 'top: 90px; height: 20px;' },
  );
});

// A table's columns are told apart by colour; addresses in a text file are links to open in a new tab, the rest of it
// text as it is
test('renderFile_Should_ColourTableColumns_And_LinkAddressesInText', async () => {
  const { host } = hostWith({ 'D:/dev/x/rates.csv': 'name;price\nmilk;1,20\n', 'D:/dev/x/notes.txt': 'docs at https://example.com/guide, and <b>no markup</b>\n' });

  const table = drawn('D:/dev/x/rates.csv', host);
  const notes = drawn('D:/dev/x/notes.txt', host);
  await settled();

  const text = notes.container.querySelector('.fv-code code');
  assert.deepEqual(
    {
      cells: [...table.container.querySelectorAll('.fv-code code span')].map((span) => [span.className, span.textContent]),
      links: [...(text?.querySelectorAll('a') ?? [])].map((link) => [link.getAttribute('href'), link.getAttribute('target')]),
      text: text?.textContent,
    },
    {
      cells: [['fv-csv-c0', 'name'], ['fv-csv-c1', 'price'], ['fv-csv-c0', 'milk'], ['fv-csv-c1', '1,20']],
      links: [['https://example.com/guide', '_blank']],
      text: 'docs at https://example.com/guide, and <b>no markup</b>',
    },
  );
});

// A page is drawn in a frame from the host's address for it, in a sandbox that runs none of its scripts; asked to run
// them, in an origin of their own
test('renderFile_Should_DrawPageInSandboxedFrame_And_RunScriptsOnlyWhenAsked', () => {
  const { host, asked } = hostWith({});
  const frame = (/** @type {'on' | 'off'} */ scripts) => {
    const found = drawn('D:/dev/x/site/page.html', host, { scripts }).container.querySelector('iframe');
    return { sandbox: found?.getAttribute('sandbox'), src: found?.getAttribute('src') };
  };

  assert.deepEqual({ quiet: frame('off'), running: frame('on'), asked }, {
    quiet: { sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox', src: '/doc?path=D%3A%2Fdev%2Fx%2Fsite%2Fpage.html' },
    running: { sandbox: 'allow-scripts allow-popups allow-popups-to-escape-sandbox', src: '/doc?path=D%3A%2Fdev%2Fx%2Fsite%2Fpage.html&scripts=1' },
    asked: [],
  });
});

// A PDF and a Word document are drawn as their pages; no text is asked for them
test('renderFile_Should_DrawPdfAndWordAsPages_WithoutAskingForText', async () => {
  const { host, asked } = hostWith({});

  const pdf = drawn('D:/dev/x/spec.pdf', host);
  const word = drawn('D:/dev/x/brief.docx', host);
  await settled();

  assert.deepEqual(
    { pdf: [pdf.shown.kind, pdf.container.querySelector(':scope > .fv-document') !== null], word: [word.shown.kind, word.container.querySelector(':scope > .fv-document') !== null], asked },
    { pdf: ['pdf', true], word: ['docx', true], asked: [] },
  );
});

// A picture comes from the host's address for it; one that does not load leaves a word instead
test('renderFile_Should_ShowPicture_And_SayWhenItDoesNotLoad', () => {
  const { host } = hostWith({});
  const { container } = drawn('D:/dev/x/shot.png', host);
  const picture = container.querySelector('img');
  const source = picture?.getAttribute('src');

  picture?.dispatchEvent(new window.Event('error'));

  assert.deepEqual({ source, shown: [...container.children].map((child) => child.className) }, { source: '/image?path=D%3A%2Fdev%2Fx%2Fshot.png', shown: ['fv-message'] });
});

// A file whose text does not come says so in the host's words; a view let go shows nothing that comes later
test('renderFile_Should_SayWhyTextIsNotThere_And_ShowNothingOnceLetGo', async () => {
  const { host } = hostWith({ 'D:/dev/x/late.md': '# Late\n' });
  const missing = drawn('D:/dev/x/gone.md', host);
  const late = drawn('D:/dev/x/late.md', host);

  late.shown.dispose();
  await settled();

  assert.deepEqual({ missing: missing.container.textContent, late: late.container.querySelector('.fv-markdown') }, { missing: 'No such file here.', late: null });
});
