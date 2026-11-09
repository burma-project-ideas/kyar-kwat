import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

assert(process.argv[2], 'Pass the design skill directory containing scripts/lib/cdp.mjs.');
const { Browser, sleep } = await import(pathToFileURL(join(resolve(process.argv[2]), 'scripts/lib/cdp.mjs')));
const base = (process.argv[3] || 'http://127.0.0.1:5281').replace(/\/$/, '');
const output = resolve('.taste-skill/branding');
mkdirSync(output, { recursive: true });
let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
const get = async path => { const r = await fetch(base + path); check(r.ok, `load ${path}`); return r; };
const png = async (path, width, height) => {
  const b = Buffer.from(await (await get(path)).arrayBuffer());
  check(b.subarray(1, 4).toString() === 'PNG', `${path} PNG signature`);
  check(b.readUInt32BE(16) === width && b.readUInt32BE(20) === height, `${path} dimensions`);
};
const html = await (await get('/')).text();
check(!html.includes('href="data:,"'), 'no empty favicon');
check(html.includes('branding/site.webmanifest') && html.includes('branding/apple-touch-icon.png'), 'home screen links');
check(html.includes('og:image') && html.includes('twitter:image') && html.includes('https://kyarkwat.vercel.app/branding/social-card.png'), 'absolute sharing metadata');
check(html.includes('rel="canonical"') && html.includes('name="description"'), 'canonical and description');
const manifest = await (await get('/branding/site.webmanifest')).json();
check(manifest.start_url === '/' && manifest.name.includes('KyarKwat'), 'manifest identity');
check(manifest.icons.length === 3, 'standard and maskable app icons');
for (const icon of manifest.icons) {
  const [width, height] = icon.sizes.split('x').map(Number);
  await png('/branding/' + icon.src, width, height);
}
for (const size of [16, 32, 48]) await png(`/branding/favicon-${size}.png`, size, size);
await png('/branding/apple-touch-icon.png', 180, 180);
await png('/branding/logo-dark.png', 1024, 1024);
await png('/branding/logo-light.png', 1024, 1024);
await png('/branding/social-card.png', 1200, 630);
const ico = Buffer.from(await (await get('/branding/favicon.ico')).arrayBuffer());
check(ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 3, 'three-resolution ICO');
for (let i = 0; i < 3; i++) check(ico[6 + i * 16] === [16, 32, 48][i], 'ICO resolution');
const master = await (await get('/branding/logo-master.svg')).text();
for (const name of ['logo-dark.svg', 'logo-light.svg', 'favicon.svg']) {
  const svg = await (await get('/branding/' + name)).text();
  check(svg.match(/ d="([^"]+)"/)[1] === master.match(/ d="([^"]+)"/)[1], 'same master geometry');
}
const browser = await Browser.launch();
try {
  const page = await browser.newPage();
  await page.send('Network.enable');
  await page.send('Network.setBlockedURLs', { urls: ['*/_framework/blazor.webassembly.js'] });
  await page.goto(base);
  check(await page.eval(() => document.querySelector('.loading img').complete && document.querySelector('.loading img').naturalWidth > 0), 'loading logo loads before runtime');
  await page.screenshot({ path: join(output, 'loading.jpg') });
  await page.send('Network.setBlockedURLs', { urls: [] });
  await page.goto(base);
  const deadline = Date.now() + 90000;
  while (!await page.eval(() => document.querySelector('#setup-dialog')?.open)) {
    assert(Date.now() < deadline, 'game startup timeout');
    await sleep(100);
  }
  await page.eval(() => document.querySelector('#setup-dialog .close-button').click());
  await sleep(100);
  for (const [width, height] of [[1440, 900], [360, 640], [390, 844]]) {
    await page.setViewport({ width, height, mobile: width < 500 });
    check(await page.eval(() => { const e = document.querySelector('.brand-mark'); const r = e.getBoundingClientRect(); return e.complete && e.naturalWidth > 0 && r.width === 32 && r.height === 32; }), 'fixed-size header logo');
    check(await page.eval(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow');
    await page.screenshot({ path: join(output, `game-${width}.jpg`), fullPage: true });
  }
  check(await page.eval(async () => {
    const image = new Image(); image.src = 'branding/icon-maskable-512.png'; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, 512, 512).data;
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const at = (y * 512 + x) * 4;
      if (pixels[at + 3] !== 255) return false;
      if ((pixels[at] !== 17 || pixels[at + 1] !== 17 || pixels[at + 2] !== 17) && Math.hypot(x - 256, y - 256) > 512 * .4) return false;
    }
    return true;
  }), 'opaque maskable icon with safe artwork bounds');
  const assets = await browser.newPage({ width: 600, height: 300 });
  for (const [theme, fill] of [['dark', 'rgb(120, 191, 161)'], ['light', 'rgb(24, 62, 48)']]) {
    await assets.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
    await assets.goto(base + '/branding/favicon.svg');
    check(await assets.eval(() => getComputedStyle(document.querySelector('path')).fill) === fill, `adaptive ${theme} favicon`);
    await assets.screenshot({ path: join(output, `favicon-${theme}.jpg`) });
  }
  assert.deepEqual(page.consoleErrors, [], 'game has no browser exceptions');
  console.log(`PASS: ${checks} brand assertions, loading/header/mobile screenshots, adaptive themes and maskable safe area.`);
} finally { await browser.close(); }
