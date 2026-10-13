import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codeLanguage, languageOfPath } from '../src/code.js';
import { renderMarkdown } from '../src/markdown.js';

// Raw HTML in a document runs nothing: it shows as text
test('renderMarkdown_Should_ShowRawHtmlAsText', () => {
  for (const source of ['<a href="javascript:alert(1)">x</a>', '<a id="x" onclick="alert(1)"></a>', '<a id="x">text inside</a>', '<script>alert(1)</script>', '<img src="x" onerror="alert(1)">']) {
    const html = renderMarkdown(`${source}\n`);
    assert.match(html, /&lt;/, source);
    assert.doesNotMatch(html, /<a |<script|<img/, source);
  }
});

// Tables of contents mark a link's target with an empty anchor before the heading: it becomes an anchor — the old
// <a name> too — its name escaped, and a line of it alone leaves no empty paragraph
test('renderMarkdown_Should_MakeEmptyAnchorsAnchors', () => {
  assert.deepEqual(
    [
      renderMarkdown('<a id="section-media"></a>\n\n## Media\n'),
      renderMarkdown('<a name="old-style"></a>\n'),
      renderMarkdown('Text <a id="z"></a> on.\n'),
      renderMarkdown('<a id="a&b<c>"></a>\n'),
      renderMarkdown(`<a id='a"b'></a>\n`),
    ],
    [
      '<a id="section-media"></a>\n<h2>Media</h2>\n',
      '<a id="old-style"></a>',
      '<p>Text <a id="z"></a> on.</p>\n',
      '<a id="a&amp;b&lt;c&gt;"></a>',
      '<p>&lt;a id=\'a&quot;b\'&gt;&lt;/a&gt;</p>\n',
    ],
  );
});

// A note in square brackets is wrapped with its brackets, for the page to light up; empty brackets, a task's mark at
// the start of a list item, code, links, escaped and unclosed brackets are no notes
test('renderMarkdown_Should_WrapNotesInSquareBrackets', () => {
  assert.deepEqual(
    [
      renderMarkdown('Due [ask Pete] — March.\n'),
      renderMarkdown('Tags [urgent][now].\n'),
      renderMarkdown('Sum [agree [with legal] by Friday].\n'),
      renderMarkdown('See [see **part 2**, `code`] below.\n'),
    ],
    [
      '<p>Due <span class="md-bracket">[ask Pete]</span> — March.</p>\n',
      '<p>Tags <span class="md-bracket">[urgent]</span><span class="md-bracket">[now]</span>.</p>\n',
      '<p>Sum <span class="md-bracket">[agree <span class="md-bracket">[with legal]</span> by Friday]</span>.</p>\n',
      '<p>See <span class="md-bracket">[see <strong>part 2</strong>, <code>code</code>]</span> below.</p>\n',
    ],
  );
  for (const source of ['- [x] done\n- [ ] not yet\n\nEmpty: [] and [  ].\n', 'Array `items[0]` is empty.\n', 'Read [the docs](https://example.com/docs).\n', 'Literally \\[no note\\].\n', 'An unclosed [bracket.\n']) {
    assert.doesNotMatch(renderMarkdown(source), /md-bracket/, source);
  }
});

// Code is highlighted in the language named, guessed when none is named and the guess is sure — plain text is left
// plain — and the block names its language and where it came from; HTML in code is escaped
test('renderMarkdown_Should_HighlightCodeAndNameItsLanguage', () => {
  const typed = 'export async function load(id: number): Promise<string> {\n  return fetch(`/api/docs/${id}`).then((r) => r.text());\n}';
  assert.match(renderMarkdown('```ts\nconst answer = 42;\n```'), /^<pre data-lang="TypeScript" data-lang-source="explicit"><code class="language-ts"><span class="hljs-keyword">const<\/span> answer = <span class="hljs-number">42<\/span>;/);
  assert.match(renderMarkdown('```\n' + typed + '\n```'), /^<pre data-lang="TypeScript" data-lang-source="auto">/);
  assert.match(renderMarkdown('```\nplain words\n```', { fallbackLanguage: 'bash' }), /^<pre data-lang="Bash" data-lang-source="default">/);
  for (const source of ['```\nThis is just a note about the task, not code.\n```', '```\nD:/dev/app/tasks/todo.md\n```', '```no-such-language\nexport async function load(id: number) {}\n```']) {
    assert.doesNotMatch(renderMarkdown(source), /hljs-|data-lang/, source);
  }
  assert.doesNotMatch(renderMarkdown('```html\n<script>alert(1)</script>\n```'), /<script>/);
});

// The settings block at the head of a document is no part of its text
test('renderMarkdown_Should_LeaveSettingsBlockOut', () => {
  assert.equal(renderMarkdown('---\ntitle: Notes\n---\n# Notes\n'), '<h1>Notes</h1>\n');
});

// A language is found by its name or an alias, a file's by its name
test('codeLanguage_Should_FindLanguageByNameOrAlias_And_FileByItsName', () => {
  assert.deepEqual(
    { byName: ['cs', 'C#', 'ts', 'no-such'].map(codeLanguage), byFile: ['D:/a/App.cs', '/a/main.tsx', 'D:\\a\\Makefile', '/a/app.csproj', '/a/notes', '/a/x.unknown'].map(languageOfPath) },
    { byName: ['csharp', 'csharp', 'typescript', undefined], byFile: ['csharp', 'typescript', 'makefile', 'xml', undefined, undefined] },
  );
});
