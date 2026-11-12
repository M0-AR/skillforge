import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateSkill } from '../src/validate.js';

const root = path.resolve(import.meta.dirname, '..');

test('the bundled add-skill is valid', async () => {
  const result = await validateSkill(path.join(root, 'skills', 'add-skill'));
  assert.equal(result.ok, true);
  assert.equal(result.info.id, 'add-skill');
  assert.ok(result.info.companionFiles.includes('references/checklist.md'));
  assert.ok(result.info.companionFiles.includes('references/security.md'));
  assert.ok(result.info.companionFiles.includes('references/troubleshooting.md'));
});

test('the hello example is valid and manual-only is detected', async () => {
  const result = await validateSkill(path.join(root, 'examples', 'hello-skill'));
  assert.equal(result.ok, true);
  assert.equal(result.info.manualOnly, false);
});

test('broken companion links are errors', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-validate-'));
  await fs.writeFile(
    path.join(dir, 'SKILL.md'),
    '---\nname: broken-skill\ndescription: Broken\n---\n\nRead [missing](references/nope.md).\n',
  );
  const result = await validateSkill(dir);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Broken companion link/);
  await fs.rm(dir, { recursive: true, force: true });
});

test('missing SKILL.md is an error', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-validate-'));
  const result = await validateSkill(dir);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Missing SKILL\.md/);
  await fs.rm(dir, { recursive: true, force: true });
});
