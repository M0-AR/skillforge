import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  configHome,
  copyDir,
  c,
  ensureDir,
  isDirectory,
  isFile,
  isGitUrl,
  isValidSkillId,
  parseFrontmatter,
  pathExists,
  projectBase,
  readText,
  removeDescription,
  removePath,
  repoNameFromUrl,
  run,
  setDescription,
  slugify,
  writeText,
} from './utils.js';
import { formatValidation, validateSkill } from './validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const DEFAULT_DESCRIPTION =
  'Install a third-party Agent Skill into opencode safely, with validation and verification.';
export const MANAGED_MARKER = '<!-- skillforge:managed -->';

export async function detectOpencode() {
  if (process.env.SKILLFORGE_OPENCODE_VERSION) {
    const version = process.env.SKILLFORGE_OPENCODE_VERSION;
    return { version, major: Number(version.split('.')[0]) || null, source: 'environment' };
  }

  const candidates = [
    ['opencode', ['--version']],
    [path.join(os.homedir(), '.opencode', 'bin', 'opencode'), ['--version']],
  ];

  for (const [command, args] of candidates) {
    const result = await run(command, args);
    if (result.ok) {
      const match = result.stdout.match(/(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        return {
          version: match[0],
          major: Number(match[1]),
          source: command,
        };
      }
    }
  }

  return { version: null, major: null, source: null };
}

export function scopePaths({ project = false, versionMajor = 1, cwd = process.cwd() } = {}) {
  const base = project ? projectBase(cwd) : configHome();
  const commandFolder = versionMajor && versionMajor >= 2 ? 'commands' : 'command';
  return {
    base,
    skillsRoot: path.join(base, 'skills'),
    commandDir: path.join(base, commandFolder),
    commandFile: (id) => path.join(base, commandFolder, `${id}.md`),
    skillDir: (id) => path.join(base, 'skills', id),
  };
}

export function manualCommand(id, skillDir, { project = false, cwd = process.cwd() } = {}) {
  const displayDir = project
    ? path.relative(cwd, skillDir).split(path.sep).join('/')
    : skillDir.split(path.sep).join('/');
  return `---
description: Manual-only ${id} — loads its playbook on demand
---
${MANAGED_MARKER}

Read \`${displayDir}/SKILL.md\` in full and follow it.

Treat \`${displayDir}\` as the skill base directory and read the companion files it selects.

User request: $ARGUMENTS

If there is no request above, ask what to do. Do not start without an explicit target.
`;
}

async function findSkillDirs(root, maxDepth = 8) {
  const found = [];

  async function visit(current, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    if (entries.some((entry) => entry.isFile() && entry.name === 'SKILL.md')) {
      found.push(current);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      if (entry.name.startsWith('.')) continue;
      await visit(path.join(current, entry.name), depth + 1);
    }
  }

  await visit(root, 0);
  return found;
}

async function writeVisibility(skillDir, id, { manual, auto, project, cwd, versionMajor }) {
  const skillFile = path.join(skillDir, 'SKILL.md');
  let text = readText(skillFile);

  if (manual) {
    text = removeDescription(text);
    await writeText(skillFile, text);
    const commandPath = scopePaths({ project, cwd, versionMajor }).commandFile(id);
    await ensureDir(path.dirname(commandPath));
    await writeText(commandPath, manualCommand(id, skillDir, { project, cwd }));
    return { manual: true, commandPath };
  }

  if (auto) {
    const parsed = parseFrontmatter(text);
    if (!parsed.data.description) {
      text = setDescription(text, `Use this skill for ${id.replace(/-/g, ' ')} workflows.`);
      await writeText(skillFile, text);
    }
    const commandPath = scopePaths({ project, cwd, versionMajor }).commandFile(id);
    if (await removeManagedCommand(commandPath)) {
      return { manual: false, commandPath: null, removedCommand: commandPath };
    }
    return { manual: false, commandPath: null };
  }

  const parsed = parseFrontmatter(text);
  const manualOnly = !parsed.data.description;
  if (manualOnly) {
    const commandPath = scopePaths({ project, cwd, versionMajor }).commandFile(id);
    await ensureDir(path.dirname(commandPath));
    await writeText(commandPath, manualCommand(id, skillDir, { project, cwd }));
    return { manual: true, commandPath };
  }
  return { manual: false, commandPath: null };
}

async function removeManagedCommand(commandPath) {
  if (!(await fsp.stat(commandPath).then(() => true).catch(() => false))) return false;
  const text = readText(commandPath);
  if (!text.includes(MANAGED_MARKER)) return false;
  await removePath(commandPath);
  return true;
}

export async function installBundled({
  project = false,
  auto = false,
  manual = false,
  force = false,
  cwd = process.cwd(),
} = {}) {
  if (auto && manual) throw new Error('Choose either --auto or --manual, not both.');

  const source = path.join(repoRoot, 'skills', 'add-skill');
  if (!isDirectory(source)) throw new Error(`Bundled skill not found: ${source}`);

  const detected = await detectOpencode();
  const paths = scopePaths({ project, versionMajor: detected.major, cwd });
  const destination = paths.skillDir('add-skill');

  if (pathExists(destination) && !force) {
    throw new Error(
      `add-skill is already installed at ${destination}. Re-run with --force to replace it.`,
    );
  }

  await copyDir(source, destination);
  const manualMode = !auto;
  const result = await writeVisibility(destination, 'add-skill', {
    manual: manualMode,
    auto,
    project,
    cwd,
    versionMajor: detected.major,
  });

  return {
    destination,
    commandPath: result.commandPath,
    manual: result.manual,
    detected,
  };
}

export async function addSkill({
  source,
  name = '',
  project = false,
  auto = false,
  manual = false,
  force = false,
  dryRun = false,
  cwd = process.cwd(),
} = {}) {
  if (!source) throw new Error('Provide a skill source: a local path or a Git URL.');
  if (auto && manual) throw new Error('Choose either --auto or --manual, not both.');

  const detected = await detectOpencode();
  const paths = scopePaths({ project, versionMajor: detected.major, cwd });

  let workingRoot = path.resolve(source);
  let temporaryClone = null;

  if (isGitUrl(source)) {
    temporaryClone = path.join(os.tmpdir(), `skillforge-${Date.now()}-${process.pid}`);
    const clone = await run('git', ['clone', '--depth', '1', source, temporaryClone]);
    if (!clone.ok) {
      throw new Error(`Could not clone ${source}: ${clone.stderr || clone.message}`);
    }
    workingRoot = temporaryClone;
  } else if (!pathExists(workingRoot)) {
    throw new Error(`Source not found: ${workingRoot}`);
  }

  try {
    if (!isDirectory(workingRoot)) {
      throw new Error(`Source must be a folder containing a skill, not a file: ${workingRoot}`);
    }

    const found = await findSkillDirs(workingRoot);
    if (!found.length) {
      throw new Error(
        `No SKILL.md found under ${workingRoot}. A skill is a folder containing SKILL.md.`,
      );
    }

    let selected;
    if (name) {
      const matches = found.filter((dir) => path.basename(dir) === name);
      if (!matches.length) {
        const available = found.map((dir) => path.basename(dir)).join(', ');
        throw new Error(`No skill named "${name}" found. Available: ${available}`);
      }
      if (matches.length > 1) {
        throw new Error(`Multiple skills named "${name}" found. Refusing to guess.`);
      }
      selected = matches[0];
    } else {
      if (found.length > 1) {
        const available = found.map((dir) => path.basename(dir)).join(', ');
        throw new Error(`Multiple skills found. Choose one with --name <id>: ${available}`);
      }
      selected = found[0];
    }

    const validation = await validateSkill(selected);
    if (!validation.ok) {
      const details = formatValidation(validation, selected);
      throw new Error(`Skill validation failed:\n${details}`);
    }

    let id = path.basename(selected);
    if (!isValidSkillId(id)) {
      id = slugify(id);
      if (!id) throw new Error(`Could not derive a valid skill ID from "${path.basename(selected)}".`);
    }

    const destination = paths.skillDir(id);
    if (pathExists(destination) && !force) {
      throw new Error(
        `${id} is already installed at ${destination}. Re-run with --force to replace it.`,
      );
    }

    if (dryRun) {
      return {
        dryRun: true,
        id,
        source: selected,
        destination,
        manual: manual || (!auto && validation.info.manualOnly),
        warnings: validation.warnings,
        detected,
      };
    }

    await copyDir(selected, destination);
    const result = await writeVisibility(destination, id, {
      manual,
      auto,
      project,
      cwd,
      versionMajor: detected.major,
    });

    return {
      dryRun: false,
      id,
      source: selected,
      destination,
      manual: result.manual,
      commandPath: result.commandPath,
      warnings: validation.warnings,
      detected,
    };
  } finally {
    if (temporaryClone) {
      await removePath(temporaryClone);
    }
  }
}

export async function listSkills({ project = false, cwd = process.cwd() } = {}) {
  const detected = await detectOpencode();
  const paths = scopePaths({ project, versionMajor: detected.major, cwd });
  const rows = [];

  async function scanRoot(root, scope) {
    if (!isDirectory(root)) return;
    const entries = await fsp.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const target = path.join(root, entry.name);
      let skillFile = null;
      if (entry.isDirectory() && isFile(path.join(target, 'SKILL.md'))) {
        skillFile = path.join(target, 'SKILL.md');
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        skillFile = target;
      }
      if (!skillFile) continue;
      const text = readText(skillFile);
      const parsed = parseFrontmatter(text);
      const id = entry.isDirectory() ? entry.name : entry.name.replace(/\.md$/, '');
      rows.push({
        id,
        name: parsed.data.name || id,
        description: parsed.data.description || '',
        manualOnly: !parsed.data.description,
        scope,
        path: skillFile,
      });
    }
  }

  await scanRoot(paths.skillsRoot, project ? 'project' : 'global');
  if (!project) {
    const projectPaths = scopePaths({ project: true, versionMajor: detected.major, cwd });
    await scanRoot(projectPaths.skillsRoot, 'project');
  }

  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function formatInstall(result) {
  const lines = [];
  lines.push(`${c.green('Installed')} ${c.bold('add-skill')}`);
  lines.push(`  skill:   ${result.destination}`);
  if (result.commandPath) lines.push(`  command: ${result.commandPath}`);
  lines.push(
    `  mode:    ${result.manual ? 'manual-only (use /add-skill)' : 'auto-advertised (model may load it)'}`,
  );
  if (result.detected?.version) lines.push(`  opencode: ${result.detected.version}`);
  lines.push('');
  lines.push(c.bold('Next'));
  lines.push('  1. Restart opencode so it sees the new files.');
  lines.push('  2. Run: /add-skill https://github.com/owner/skill-repo');
  return lines.join('\n');
}
