import fs from 'node:fs';
import path from 'node:path';
import { c, isFile, pathExists, run } from './utils.js';
import { detectOpencode, listSkills, scopePaths } from './install.js';

export async function doctor({ project = false, cwd = process.cwd() } = {}) {
  const opencode = await detectOpencode();
  const paths = scopePaths({ project, versionMajor: opencode.major, cwd });
  const skills = await listSkills({ project, cwd });
  const node = process.version;
  const git = await run('git', ['--version']);
  const configJson = path.join(paths.base, 'opencode.json');
  const configJsonc = path.join(paths.base, 'opencode.jsonc');
  const writable = await canWriteOrCreate(paths.base);
  const exists = pathExists(paths.base);

  return {
    node,
    platform: process.platform,
    arch: process.arch,
    cwd,
    git: git.ok ? git.stdout : null,
    opencode: {
      version: opencode.version,
      source: opencode.source,
      major: opencode.major,
    },
    config: {
      base: paths.base,
      exists,
      writable,
      opencodeJson: isFile(configJson) || isFile(configJsonc),
    },
    paths: {
      skills: paths.skillsRoot,
      commands: paths.commandDir,
    },
    skills: {
      count: skills.length,
      manualOnly: skills.filter((skill) => skill.manualOnly).length,
      auto: skills.filter((skill) => !skill.manualOnly).length,
      items: skills,
    },
  };
}

export function formatDoctor(report) {
  const lines = [];
  const ok = (value) => (value ? c.green('ok') : c.yellow('missing'));
  lines.push(c.bold('SkillForge doctor'));
  lines.push('');
  lines.push(`  Node.js      ${report.node}`);
  lines.push(`  Platform     ${report.platform}/${report.arch}`);
  lines.push(`  Git          ${report.git || ok(false)}`);
  lines.push(
    `  opencode     ${report.opencode.version || ok(false)}${
      report.opencode.major ? ` (v${report.opencode.major})` : ''
    }`,
  );
  lines.push(`  Config       ${report.config.base}`);
  lines.push(
    `  Writable     ${report.config.writable ? c.green('yes') : c.red('no')}${
      report.config.exists ? '' : report.config.writable ? c.dim(' (will create)') : ''
    }`,
  );
  lines.push(`  Config file  ${report.config.opencodeJson ? c.green('found') : c.yellow('not found')}`);
  lines.push(`  Skills       ${report.skills.count} installed (${report.skills.manualOnly} manual, ${report.skills.auto} auto)`);
  lines.push('');
  lines.push(c.bold('Paths'));
  lines.push(`  skills       ${report.paths.skills}`);
  lines.push(`  commands     ${report.paths.commands}`);
  if (report.skills.items.length) {
    lines.push('');
    lines.push(c.bold('Installed skills'));
    for (const skill of report.skills.items) {
      lines.push(
        `  ${skill.id.padEnd(24)} ${skill.manualOnly ? c.yellow('manual') : c.green('auto')}  ${skill.scope}`,
      );
    }
  }
  lines.push('');
  lines.push(c.bold('What to check'));
  lines.push('  - If opencode is missing, install it and re-run this command.');
  lines.push('  - If the config folder is not writable, fix permissions before installing.');
  lines.push('  - Restart opencode after adding or removing a skill.');
  return lines.join('\n');
}

export function doctorJson(report) {
  return JSON.stringify(report, null, 2);
}

async function canWriteOrCreate(target) {
  let current = target;
  for (;;) {
    if (pathExists(current)) {
      return fs.promises
        .access(current, fs.constants.W_OK)
        .then(() => true)
        .catch(() => false);
    }
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}
