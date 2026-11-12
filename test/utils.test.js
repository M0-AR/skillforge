import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractRelativeLinks,
  isManualOnly,
  isValidSkillId,
  parseFrontmatter,
  removeDescription,
  setDescription,
  slugify,
} from '../src/utils.js';

test('parseFrontmatter reads simple values', () => {
  const text = '---\nname: release-notes\ndescription: Write release notes\n---\n\n# Body\n';
  const parsed = parseFrontmatter(text);
  assert.equal(parsed.data.name, 'release-notes');
  assert.equal(parsed.data.description, 'Write release notes');
  assert.match(parsed.body, /# Body/);
});

test('parseFrontmatter reads nested metadata and block descriptions', () => {
  const text = `---
name: audit
description: >
  Check a codebase
  for security issues.
metadata:
  opencode/autoinvoke: false
---
Body`;
  const parsed = parseFrontmatter(text);
  assert.equal(parsed.data.description, 'Check a codebase\nfor security issues.');
  assert.equal(parsed.data.metadata['opencode/autoinvoke'], 'false');
  assert.equal(isManualOnly(parsed.data), true);
});

test('isManualOnly respects description and v2 flags', () => {
  assert.equal(isManualOnly({}), true);
  assert.equal(isManualOnly({ description: 'x' }), false);
  assert.equal(isManualOnly({ description: 'x', metadata: { 'opencode/autoinvoke': 'false' } }), true);
  assert.equal(isManualOnly({ description: 'x', 'disable-model-invocation': 'true' }), true);
});

test('removeDescription preserves other frontmatter', () => {
  const text = '---\nname: demo\ndescription: Remove me\nmetadata:\n  opencode/autoinvoke: false\n---\n\nBody';
  const result = removeDescription(text);
  assert.doesNotMatch(result, /description:/);
  assert.match(result, /name: demo/);
  assert.match(result, /opencode\/autoinvoke: false/);
});

test('removeDescription removes block descriptions', () => {
  const text = '---\nname: demo\ndescription: >\n  line one\n  line two\nlicense: MIT\n---\n\nBody';
  const result = removeDescription(text);
  assert.doesNotMatch(result, /description:/);
  assert.doesNotMatch(result, /line one/);
  assert.match(result, /license: MIT/);
});

test('setDescription replaces or inserts a description', () => {
  const existing = '---\nname: demo\ndescription: Old\n---\nBody';
  assert.match(setDescription(existing, 'New'), /description: New/);
  const missing = '---\nname: demo\n---\nBody';
  assert.match(setDescription(missing, 'Added'), /description: Added/);
});

test('extractRelativeLinks ignores code fences and remote links', () => {
  const markdown = `
[guide](references/guide.md)
![logo](assets/logo.png)
[site](https://example.com)
[anchor](#section)
\`\`\`md
[inside](not-a-link.md)
\`\`\`
`;
  assert.deepEqual(extractRelativeLinks(markdown), ['references/guide.md', 'assets/logo.png']);
});

test('slugify and skill IDs are portable', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world');
  assert.equal(isValidSkillId('hello-world'), true);
  assert.equal(isValidSkillId('HelloWorld'), false);
  assert.equal(isValidSkillId('-hello'), false);
});
