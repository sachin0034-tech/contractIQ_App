// Copies the pdf.js worker into public/ so it is served as a static file.
// Bundling it through webpack breaks the production minifier, and copying keeps it matched to the installed version.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const target = resolve(root, 'public/pdf.worker.min.mjs');

if (!existsSync(source)) {
  console.error('pdfjs-dist is not installed; run npm install first.');
  process.exit(1);
}
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('Copied pdf.worker.min.mjs to public/');
