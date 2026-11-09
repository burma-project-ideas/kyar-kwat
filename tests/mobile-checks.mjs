import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

assert(process.argv[2], 'Pass the design skill directory.');
const { Browser, sleep } = await import(pathToFileURL(join(resolve(process.argv[2]), 'scripts/lib/cdp.mjs')));
const browser = await Browser.launch();
const output = resolve('.taste-skill/mobile-after');
mkdirSync(output, { recursive: true });
let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
try {
  const page = await browser.newPage({ width: 390, height: 844, mobile: true });
  await page.goto(process.argv[3] || 'http://127.0.0.1:5281');
  const wait = async (predicate, arg, timeout = 60000) => {
    const start = Date.now();
    while (!await page.eval(predicate, arg)) {
      if (Date.now() - start > timeout) throw new Error(`Timeout: ${predicate} ${JSON.stringify(arg)}`);
      await sleep(40);
    }
  };
  const settleScroll = async () => {
    let previous, stable = 0;
    for (let attempt = 0; attempt < 80 && stable < 4; attempt++) {
      const current = await page.eval(() => JSON.stringify([scrollX, scrollY, ...[...document.querySelectorAll('dialog[open]')].map(el => el.scrollTop)]));
      stable = current === previous ? stable + 1 : 0;
      previous = current;
      await sleep(50);
    }
  };
  const tap = async (selector, corner = false) => {
    await page.eval(selector => document.querySelector(selector)?.scrollIntoView({ block: 'center', inline: 'nearest' }), selector);
    await settleScroll();
    const point = await page.eval(({ selector, corner }) => {
      const el = document.querySelector(selector);
      if (!el || el.disabled) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + (corner ? 3 : r.width / 2), y: r.top + (corner ? 3 : r.height / 2) };
    }, { selector, corner });
    check(point && point.x >= 0 && point.y >= 0, `reachable touch ${selector}`);
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, radiusX: 5, radiusY: 5, force: 1, id: 1 }] });
    await sleep(25);
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(50);
  };
  const swipe = async (x, fromY, toY) => {
    for (let step = 0; step <= 8; step++) {
      await page.send('Input.dispatchTouchEvent', { type: step ? 'touchMove' : 'touchStart', touchPoints: [{ x, y: fromY + (toY - fromY) * step / 8, id: 1, radiusX: 5, radiusY: 5 }] });
      await sleep(25);
    }
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settleScroll();
  };
  const signature = () => [...document.querySelectorAll('#board button')].map(el => {
    const piece = el.querySelector('.counter'); if (!piece) return '.';
    const letter = piece.classList.contains('green') ? 'g' : 'w';
    return piece.querySelector('.king-letter') ? letter.toUpperCase() : letter;
  }).join('');
  const setup = async () => {
    if (!await page.eval(() => document.querySelector('#setup-dialog').open)) await tap('#new-game');
    await wait(() => document.querySelector('#setup-dialog').open);
  };
  const start = async (mode, opponent = 'local', level = 'Medium') => {
    await setup();
    await tap(`label:has(input[name="mode"][value="${mode}"])`);
    await tap(`label:has(input[name="opponent"][value="${opponent}"])`);
    if (opponent === 'computer') await tap(`label:has(input[name="level"][value="${level}"])`);
    await tap('#setup-form button[type="submit"]');
    await wait(() => !document.querySelector('#setup-dialog').open);
    check(await page.eval(mode => document.querySelector('#mode-title').textContent === (mode === 'Normal' ? 'ကျားနိုင်' : 'ကျားကုန်'), mode), 'touch selected mode');
  };
  await wait(() => !!document.querySelector('#setup-dialog')?.open);
  const metrics = [];
  for (const [width, height] of [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [844, 390]]) {
    await page.setViewport({ width, height, mobile: true });
    await setup();
    check(await page.eval(() => [...document.querySelectorAll('#setup-dialog .segmented label')].every(el => el.getBoundingClientRect().height >= 44)), 'setup touch targets at least 44px');
    const lockedAt = await page.eval(() => scrollY);
    await swipe(3, Math.min(height - 40, 500), 100);
    check(await page.eval(() => scrollY) === lockedAt, 'modal backdrop cannot scroll game');
    const needsScroll = await page.eval(() => { const d = document.querySelector('#setup-dialog'); d.scrollTop = 0; return d.scrollHeight > d.clientHeight + 2; });
    if (needsScroll) {
      await swipe(width / 2, height * .72, height * .3);
      check(await page.eval(() => document.querySelector('#setup-dialog').scrollTop > 0), 'short-screen dialog scrolls with touch');
    }
    await page.screenshot({ path: join(output, `setup-${width}x${height}.jpg`) });
    await start('Normal');
    const measured = await page.eval(() => {
      const r = el => { const b = el.getBoundingClientRect(); return { x: b.x, width: b.width, height: b.height }; };
      return { width: innerWidth, height: innerHeight, board: r(document.querySelector('#board')), cell: r(document.querySelector('[data-index="40"]')), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    metrics.push(measured);
    check(!measured.overflow, `no overflow ${width}x${height}`);
    check(measured.cell.width >= (width === 320 ? 40 : 44), `board touch size ${width}`);
    if (width <= 480) check(measured.board.width >= width - 1 && measured.board.x === 0, 'phone board uses full width');
    await page.eval(() => scrollTo(0, 0));
    await page.screenshot({ path: join(output, `board-${width}x${height}.jpg`), fullPage: true });
    await tap('[data-index="40"]', true);
    await wait(() => document.querySelector('[data-index="33"]').classList.contains('destination'));
    await tap('[data-index="33"]', true);
    await wait(() => !!document.querySelector('[data-index="33"] .green'));
    check(await page.eval(() => !document.querySelector('[data-index="40"] .counter')), 'corner taps move whole-square hit target');
    check(await page.eval(() => visualViewport.scale === 1), 'tapping does not zoom');
    console.log(`PASS mobile ${width}x${height}: ${measured.cell.width}px squares, touch move and modal scrolling.`);
  }
  await page.setViewport({ width: 390, height: 844, mobile: true });
  await start('Normal');
  await page.eval(() => scrollTo(0, 0));
  const beforePan = await page.eval(signature);
  const panPoint = await page.eval(() => { const r = document.querySelector('[data-index="32"]').getBoundingClientRect(); return { x: r.x + 10, y: r.y + 10 }; });
  await swipe(panPoint.x, panPoint.y, panPoint.y - 180);
  check(await page.eval(() => scrollY > 0), 'board allows normal vertical swipe');
  check(await page.eval(signature) === beforePan, 'swipe does not make a move');
  check(await page.eval(() => !/user-scalable=no|maximum-scale=1/.test(document.querySelector('meta[name="viewport"]').content)), 'pinch zoom remains available');
  const games = JSON.parse(readFileSync('artifacts/playouts.json', 'utf8'));
  let chains = 0;
  for (const mode of ['Normal', 'Reverse']) {
    await page.setViewport({ width: mode === 'Normal' ? 390 : 360, height: 844, mobile: true });
    await start(mode);
    const game = games.find(g => g.Mode === mode && g.Level === 'Easy');
    for (const move of game.Moves) {
      await tap(`[data-index="${move.From}"]`);
      for (const landing of move.Landings) {
        await wait(index => document.querySelector(`[data-index="${index}"]`).classList.contains('destination'), landing);
        await tap(`[data-index="${landing}"]`);
      }
      if (move.Landings.length > 1) chains++;
      await wait(expected => [...document.querySelectorAll('#board button')].map(el => {
        const piece = el.querySelector('.counter'); if (!piece) return '.';
        const letter = piece.classList.contains('green') ? 'g' : 'w';
        return piece.querySelector('.king-letter') ? letter.toUpperCase() : letter;
      }).join('') === expected, move.Board);
    }
    await wait(() => document.querySelector('#result-dialog').open);
    await page.screenshot({ path: join(output, `result-${mode}.jpg`) });
    await tap('#play-again');
    check(await page.eval(() => document.querySelectorAll('#board .green').length === 12), 'touch replay');
    console.log(`COMPLETE touch ${mode}: ${game.Moves.length} turns.`);
  }
  check(chains > 0, 'touch capture chains exercised');
  for (const mode of ['Normal', 'Reverse']) for (const level of ['Easy', 'Medium', 'Hard']) {
    await start(mode, 'computer', level);
    await tap('[data-index="40"]'); await tap('[data-index="33"]');
    await wait(() => !document.querySelector('[data-index="40"]').disabled);
    check(await page.eval(level => document.querySelector('#summary-level').textContent === level, level), 'touch AI level applied');
  }
  assert.deepEqual(page.consoleErrors, []);
  writeFileSync(join(output, 'metrics.json'), JSON.stringify(metrics, null, 2));
  console.log(`PASS: ${checks} mobile assertions; two complete touch games; all six AI combinations; six viewport sizes.`);
} finally { await browser.close(); }
