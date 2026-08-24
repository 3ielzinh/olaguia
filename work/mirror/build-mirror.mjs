import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceFile = path.resolve('work/mirror/original.html');
const publicDir = path.resolve('public');
const indexFile = path.resolve('index.html');
const originPrefix = 'https://wcria.cloud/sites/olaguia/';

const html = await readFile(sourceFile, 'utf8');
const queue = [];
const seen = new Set();
const mappings = new Map();

function assetKind(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (/\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot)(?:$)/.test(pathname)) return true;
  return url.startsWith('https://fonts.googleapis.com/css');
}

function localAsset(url) {
  const parsed = new URL(url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (parsed.origin === 'https://wcria.cloud' && pathname.startsWith('/sites/olaguia/')) {
    pathname = pathname.slice('/sites/olaguia/'.length);
  } else {
    pathname = `external/${parsed.hostname}${pathname}`;
  }
  if (!path.extname(pathname)) {
    const type = parsed.hostname === 'fonts.googleapis.com' ? '.css' : '.bin';
    pathname += type;
  }
  return pathname.replace(/^\/+/, '').replace(/[<>:"|?*]/g, '_');
}

function enqueue(raw, base) {
  const clean = raw.replaceAll('&amp;', '&').replace(/^['"]|['"]$/g, '');
  if (!clean || clean.startsWith('data:')) return;
  let absolute;
  try { absolute = new URL(clean, base).href; } catch { return; }
  if (!/^https?:/.test(absolute) || !assetKind(absolute) || seen.has(absolute)) return;
  seen.add(absolute);
  queue.push(absolute);
}

for (const match of html.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)) enqueue(match[0], originPrefix);

const downloaded = [];
for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const url = queue[cursor];
  const relative = localAsset(url);
  const destination = path.join(publicDir, relative);
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    let data = Buffer.from(await response.arrayBuffer());
    await mkdir(path.dirname(destination), { recursive: true });
    if (relative.endsWith('.css')) {
      let css = data.toString('utf8');
      for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) enqueue(match[2], url);
      data = Buffer.from(css);
    }
    await writeFile(destination, data);
    mappings.set(url, `/${relative.replaceAll('\\', '/')}`);
    downloaded.push({ url, relative });
  } catch (error) {
    console.warn(`Falha ao baixar ${url}: ${error.message}`);
  }
}

let output = html.replaceAll(originPrefix, '/');
for (const [remote, local] of [...mappings].sort((a, b) => b[0].length - a[0].length)) {
  output = output.replaceAll(remote, local).replaceAll(remote.replaceAll('&', '&amp;'), local);
}

for (const { relative, url } of downloaded.filter(item => item.relative.endsWith('.css'))) {
  const file = path.join(publicDir, relative);
  let css = await readFile(file, 'utf8');
  for (const [remote, local] of [...mappings].sort((a, b) => b[0].length - a[0].length)) {
    css = css.replaceAll(remote, local).replaceAll(remote.replaceAll('&', '&amp;'), local);
  }
  await writeFile(file, css);
}

output = output.replace(/<script[^>]+static\.cloudflareinsights\.com[\s\S]*?<\/script>/g, '');
output = output.replace(
  '<img decoding="async" width="671" height="774" src="/wp-content/uploads/img-circle-02.png" class="attachment-full size-full" alt="" loading="lazy" srcset="/wp-content/uploads/img-circle-02.png 671w, /wp-content/uploads/img-circle-02-260x300.png 260w" sizes="auto, (max-width: 671px) 100vw, 671px" />',
  '<img decoding="async" width="671" height="774" src="/wp-content/uploads/mulher-maos-na-cabeca.jpg" class="attachment-full size-full" alt="Mulher preocupada com as mãos na cabeça" loading="lazy" style="width:100%;height:auto;aspect-ratio:671 / 774;object-fit:cover;object-position:center;mix-blend-mode:multiply;" />'
);
await writeFile(indexFile, output);
await writeFile(path.resolve('work/mirror/assets-manifest.json'), JSON.stringify(downloaded, null, 2));
console.log(`Espelho criado com ${downloaded.length} recursos locais.`);
