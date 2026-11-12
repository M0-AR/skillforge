import fs from 'node:fs';
import path from 'node:path';
import { c, printTable } from './utils.js';
import {
  addSkill,
  formatInstall,
  installBundled,
  listSkills,
  repoRoot,
} from './install.js';
import { formatValidation, validateSkill } from './validate.js';
import { describeScaffold, scaffoldSkill } from './scaffold.js';
import { doctor, doctorJson, formatDoctor } from './doctor.js';

const VALUE_FLAGS = new Set(['--name', '--dir']);
const BOOLEAN_FLAGS = new Set([
  '--project',
  '--auto',
  '--manual',
  '--force',
  '--dry-run',
  '--json',
  '--help',
  '--version',
]);

function readPackage() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('-')) {
      positionals.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split('=', 2);
    if (VALUE_FLAGS.has(flag)) {
      const value = inlineValue ?? argv[index + 1];
      if (!value || value.startsWith('-')) throw new Error(`${flag} needs a value.`);
      flags[flag.slice(2)] = value;
      if (inlineValue === undefined) index += 1;
      continue;
    }

    if (BOOLEAN_FLAGS.has(flag)) {
      flags[flag.slice(2)] = true;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return { positionals, flags };
}

function helpText() {
  const pkg = readPackage();
  return `${c.bold('SkillForge')} ${pkg.version}
${pkg.description}

${c.bold('Usage')}
  skillforge <command> [options]

${c.bold('Commands')}
  install                 Install the bundled /add-skill helper
  add <source>            Install a skill from a local path or Git URL
  validate <path>         Check a skill folder before installing it
  scaffold <name>         Create a starter skill folder
  list                    List installed skills and their visibility
  doctor                  Check Node, Git, opencode, paths, and permissions

${c.bold('Options')}
  --project               Use ./.opencode instead of ~/.config/opencode
  --auto                  Advertise the skill to the model
  --manual                Hide it from the model; invoke it by name
  --name <id>             Pick one skill when a repo contains several
  --force                 Replace an existing installation
  --dry-run               Show what would happen without writing
  --dir <path>            Parent folder for scaffold
  --json                  Machine-readable output for validate/list/doctor
  -h, --help              Show this help
  -v, --version           Show the version

${c.bold('Examples')}
  npx github:M0-AR/skillforge install
  node bin/skillforge.js add ./examples/hello-skill --manual
  node bin/skillforge.js add https://github.com/owner/skill-repo --name release-notes
  node bin/skillforge.js validate ./examples/hello-skill
  node bin/skillforge.js scaffold my-skill --dir ./examples
  node bin/skillforge.js list

${c.dim('Docs: https://github.com/M0-AR/skillforge/tree/main/docs')}`;
}

function ensureOnly(positionals, flags, allowed = []) {
  const unknown = Object.entries(flags)
    .filter(([key]) => !allowed.includes(key) && !['help', 'version'].includes(key))
    .map(([key]) => `--${key}`);
  if (unknown.length) throw new Error(`Option not valid for this command: ${unknown.join(', ')}`);
  if (positionals.length > 1) {
    throw new Error(`Unexpected argument: ${positionals.slice(1).join(' ')}`);
  }
}

async function commandInstall(flags) {
  const result = await installBundled({
    project: Boolean(flags.project),
    auto: Boolean(flags.auto),
    manual: Boolean(flags.manual),
    force: Boolean(flags.force),
  });
  console.log(formatInstall(result));
}

async function commandAdd(positionals, flags) {
  const source = positionals[0];
  const result = await addSkill({
    source,
    name: flags.name,
    project: Boolean(flags.project),
    auto: Boolean(flags.auto),
    manual: Boolean(flags.manual),
    force: Boolean(flags.force),
    dryRun: Boolean(flags['dry-run']),
  });

  if (result.dryRun) {
    console.log(c.bold('Dry run'));
    console.log(`  source:      ${result.source}`);
    console.log(`  id:          ${result.id}`);
    console.log(`  destination: ${result.destination}`);
    console.log(`  mode:        ${result.manual ? 'manual-only' : 'auto-advertised'}`);
    for (const warning of result.warnings) console.log(`  warning:     ${warning}`);
    return;
  }

  console.log(`${c.green('Installed')} ${c.bold(result.id)}`);
  console.log(`  from:    ${result.source}`);
  console.log(`  to:      ${result.destination}`);
  if (result.commandPath) console.log(`  command: ${result.commandPath}`);
  console.log(
    `  mode:    ${result.manual ? 'manual-only (use /' + result.id + ')' : 'auto-advertised (model may load it)'}`,
  );
  if (result.detected?.version) console.log(`  opencode: ${result.detected.version}`);
  for (const warning of result.warnings) console.log(`  ${c.yellow('warning')}: ${warning}`);
  console.log('');
  console.log(c.bold('Next'));
  console.log('  1. Review the skill instructions before running bundled scripts.');
  console.log('  2. Restart opencode so it sees the new files.');
  console.log(
    `  3. ${result.manual ? 'Run: /' + result.id + ' <request>' : 'Invoke it with @' + result.id + ' or ask naturally.'}`,
  );
}

async function commandValidate(positionals, flags) {
  const target = positionals[0] || process.cwd();
  const result = await validateSkill(target);

  if (flags.json) {
    console.log(JSON.stringify({ target, ...result }, null, 2));
  } else {
    console.log(formatValidation(result, target));
    if (result.warnings.length) {
      console.log('');
      console.log(c.yellow('Review the warnings before installing.'));
    }
  }

  if (!result.ok) process.exitCode = 1;
}

async function commandScaffold(positionals, flags) {
  const result = await scaffoldSkill({
    name: positionals[0],
    dir: flags.dir || process.cwd(),
    force: Boolean(flags.force),
  });
  console.log(describeScaffold(result));
}

async function commandList(flags) {
  const skills = await listSkills({ project: Boolean(flags.project) });

  if (flags.json) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  if (!skills.length) {
    console.log('No installed skills found.');
    console.log('');
    console.log('Install the bundled helper with:');
    console.log('  node bin/skillforge.js install');
    return;
  }

  const rows = skills.map((skill) => [
    skill.id,
    skill.manualOnly ? c.yellow('manual') : c.green('auto'),
    skill.scope,
    skill.description
      ? skill.description.length > 64
        ? `${skill.description.slice(0, 61)}...`
        : skill.description
      : c.dim('no description'),
  ]);

  console.log(printTable(['ID', 'MODE', 'SCOPE', 'DESCRIPTION'], rows));
}

async function commandDoctor(flags) {
  const report = await doctor({ project: Boolean(flags.project) });
  if (flags.json) {
    console.log(doctorJson(report));
    return;
  }
  console.log(formatDoctor(report));
}

async function main(argv = process.argv.slice(2)) {
  const { positionals, flags } = parseArgs(argv);

  if (flags.version) {
    console.log(readPackage().version);
    return;
  }

  if (flags.help || !positionals.length) {
    console.log(helpText());
    return;
  }

  const command = positionals.shift();

  switch (command) {
    case 'install':
      ensureOnly(positionals, flags, ['project', 'auto', 'manual', 'force']);
      await commandInstall(flags);
      break;
    case 'add':
      ensureOnly(positionals, flags, ['project', 'auto', 'manual', 'force', 'dry-run', 'name']);
      if (!positionals[0]) throw new Error('Provide a skill source: a local path or a Git URL.');
      await commandAdd(positionals, flags);
      break;
    case 'validate':
      ensureOnly(positionals, flags, ['json']);
      await commandValidate(positionals, flags);
      break;
    case 'scaffold':
      ensureOnly(positionals, flags, ['dir', 'force']);
      if (!positionals[0]) throw new Error('Provide a skill name.');
      await commandScaffold(positionals, flags);
      break;
    case 'list':
      ensureOnly(positionals, flags, ['project', 'json']);
      await commandList(flags);
      break;
    case 'doctor':
      ensureOnly(positionals, flags, ['project', 'json']);
      await commandDoctor(flags);
      break;
    case 'help':
      console.log(helpText());
      break;
    default:
      throw new Error(`Unknown command: ${command}\nRun "skillforge --help" for usage.`);
  }
}

export { main };
