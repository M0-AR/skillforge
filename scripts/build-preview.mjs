import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = await readFile(path.join(root, 'index.html'), 'utf8');

const preview = index
  .replace(
    '<link rel="canonical" href="https://m0-ar.github.io/skillforge/">',
    '<link rel="canonical" href="https://m0-ar.github.io/skillforge/preview.html">',
  )
  .replace('</head>', '  <!-- Generated from index.html. Edit index.html, then run npm run site. -->\n</head>');

await writeFile(path.join(root, 'preview.html'), preview);
console.log('preview.html generated from index.html');
