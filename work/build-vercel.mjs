import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const outputDir = path.join(projectRoot, 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await copyFile(path.join(projectRoot, 'index.html'), path.join(outputDir, 'index.html'));
await cp(path.join(projectRoot, 'public'), outputDir, { recursive: true });

console.log(`Vercel static output created at ${outputDir}`);
