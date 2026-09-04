import { readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'sw.js') continue;
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await walk(`${directory}/${entry.name}`, `${relative}/`));
    else files.push(`./${relative}`);
  }
  return files;
}

const assets = ['./', ...await walk(new URL('../dist', import.meta.url).pathname)];
const version = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 10);
const serviceWorker = `const CACHE_PREFIX = 'inne-pytanie-';
const CACHE = CACHE_PREFIX + '${version}';
const CORE = ${JSON.stringify(assets)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.status === 200 && response.type !== 'opaque') caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match('./index.html'))));
});\n`;
await writeFile(new URL('../dist/sw.js', import.meta.url), serviceWorker);
console.log(`Service worker precaches ${assets.length} files.`);
