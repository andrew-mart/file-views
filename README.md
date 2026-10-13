# file-views

Show a file in a web page by what it is. One call draws it into an element of your page:

| File | Shown as |
|---|---|
| `.md`, `.markdown`, `.mdown` | a document — pictures and links read from its folder, headings named for links to them, code highlighted, mermaid diagrams drawn, the settings block at its head left out — or its source |
| `.csv`, `.tsv` | its text with numbered lines, columns coloured; the splitting sign — comma, semicolon, tab, bar — found by itself |
| `.txt`, `.log` | its text with numbered lines, web addresses as links |
| `.html`, `.htm` | the page in a sandboxed frame, what it loads beside it from its folder; its scripts off unless asked — or its source |
| `.pdf` | its pages, drawn by [pdf.js](https://mozilla.github.io/pdf.js/) as they come into view, their text selectable |
| `.docx` | its pages, drawn by [docx-preview](https://github.com/VolodymyrBaydalka/docxjs) and fitted to the width; its styles, links and HTML pieces checked |
| `.png`, `.jpg`, `.gif`, `.webp` | the picture, fitted to the width; a click shows it at its own size |
| anything else | its text with numbered lines, highlighted when [highlight.js](https://highlightjs.org/) knows its language |

A link to a line of a file — `App.cs:42`, `notes.md#L12` — marks that line and scrolls to it.

No framework, no bundler needed: plain ES modules and one stylesheet. The views run in your page, so whatever comes
from a file is kept from running there: markdown takes no raw HTML and passes DOMPurify, diagrams go in as pictures,
a Word document's styles and links are checked, HTML pages come in a sandbox.

## Install

```sh
npm install github:andrew-mart/file-views#v0.4.0
# the libraries the views load as they go are yours to install — those of the files you show; a server that only
# renders markdown (file-views/core) needs none of them
npm install pdfjs-dist@^6.3.289 docx-preview@^0.4.0 jszip@^3.10.2 mermaid@^11.17.2
```

Node 22 or newer for the server side.

## In the page

```js
import { renderFile } from 'file-views'; // a bundler; without one, the bundle — see below

const view = renderFile(
  document.querySelector('#preview'), // draws in it, in place of what it held; it scrolls the file
  { path: 'D:/dev/app/README.md', line: undefined, endLine: undefined },
  { view: 'document', scripts: 'off' }, // a document or a page drawn, or 'source'; a page's scripts
  host,
);
// later, before showing something else
view.dispose();
```

`view.document` is, for a page, a PDF or a Word document, what it can do once drawn — the same as `renderDocument`
gives, below; for other files, and for a document that could not be drawn, nothing.

`host` is what your server does for the views:

| Field | What it is |
|---|---|
| `text(path)` | the file's text: `Promise<{ ok: true, text } \| { ok: false, message }>`; `message` is shown in its place |
| `documentUrl(path, scripts)` | the address of a document's bytes — a page, a PDF, a Word document — under which what lies beside it resolves too; serve it with `folderFileAt` and `sandboxPolicy(scripts)` |
| `imageUrl(path)` | the address of a picture |
| `assets` | the address the library's assets are served at, ending in `/`; serve them with `assetFile` |
| `fileLink(link, target)` | optional: makes a document's link to another file open it your way; without it such a link only names the file |
| `decorate(root)` | optional: anything more you do to a drawn markdown document |
| `theme()` | optional: `'light'` or `'dark'`, for diagrams; light without it |

A page without a bundler takes the bundle — `dist/file-views.js`, with markdown-it, highlight.js and DOMPurify in it —
from the assets, with an import map:

```html
<link rel="stylesheet" href="/file-views/file-views.css">
<script type="importmap">{ "imports": { "file-views": "/file-views/file-views.js" } }</script>
```

### A document on its own

A page, a PDF or a Word document drawn where you want it, with what it can do once drawn:

```js
import { hasDocumentView, renderDocument } from 'file-views';

if (hasDocumentView(kind)) {
  const view = await renderDocument(container, {
    kind, // 'html', 'pdf' or 'docx'
    url, // its bytes — a page's address, what it loads beside it resolved under it
    assets, // the address of the library's assets
    scripts: 'off', // a page's scripts
    scroller: container, // what scrolls a PDF's pages; undefined — the window
    fit: 'width', // a Word document's pages fitted to the width, or 'none' — left to your zoom
  });
  view.reveal?.(); // a page is hidden until its look is laid: set its zoom, its dark look, its place first
}
```

Each gives what it can — none of the fields but `dispose` are there for every kind:

| Field | What it is |
|---|---|
| `dispose()` | lets go of what it holds — a PDF's pages, a page's listeners |
| `reveal()` | a page: shows it |
| `scroll` | a page: its window's scroll — `get`, `set`, `subscribe`; with its scripts on, by messages from the scroll bridge your server adds (`withScrollBridge`) |
| `headings()` | a page, a PDF's outline, a Word document's heading styles: `{ level, text, node }` for a table of contents |
| `offsetOf(node)` | a page: a heading's place in its window |
| `keys` | a page: its window, where keys pressed in it go |
| `finder` | finding in it, below |
| `setZoom(zoom)` | a page: its own zoom |
| `rezoom()` | a PDF: drawn again after your zoom of the container changed |
| `setDark(on)` | a page: a dark look laid over it — not an inversion, its pictures left as they are |

A page with scripts on lives in an origin of its own: it cannot be read, so it has no headings, no finder, no dark look.

`domFinder(root, { viewTop, scroller })` finds in a document drawn in your page — a markdown one, say. A finder's
`search(pattern)` lights every match and says how many, `show(index)` lights one as the current and brings it into
view, `firstInView()` is the one to start from, `clear()` lights none. Matches are lit with the CSS Custom Highlight
API, `::highlight(fv-find)` and `::highlight(fv-find-current)`, no element added. `queryPattern(query)` makes the
pattern — any case, ё as е, a space for any white space; `stepMatch(index, count, direction)` goes round them.

`drawDiagrams(doc, { assets, theme, labels })` draws a markdown document's mermaid blocks as pictures, or those drawn
again in another theme; `labels` — your words for a picture's alternative text and for a diagram not drawn.

The pieces are there too, for a page that draws on its own — and, needing no page, from `file-views/core` for a server
that renders markdown itself: `kindOfPath`, `hasSource`, `renderMarkdown`,
`docLinkTarget`, `splitFrontMatter`, `csvDelimiterOf`, `csvLines`, `codeLanguage`, `codeLanguages`,
`languageOfPath`, `highlightCode`, `queryPattern`, `stepMatch`, and a Word document's checks `keepsDocxSelector`,
`localUrlsOnly`, `keepsDocxLink`.

## On the server

```js
import { assetFile, decodeText, folderFileAt, sandboxPolicy, withScrollBridge } from 'file-views/server';
```

- `assetFile(path)` — the file of the library's assets at a path under their address: `file-views.js`,
  `file-views.css`, `mermaid.js`, `pdfjs/pdf.mjs`, `pdfjs/cmaps/78-H.bcmap`; none for a path that names none. Send
  `.wasm` as `application/wasm` — `mediaTypeOf(path)` knows it.
- `folderFileAt(folder, relative, { maxBytes })` — a file in a document's folder or below it, with its media type:
  nothing outside the folder — no `..` out, no absolute path, no link in the folder that leads out.
- `sandboxPolicy(scripts)` — the `Content-Security-Policy` to send a document from its folder with: a sandbox that
  runs no script — also when the page is opened in a tab of its own — or, asked to, runs them in an origin of their
  own, out of reach of your page and of what your server sends it.
- `decodeText(bytes)` — UTF-8, its mark at the head dropped; what is not UTF-8 as Windows-1251.
- `withScrollBridge(page)` — a page's bytes with a small script at their end that tells your page its scroll and
  takes one to go back to: send a page with scripts on so, when you keep its place. `scrollBridge` is that script.

A route for documents, say `/doc/<folder in base64url>/<path from it>`, so a page's relative addresses resolve in its
folder:

```js
const [token, ...steps] = url.pathname.slice('/doc/'.length).split('/');
const file = await folderFileAt(Buffer.from(token, 'base64url').toString('utf8'), steps.map(decodeURIComponent).join('/'), { maxBytes: 200 * 1024 * 1024 });
if (!file.ok) return response.writeHead(file.error === 'outside' ? 403 : 404).end();
response.writeHead(200, {
  'Content-Type': file.mediaType,
  'Content-Security-Policy': sandboxPolicy(url.searchParams.get('scripts') === '1' ? 'on' : 'off'),
  'X-Content-Type-Options': 'nosniff',
});
createReadStream(file.path).pipe(response);
```

## Looks

`styles/file-views.css` has the views' looks. Colours and fonts come from custom properties you set — on `:root` or on
the container — each with a light default: `--fv-text`, `--fv-muted`, `--fv-faint`, `--fv-border`, `--fv-accent`,
`--fv-danger`, `--fv-code-ground`, `--fv-page-ground`, `--fv-font`, `--fv-mono`, `--fv-csv-lightness`,
`--fv-csv-chroma`, and `--fv-hl-keyword`, `--fv-hl-string`, `--fv-hl-comment`, `--fv-hl-number`, `--fv-hl-title`,
`--fv-hl-type`, `--fv-hl-tag` for highlighting. `.fv-brackets` on the container lights up notes in square brackets
(`[ask Pete]`).

## Developing

```sh
npm test          # node:test with jsdom
npm run check     # tsc, strict, over the JSDoc
npm run build     # dist/file-views.js and types/ — both are committed: a GitHub install takes them as they are
```

## License

MIT. What the views load as they go comes under its own: pdf.js — Apache-2.0, docx-preview — Apache-2.0, JSZip —
MIT or GPLv3, mermaid — MIT; bundled: markdown-it — MIT, highlight.js — BSD-3-Clause, DOMPurify — Apache-2.0 or
MPL-2.0.
