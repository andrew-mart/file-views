// The views bundled for a page without a bundler: dist/file-views.js, one ES module with markdown-it, highlight.js and
// DOMPurify in it. What the views load as they go — pdf.js, mermaid, docx-preview — stays out: the host serves it as
// the library's assets (server: assetFile).
import { build } from 'esbuild';

await build({
  entryPoints: [new URL('../src/index.js', import.meta.url).pathname.replace(/^\/([a-z]:)/i, '$1')],
  outfile: new URL('../dist/file-views.js', import.meta.url).pathname.replace(/^\/([a-z]:)/i, '$1'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'eof',
});
