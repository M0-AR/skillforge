import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const isWindows = process.platform === 'win32';
export const isTTY = Boolean(process.stdout.isTTY);
export const useColor = isTTY && !process.env.NO_COLOR;

const codes = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function paint(name, value) {
  if (!useColor) return String(value);
  return `${codes[name]}${value}${codes.reset}`;
}

export const c = {
  bold: (v) => paint('bold', v),
  dim: (v) => paint('dim', v),
  red: (v) => paint('red', v),
  green: (v) => paint('green', v),
  yellow: (v) => paint('yellow', v),
  blue: (v) => paint('blue', v),
  magenta: (v) => paint('magenta', v),
  cyan: (v) => paint('cyan', v),
  gray: (v) => paint('gray', v),
};

export function expandHome(input) {
  if (!input) return input;
  if (input === '~') return os.homedir();
  if (input.startsWith('~/') || input.startsWith('~\\')) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

export function configHome(env = process.env) {
  if (env.OPENCODE_CONFIG_HOME) return path.resolve(expandHome(env.OPENCODE_CONFIG_HOME));
  if (env.XDG_CONFIG_HOME) return path.join(env.XDG_CONFIG_HOME, 'opencode');
  return path.join(os.homedir(), '.config', 'opencode');
}

export function projectBase(cwd = process.cwd()) {
  return path.join(cwd, '.opencode');
}

export function pathExists(target) {
  try {
    fs.accessSync(target);
    return true;
  } catch {
    return false;
  }
}

export function isDirectory(target) {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

export function isFile(target) {
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

export async function ensureDir(target) {
  await fsp.mkdir(target, { recursive: true });
}

export async function copyDir(source, destination) {
  await ensureDir(path.dirname(destination));
  await fsp.cp(source, destination, {
    recursive: true,
    force: true,
    errorOnExist: false,
    filter: (item) => !item.split(path.sep).includes('.git'),
  });
}

export function readText(target) {
  return fs.readFileSync(target, 'utf8');
}

export async function writeText(target, text) {
  await ensureDir(path.dirname(target));
  await fsp.writeFile(target, text, 'utf8');
}

export async function removePath(target) {
  await fsp.rm(target, { recursive: true, force: true });
}

export async function run(command, args = [], options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: 20_000,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
      ...options,
    });
    return {
      ok: true,
      stdout: String(result.stdout || '').trim(),
      stderr: String(result.stderr || '').trim(),
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || '').trim(),
      code: error.code,
      message: error.message,
    };
  }
}

export function slugify(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

export function isValidSkillId(id) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(id || '')) && String(id).length <= 64;
}

export function isGitUrl(value) {
  return /^(https?:\/\/|git@|ssh:\/\/)/.test(String(value || ''));
}

export function repoNameFromUrl(url) {
  const cleaned = String(url)
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
  const last = cleaned.split(/[/:]/).filter(Boolean).pop() || 'skill';
  return slugify(last) || 'skill';
}

export function parseFrontmatter(text) {
  const lines = String(text || '').split(/\r?\n/);
  const data = {};
  let bodyStart = 0;
  let raw = '';

  if (lines[0]?.trim() !== '---') {
    return { data, body: String(text || ''), raw };
  }

  let end = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      end = index;
      break;
    }
  }

  if (end === -1) {
    return { data, body: String(text || ''), raw };
  }

  raw = lines.slice(1, end).join('\n');
  bodyStart = end + 1;
  const block = lines.slice(1, end);

  let currentKey = null;
  let blockMode = false;
  let blockValue = [];

  for (const line of block) {
    if (blockMode) {
      if (/^\s{2,}/.test(line) || line.trim() === '') {
        blockValue.push(line.replace(/^\s{2}/, ''));
        continue;
      }
      data[currentKey] = blockValue.join('\n').trim();
      blockMode = false;
      blockValue = [];
      currentKey = null;
    }

    if (!line.trim() || line.trim().startsWith('#')) continue;

    const top = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (top) {
      const [, key, value] = top;
      if (value === '>' || value === '|') {
        currentKey = key;
        blockMode = true;
        blockValue = [];
      } else if (value === '') {
        data[key] = {};
      } else {
        data[key] = unquote(value);
      }
      continue;
    }

    const nested = line.match(/^\s+([A-Za-z0-9_./-]+):\s*(.*)$/);
    if (nested && typeof data[Object.keys(data).at(-1)] === 'object') {
      const parent = Object.keys(data).at(-1);
      data[parent][nested[1]] = unquote(nested[2]);
    }
  }

  if (blockMode && currentKey) {
    data[currentKey] = blockValue.join('\n').trim();
  }

  return {
    data,
    body: lines.slice(bodyStart).join('\n').replace(/^\n+/, ''),
    raw,
  };
}

function unquote(value) {
  const trimmed = String(value || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function isManualOnly(frontmatter) {
  const metadata = frontmatter?.metadata || {};
  const autoinvoke = metadata['opencode/autoinvoke'];
  const disable = frontmatter?.['disable-model-invocation'];
  return (
    !frontmatter?.description ||
    autoinvoke === false ||
    autoinvoke === 'false' ||
    disable === true ||
    disable === 'true'
  );
}

export function removeDescription(text) {
  const lines = String(text || '').split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return String(text || '');

  let end = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      end = index;
      break;
    }
  }
  if (end === -1) return String(text || '');

  const kept = [];
  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (/^description:\s*/.test(line)) {
      if (/^description:\s*[>|]\s*$/.test(line)) {
        let cursor = index + 1;
        while (cursor < end && (/^\s{2,}/.test(lines[cursor]) || lines[cursor].trim() === '')) {
          cursor += 1;
        }
        index = cursor - 1;
      }
      continue;
    }
    kept.push(line);
  }

  return [lines[0], ...kept, ...lines.slice(end)].join('\n');
}

export function setDescription(text, description) {
  const clean = String(description || '').replace(/\s+/g, ' ').trim();
  const lines = String(text || '').split(/\r?\n/);
  if (lines[0]?.trim() === '---') {
    let end = -1;
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index].trim() === '---') {
        end = index;
        break;
      }
    }
    if (end !== -1) {
      let replaced = false;
      const kept = [];
      for (let index = 1; index < end; index += 1) {
        if (/^description:\s*/.test(lines[index])) {
          kept.push(`description: ${clean}`);
          replaced = true;
          if (/^description:\s*[>|]\s*$/.test(lines[index])) {
            let cursor = index + 1;
            while (cursor < end && (/^\s{2,}/.test(lines[cursor]) || lines[cursor].trim() === '')) {
              cursor += 1;
            }
            index = cursor - 1;
          }
          continue;
        }
        kept.push(lines[index]);
      }
      if (!replaced) kept.push(`description: ${clean}`);
      return [lines[0], ...kept, ...lines.slice(end)].join('\n');
    }
  }
  return `---\ndescription: ${clean}\n---\n\n${String(text || '').trimStart()}`;
}

export function stripCodeFences(markdown) {
  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '');
}

export function extractRelativeLinks(markdown) {
  const withoutCode = stripCodeFences(markdown);
  const links = [];
  const regex = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = regex.exec(withoutCode)) !== null) {
    const target = match[1].trim().replace(/^<|>$/g, '');
    if (
      !target ||
      target.startsWith('#') ||
      target.startsWith('/') ||
      /^(https?:|mailto:|tel:|data:|ftp:)/i.test(target)
    ) {
      continue;
    }
    links.push(target.split('#')[0].split('?')[0]);
  }
  return [...new Set(links.filter(Boolean))];
}

export function humanBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function printTable(headers, rows) {
  if (!rows.length) return '';
  const widths = headers.map((header, index) =>
    Math.max(
      String(header).length,
      ...rows.map((row) => String(row[index] ?? '').length),
    ),
  );
  const line = (values) =>
    values
      .map((value, index) => String(value ?? '').padEnd(widths[index]))
      .join('  ')
      .trimEnd();
  return [line(headers), widths.map((width) => '-'.repeat(width)).join('  '), ...rows.map(line)].join(
    '\n',
  );
}
