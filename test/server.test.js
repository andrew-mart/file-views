import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assetFile, decodeText, folderFileAt, sandboxPolicy, withScrollBridge } from '../src/server/index.js';

const limits = { maxBytes: 1000 };

// A page drawn in a host's page loads what lies beside it — its styles, pictures, scripts — each by the type it is
test('folderFileAt_Should_GiveFileBesideDocumentWithItsType', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fv-page-'));
  await mkdir(join(dir, 'assets'));
  await writeFile(join(dir, 'page.html'), '<p>hi</p>');
  await writeFile(join(dir, 'assets', 'site.css'), 'p {}');
  await writeFile(join(dir, 'assets', 'data.bin'), Buffer.from([1, 2]));
  await writeFile(join(dir, 'big.pdf'), Buffer.alloc(1001));

  const outcomes = await Promise.all(['page.html', 'assets/site.css', 'assets/data.bin', 'big.pdf', 'missing.css'].map((relative) => folderFileAt(dir, relative, limits)));

  assert.deepEqual(outcomes.map((outcome) => (outcome.ok ? { mediaType: outcome.mediaType, path: outcome.path } : outcome)), [
    { mediaType: 'text/html', path: join(dir, 'page.html') },
    { mediaType: 'text/css', path: join(dir, 'assets', 'site.css') },
    { mediaType: 'application/octet-stream', path: join(dir, 'assets', 'data.bin') },
    { ok: false, error: 'too-large' },
    { ok: false, error: 'not-found' },
  ]);
});

// Nothing outside the document's folder is given: not by .. steps, not by an absolute path, not through a link in it
// that leads out
test('folderFileAt_Should_RefuseWhatLiesOutsideFolder', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fv-fence-'));
  const dir = join(root, 'site');
  const secret = join(root, 'secret');
  await mkdir(dir);
  await mkdir(secret);
  await writeFile(join(secret, 'key.txt'), 'secret');
  await symlink(secret, join(dir, 'way-out'), 'junction');

  const outcomes = await Promise.all(['../secret/key.txt', join(secret, 'key.txt'), 'way-out/key.txt'].map((relative) => folderFileAt(dir, relative, limits)));

  assert.deepEqual(outcomes, [
    { ok: false, error: 'outside' },
    { ok: false, error: 'outside' },
    { ok: false, error: 'outside' },
  ]);
});

// A page comes in a sandbox that runs no script; asked to run them, in an origin of its own
test('sandboxPolicy_Should_RunScriptsOnlyInOriginOfTheirOwn', () => {
  assert.deepEqual([sandboxPolicy('off'), sandboxPolicy('on')], [
    'sandbox allow-same-origin allow-popups allow-popups-to-escape-sandbox',
    'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox',
  ]);
});

// Old Russian text files are in Windows-1251, not UTF-8: read as such, they show their words; a UTF-8 mark at the head
// is no part of the text
test('decodeText_Should_ReadWindows1251_When_TextIsNotUtf8_And_DropUtf8Mark', () => {
  assert.deepEqual(
    [decodeText(Buffer.from([0xcf, 0xf0, 0xe8, 0xe2, 0xe5, 0xf2])), decodeText(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('# Привет')]))],
    ['Привет', '# Привет'],
  );
});

// The host serves the library's files under one address: the libraries the views load and pdf.js's folders are found;
// a path that names nothing, or leads above the folders, finds nothing
test('assetFile_Should_FindLibraryFiles_And_NothingAboveTheirFolders', () => {
  const found = ['mermaid.js', 'jszip.js', 'docx-preview.js', 'pdfjs/pdf.mjs', 'pdfjs/pdf.worker.mjs', 'pdfjs/cmaps/78-H.bcmap', 'pdfjs/wasm/openjpeg.wasm', 'file-views.css'].map((path) => {
    const file = assetFile(path);
    return file !== undefined && existsSync(file);
  });

  assert.deepEqual({ found, missing: ['nope.js', 'pdfjs/cmaps/../../package.json', 'pdfjs/'].map(assetFile) }, { found: [true, true, true, true, true, true, true, true], missing: [undefined, undefined, undefined] });
});

// A page with scripts reports its scroll by a bridge added at the end of its file: the page's bytes stay as they were
test('withScrollBridge_Should_AddBridgeAfterPageUntouched', () => {
  const page = new TextEncoder().encode('<!doctype html><p>hi</p>');

  const bridged = new TextDecoder().decode(withScrollBridge(page));

  assert.deepEqual({ head: bridged.startsWith('<!doctype html><p>hi</p><script>'), reports: bridged.includes("fileViews: 'scroll'"), goesBack: bridged.includes("e.data.fileViews !== 'scroll-to'") }, { head: true, reports: true, goesBack: true });
});
