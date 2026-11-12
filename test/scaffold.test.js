import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { scaffoldSkill } from '../src/scaffold.js';
import { validateSkill } from '../src/validate.js';

test('scaffold creates a valid skill folder', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-scaffold-'));
  const result = await scaffoldSkill({ name: 'Release Notes', dir });
  assert.equal(result.id, 'release-notes');
  assert.ok(result.files.includes('SKILL.md'));

  const validation = await validateSkill(result.skillDir);
  assert.equal(validation.ok, true);
  assert.equal(validation.info.manualOnly, false);

  await fs.rm(dir, { recursive: true, force: true });
});

test('scaffold refuses to overwrite without force', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-scaffold-'));
  await scaffoldSkill({ name: 'demo-skill', dir });
  await assert.rejects(() => scaffoldSkill({ name: 'demo-skill', dir }), /already exists/);
  await fs.rm(dir, { recursive: true, force: true });
});
