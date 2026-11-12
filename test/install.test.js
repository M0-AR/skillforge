import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  addSkill,
  installBundled,
  listSkills,
  scopePaths,
} from '../src/install.js';
import { parseFrontmatter } from '../src/utils.js';

const root = path.resolve(import.meta.dirname, '..');

async function withTempConfig(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-install-'));
  const previous = {
    config: process.env.OPENCODE_CONFIG_HOME,
    version: process.env.SKILLFORGE_OPENCODE_VERSION,
  };
  process.env.OPENCODE_CONFIG_HOME = dir;
  process.env.SKILLFORGE_OPENCODE_VERSION = '1.19.4';
  try {
    await fn(dir);
  } finally {
    if (previous.config === undefined) delete process.env.OPENCODE_CONFIG_HOME;
    else process.env.OPENCODE_CONFIG_HOME = previous.config;
    if (previous.version === undefined) delete process.env.SKILLFORGE_OPENCODE_VERSION;
    else process.env.SKILLFORGE_OPENCODE_VERSION = previous.version;
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('install writes a manual-only skill and v1 command', async () => {
  await withTempConfig(async (config) => {
    const result = await installBundled({ manual: true, force: true });
    assert.equal(result.manual, true);
    assert.equal(result.destination, path.join(config, 'skills', 'add-skill'));
    assert.equal(result.commandPath, path.join(config, 'command', 'add-skill.md'));

    const text = await fs.readFile(path.join(result.destination, 'SKILL.md'), 'utf8');
    assert.equal(parseFrontmatter(text).data.description, undefined);

    const command = await fs.readFile(result.commandPath, 'utf8');
    assert.match(command, /\/add-skill|\/SKILL\.md/);
    assert.match(command, /\$ARGUMENTS/);

    const listed = await listSkills();
    assert.equal(listed.some((skill) => skill.id === 'add-skill' && skill.manualOnly), true);
  });
});

test('install writes a v2 command folder', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-install-v2-'));
  const previous = {
    config: process.env.OPENCODE_CONFIG_HOME,
    version: process.env.SKILLFORGE_OPENCODE_VERSION,
  };
  process.env.OPENCODE_CONFIG_HOME = dir;
  process.env.SKILLFORGE_OPENCODE_VERSION = '2.2.5';
  try {
    const result = await installBundled({ manual: true, force: true });
    assert.equal(result.commandPath, path.join(dir, 'commands', 'add-skill.md'));
  } finally {
    if (previous.config === undefined) delete process.env.OPENCODE_CONFIG_HOME;
    else process.env.OPENCODE_CONFIG_HOME = previous.config;
    if (previous.version === undefined) delete process.env.SKILLFORGE_OPENCODE_VERSION;
    else process.env.SKILLFORGE_OPENCODE_VERSION = previous.version;
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('add installs a local skill and preserves auto visibility', async () => {
  await withTempConfig(async (config) => {
    const result = await addSkill({
      source: path.join(root, 'examples', 'hello-skill'),
      auto: true,
      force: true,
    });
    assert.equal(result.id, 'hello-skill');
    assert.equal(result.manual, false);
    assert.equal(result.destination, path.join(config, 'skills', 'hello-skill'));

    const text = await fs.readFile(path.join(result.destination, 'SKILL.md'), 'utf8');
    assert.match(parseFrontmatter(text).data.description, /tiny example skill/);
    await assert.rejects(
      () => fs.stat(path.join(config, 'command', 'hello-skill.md')),
      /ENOENT/,
    );
  });
});

test('add can force manual-only and creates a command', async () => {
  await withTempConfig(async (config) => {
    const result = await addSkill({
      source: path.join(root, 'examples', 'hello-skill'),
      manual: true,
      force: true,
    });
    assert.equal(result.manual, true);
    const text = await fs.readFile(path.join(result.destination, 'SKILL.md'), 'utf8');
    assert.equal(parseFrontmatter(text).data.description, undefined);
    const command = await fs.readFile(path.join(config, 'command', 'hello-skill.md'), 'utf8');
    assert.match(command, /\$ARGUMENTS/);
  });
});

test('scopePaths switches the command folder by major version', () => {
  assert.equal(scopePaths({ versionMajor: 1 }).commandDir.endsWith('/command'), true);
  assert.equal(scopePaths({ versionMajor: 2 }).commandDir.endsWith('/commands'), true);
});
