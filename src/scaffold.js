import path from 'node:path';
import {
  ensureDir,
  isValidSkillId,
  pathExists,
  slugify,
  writeText,
} from './utils.js';

function skillTemplate(id) {
  return `---
name: ${id}
description: Explain when the model should use this skill in one clear sentence.
---

# ${id.replace(/-/g, ' ')}

## When to use

Use this skill when the user asks for **replace this with the job to be done**.

Do not use it for unrelated requests. If the request is ambiguous, ask one short question first.

## Inputs

- What the user must provide.
- What you can discover from the project.
- What you should never guess.

## Workflow

1. Read \`references/notes.md\`.
2. Inspect the smallest relevant set of files.
3. Make a short plan and state assumptions.
4. Do the work.
5. Verify the result with a concrete check.

## Guardrails

- Do not modify files outside the requested scope.
- Do not run destructive commands without explicit approval.
- Do not invent facts, paths, or command output.
- If a check fails, stop and report the failure.

## Verification

- Run the smallest test or check that proves the result.
- Report what changed, what was checked, and what is still uncertain.

## References

- \`references/notes.md\` — domain notes and examples.
`;
}

function notesTemplate(id) {
  return `# Notes for ${id}

Replace this file with the domain knowledge the skill needs.

## Examples

- A good request.
- A request that should be refused.
- The expected output shape.

## Checklist

- [ ] The skill has one clear job.
- [ ] The instructions are ordered.
- [ ] Every relative link resolves inside this folder.
- [ ] A verification step is included.
`;
}

function checkTemplate() {
  return `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(dir, 'SKILL.md');
const errors = [];

if (!fs.existsSync(file)) {
  errors.push('Missing SKILL.md');
} else {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---')) errors.push('Missing YAML frontmatter');
  if (!/^name:\\s*\\S+/m.test(text)) errors.push('Missing name');
  if (!/^description:\\s*\\S+/m.test(text)) errors.push('Missing description');
  const parts = text.split(/^---$/m);
  const body = parts.slice(2).join('---').trim();
  if (!body) errors.push('No instructions after frontmatter');
}

if (errors.length) {
  console.error(errors.join('\\n'));
  process.exit(1);
}

console.log('OK');
`;
}

export async function scaffoldSkill({ name, dir = process.cwd(), force = false } = {}) {
  if (!name) throw new Error('Provide a skill name, for example: skillforge scaffold release-notes');
  const id = slugify(name);
  if (!isValidSkillId(id)) {
    throw new Error(`"${name}" does not produce a valid skill ID. Use letters, numbers, and hyphens.`);
  }

  const root = path.resolve(dir);
  const skillDir = path.join(root, id);
  if (pathExists(skillDir) && !force) {
    throw new Error(`${skillDir} already exists. Re-run with --force to replace it.`);
  }

  await ensureDir(path.join(skillDir, 'references'));
  await ensureDir(path.join(skillDir, 'scripts'));
  await writeText(path.join(skillDir, 'SKILL.md'), skillTemplate(id));
  await writeText(path.join(skillDir, 'references', 'notes.md'), notesTemplate(id));
  await writeText(path.join(skillDir, 'scripts', 'check.mjs'), checkTemplate());

  return {
    id,
    skillDir,
    files: ['SKILL.md', 'references/notes.md', 'scripts/check.mjs'],
  };
}

export function describeScaffold(result) {
  return [
    `Created ${result.skillDir}`,
    ...result.files.map((file) => `  ${file}`),
    '',
    'Next:',
    '  1. Edit SKILL.md and references/notes.md.',
    `  2. Run: node src/cli.js validate ${result.skillDir}`,
    `  3. Install: node src/cli.js add ${result.skillDir} --manual`,
  ].join('\n');
}
