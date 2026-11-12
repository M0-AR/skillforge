import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  extractRelativeLinks,
  humanBytes,
  isDirectory,
  isManualOnly,
  isValidSkillId,
  parseFrontmatter,
  readText,
} from './utils.js';

async function walkFiles(root, options = {}) {
  const files = [];
  const maxDepth = options.maxDepth ?? 12;

  async function visit(current, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(target, depth + 1);
      } else if (entry.isSymbolicLink()) {
        files.push({ path: target, symlink: true, size: 0 });
      } else if (entry.isFile()) {
        const stat = await fsp.stat(target);
        files.push({ path: target, symlink: false, size: stat.size });
      }
    }
  }

  await visit(root, 0);
  return files;
}

export async function validateSkill(skillDir, options = {}) {
  const resolved = path.resolve(skillDir);
  const errors = [];
  const warnings = [];
  const info = {
    id: path.basename(resolved),
    name: path.basename(resolved),
    description: '',
    manualOnly: true,
    fileCount: 0,
    totalBytes: 0,
    companionFiles: [],
  };

  if (!isDirectory(resolved)) {
    return {
      ok: false,
      errors: [`Skill folder not found: ${resolved}`],
      warnings,
      info,
    };
  }

  const skillFile = path.join(resolved, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    return {
      ok: false,
      errors: [`Missing SKILL.md in ${resolved}`],
      warnings,
      info,
    };
  }

  const text = readText(skillFile);
  const frontmatter = parseFrontmatter(text);
  const data = frontmatter.data || {};

  info.name = String(data.name || info.id);
  info.description = String(data.description || '');
  info.manualOnly = isManualOnly(data);

  if (!frontmatter.raw && !options.allowNoFrontmatter) {
    warnings.push('No YAML frontmatter. Add a name and description for portability.');
  }

  if (!data.name) {
    warnings.push('Missing "name" in frontmatter. The folder name will be used as the ID.');
  } else if (!isValidSkillId(data.name)) {
    warnings.push(
      `"name: ${data.name}" is not a portable skill ID. Use lowercase kebab-case (1-64 characters).`,
    );
  }

  if (data.name && data.name !== info.id) {
    warnings.push(`Frontmatter name "${data.name}" does not match folder name "${info.id}".`);
  }

  if (!data.description) {
    info.manualOnly = true;
  } else if (String(data.description).length > 1024) {
    warnings.push('Description is longer than 1024 characters; model discovery may truncate it.');
  }

  if (/todo|tbd|fixme/i.test(info.name) || /todo|tbd|fixme/i.test(info.description)) {
    warnings.push('Name or description still contains a placeholder word (TODO/TBD/FIXME).');
  }

  if (!frontmatter.body.trim()) {
    errors.push('SKILL.md has no instructions after the frontmatter.');
  }

  const metadata = data.metadata;
  if (metadata && typeof metadata === 'object' && 'opencode/autoinvoke' in metadata) {
    const value = metadata['opencode/autoinvoke'];
    if (![true, false, 'true', 'false'].includes(value)) {
      warnings.push('metadata.opencode/autoinvoke should be true or false.');
    }
  }

  const links = extractRelativeLinks(frontmatter.body);
  for (const link of links) {
    const target = path.resolve(resolved, link);
    const relative = path.relative(resolved, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      warnings.push(`Companion link leaves the skill folder: ${link}`);
    }
    const exists = await fsp
      .stat(target)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      errors.push(`Broken companion link: ${link}`);
    } else {
      info.companionFiles.push(link);
    }
  }

  const files = await walkFiles(resolved);
  info.fileCount = files.length;
  info.totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  for (const file of files) {
    if (!file.symlink) continue;
    const target = await fsp.realpath(file.path).catch(() => null);
    if (!target) {
      warnings.push(`Broken symbolic link: ${path.relative(resolved, file.path)}`);
      continue;
    }
    const relative = path.relative(resolved, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      warnings.push(`Symbolic link points outside the skill folder: ${path.relative(resolved, file.path)}`);
    }
  }

  const skillSize = Buffer.byteLength(text, 'utf8');
  if (skillSize > 512 * 1024) {
    warnings.push(`SKILL.md is ${humanBytes(skillSize)}; keep the main file focused.`);
  }
  if (info.fileCount > 200) {
    warnings.push(`Skill contains ${info.fileCount} files; review whether all of them are needed.`);
  }
  if (info.totalBytes > 5 * 1024 * 1024) {
    warnings.push(`Skill is ${humanBytes(info.totalBytes)}; large skills are slow to clone and review.`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

export function formatValidation(result, target = '') {
  const lines = [];
  const label = target ? ` ${target}` : '';
  lines.push(`${result.ok ? 'PASS' : 'FAIL'}${label}`);
  lines.push(
    `  id: ${result.info.id}  |  files: ${result.info.fileCount}  |  size: ${humanBytes(
      result.info.totalBytes,
    )}  |  ${result.info.manualOnly ? 'manual-only' : 'auto-advertised'}`,
  );
  for (const error of result.errors) lines.push(`  error: ${error}`);
  for (const warning of result.warnings) lines.push(`  warning: ${warning}`);
  return lines.join('\n');
}
