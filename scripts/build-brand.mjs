import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brand = join(root, 'BlazorWasm.KyarKwat/wwwroot/branding');
const docs = join(root, 'docs/images');
const work = join(root, 'artifacts/branding');
mkdirSync(work, { recursive: true });
mkdirSync(docs, { recursive: true });
const master = readFileSync(join(brand, 'logo-master.svg'), 'utf8');
assert(master.includes('viewBox="0 0 96 96"') && master.includes('fill-rule="evenodd"'), 'Keep the transparent 96-unit master.');
const dark = master;
const light = master.replace('color="#78bfa1"', 'color="#183e30"');
const adaptive = master.replace('<title>', '<style>@media(prefers-color-scheme:light){svg{color:#183e30}}</style><title>');
writeFileSync(join(brand, 'logo-dark.svg'), dark);
writeFileSync(join(brand, 'logo-light.svg'), light);
writeFileSync(join(brand, 'favicon.svg'), adaptive);
// Keep the existing public README image URL valid with the new adaptive mark.
writeFileSync(join(docs, 'mark.svg'), adaptive);

const assets = [
  ['logo-dark.png', 1024, dark, null, 1],
  ['logo-light.png', 1024, light, null, 1],
  ...[16, 32, 48].map(size => [`favicon-${size}.png`, size, dark, '#111111', 1]),
  ['apple-touch-icon.png', 180, dark, '#111111', 1],
  ['icon-192.png', 192, dark, '#111111', 1],
  ['icon-512.png', 512, dark, '#111111', 1],
  ['icon-maskable-512.png', 512, dark, '#111111', .8]
];
const font = name => readFileSync(join(root, 'BlazorWasm.KyarKwat/wwwroot/fonts', name)).toString('base64');
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(data:font/ttf;base64,${font('Inter.ttf')});font-weight:100 900}
@font-face{font-family:Myanmar;src:url(data:font/ttf;base64,${font('NotoSansMyanmar.ttf')});font-weight:100 900}
</style><pre id="brand-output">pending</pre><script>
(async()=>{
  const output={};
  const image=svg=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));});
  const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const assets=${JSON.stringify(assets)};
  for(const [name,size,svg,background,scale] of assets){
    const c=canvas(size,size),ctx=c.getContext('2d');
    if(background){ctx.fillStyle=background;ctx.fillRect(0,0,size,size);}
    const inset=size*(1-scale)/2;
    ctx.drawImage(await image(svg),inset,inset,size*scale,size*scale);
    if(!background){
      if(ctx.getImageData(0,0,1,1).data[3]!==0)throw new Error('Master corner must be transparent');
      if(ctx.getImageData(Math.round(size*48/96),Math.round(size*25/96),1,1).data[3]!==0)throw new Error('Tiger forehead stripe must be transparent');
    }
    output[name]=c.toDataURL('image/png').split(',')[1];
  }
  await document.fonts.load('600 72px Inter');
  await document.fonts.load('400 34px Myanmar');
  const mark=await image(${JSON.stringify(dark)}), ink=await image(${JSON.stringify(light)});
  const social=canvas(1200,630),ctx=social.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,1200,630);
  ctx.drawImage(mark,64,190,200,200);
  ctx.fillStyle='#fff';ctx.font='600 76px Inter';ctx.fillText('KyarKwat',296,284);
  ctx.font='400 34px Myanmar';ctx.fillText('မြန်မာ့ရိုးရာ ကျားကွက်',300,354);
  ctx.fillStyle='#b4b4b4';ctx.font='400 28px Myanmar';ctx.fillText('ကျားနိုင် / ကျားကုန်',300,424);
  output['social-card.png']=social.toDataURL('image/png').split(',')[1];
  output['social-card-tiger.png']=output['social-card.png'];
  const preview=canvas(960,480),p=preview.getContext('2d');
  p.fillStyle='#fff';p.fillRect(0,0,480,480);p.fillStyle='#000';p.fillRect(480,0,480,480);
  p.drawImage(ink,112,64,256,256);p.drawImage(mark,592,64,256,256);
  p.textAlign='center';p.font='600 28px Inter';p.fillStyle='#183e30';p.fillText('KyarKwat',240,364);p.fillStyle='#fff';p.fillText('KyarKwat',720,364);
  p.font='400 16px Inter';p.fillStyle='#555';p.fillText('Light surface',240,408);p.fillStyle='#b4b4b4';p.fillText('Dark surface',720,408);
  output['brand-preview.png']=preview.toDataURL('image/png').split(',')[1];
  document.querySelector('#brand-output').textContent=JSON.stringify(output);
})().catch(error=>document.querySelector('#brand-output').textContent=JSON.stringify({error:String(error)}));
</script>`;
const page = join(work, 'render.html');
writeFileSync(page, html);
const browser = process.env.CHROME_PATH || [
  join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
  join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(existsSync);
assert(browser, 'Install Chrome/Edge or set CHROME_PATH.');
const rendered = spawnSync(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', '--disable-gpu', `--user-data-dir=${join(work, 'browser-profile')}`,
  '--dump-dom', '--virtual-time-budget=5000', pathToFileURL(page).href],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 60000, windowsHide: true });
assert.equal(rendered.status, 0, rendered.stderr?.slice(-800));
const match = rendered.stdout.match(/<pre id="brand-output">([^<]+)<\/pre>/);
assert(match && match[1] !== 'pending', 'Browser did not finish rendering.');
const output = JSON.parse(match[1]);
assert(!output.error, output.error);
const dimensions = new Map(assets.map(([name, size]) => [name, [size, size]]));
dimensions.set('social-card.png', [1200, 630]);
dimensions.set('social-card-tiger.png', [1200, 630]);
dimensions.set('brand-preview.png', [960, 480]);
for (const [name, data] of Object.entries(output)) {
  const bytes = Buffer.from(data, 'base64');
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], dimensions.get(name), name);
  writeFileSync(join(name === 'brand-preview.png' ? docs : brand, name), bytes);
}
const entries = [16, 32, 48].map(size => readFileSync(join(brand, `favicon-${size}.png`)));
const ico = Buffer.alloc(6 + entries.length * 16);
ico.writeUInt16LE(1, 2); ico.writeUInt16LE(entries.length, 4);
let offset = ico.length;
entries.forEach((png, index) => {
  const start = 6 + index * 16;
  ico[start] = ico[start + 1] = [16, 32, 48][index];
  ico.writeUInt16LE(1, start + 4); ico.writeUInt16LE(32, start + 6);
  ico.writeUInt32LE(png.length, start + 8); ico.writeUInt32LE(offset, start + 12);
  offset += png.length;
});
const favicon = Buffer.concat([ico, ...entries]);
writeFileSync(join(brand, 'favicon.ico'), favicon);
writeFileSync(join(brand, '../favicon.ico'), favicon);
console.log(`Generated ${Object.keys(output).length} checked PNGs, SVG variants and multi-size ICO from logo-master.svg.`);
