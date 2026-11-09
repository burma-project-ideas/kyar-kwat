import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

assert(process.argv[2], 'Pass the design skill directory containing scripts/lib/cdp.mjs.');
const { Browser, sleep } = await import(pathToFileURL(join(resolve(process.argv[2]), 'scripts/lib/cdp.mjs')));
const browser = await Browser.launch();
const output = resolve('.taste-skill/working-game');
mkdirSync(output, { recursive: true });
let assertions = 0;
const check = (condition, message) => { assert(condition, message); assertions++; };
try {
  const page = await browser.newPage();
  await page.goto(process.argv[3] || 'http://127.0.0.1:5280');
  const wait = async (fn, arg, timeout = 30000) => {
    const start = Date.now();
    while (!await page.eval(fn, arg)) {
      if (Date.now() - start > timeout) throw new Error(`Timed out: ${fn.toString()} (${JSON.stringify(arg)})`);
      await sleep(40);
    }
  };
  const click = async selector => {
    check(await page.eval(selector => { const el = document.querySelector(selector); if (!el || el.disabled) return false; el.click(); return true; }, selector), `click ${selector}`);
    await sleep(30);
  };
  const key = async (name, code = name, keyCode) => {
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: keyCode, text: name === 'Enter' ? '\r' : undefined });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: keyCode });
    await sleep(40);
  };
  const signature = () => [...document.querySelectorAll('#board button')].map(el => {
    const piece = el.querySelector('.counter');
    if (!piece) return '.';
    const letter = piece.classList.contains('green') ? 'g' : 'w';
    return piece.querySelector('.king-letter') ? letter.toUpperCase() : letter;
  }).join('');
  const start = async (mode, opponent, level = 'Medium') => {
    if (!await page.eval(() => document.querySelector('#setup-dialog').open)) await click('#new-game');
    await click(`input[name="mode"][value="${mode}"]`);
    await click(`input[name="opponent"][value="${opponent}"]`);
    if (opponent === 'computer') await click(`input[name="level"][value="${level}"]`);
    check(await page.eval(opponent => !!document.querySelector('#difficulty-field') === (opponent === 'computer'), opponent), 'difficulty only for computer');
    await click('#setup-form button[type="submit"]');
    await wait(() => !document.querySelector('#setup-dialog').open);
    check(await page.eval(mode => document.querySelector('#summary-mode').textContent === (mode === 'Normal' ? 'ကျားနိုင်' : 'ကျားကုန်'), mode), 'active mode');
    check(await page.eval(() => document.querySelectorAll('#board .counter.green').length === 12 && document.querySelectorAll('#board .counter.ivory').length === 12), 'initial pieces');
  };

  await wait(() => !!document.querySelector('#setup-dialog')?.open, undefined, 60000);
  check(await page.eval(() => document.querySelector('input[name="level"]:checked').value === 'Medium'), 'medium default');
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewport({ width, height: width === 1440 ? 900 : 844 });
    check(await page.eval(() => document.documentElement.scrollWidth <= innerWidth), `no setup overflow at ${width}`);
    check(await page.eval(() => { const r = document.querySelector('#setup-dialog').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }), `setup fits ${width}`);
    await page.screenshot({ path: join(output, `setup-${width}.jpg`) });
  }
  await start('Normal', 'local');
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewport({ width, height: width === 1440 ? 900 : 844 });
    check(await page.eval(() => document.documentElement.scrollWidth <= innerWidth), `no game overflow at ${width}`);
    await page.screenshot({ path: join(output, `board-${width}.jpg`), fullPage: width === 360 });
  }
  // Start focuses a3. Native Enter, ArrowUp and Enter select and move it to b4.
  check(await page.eval(() => document.activeElement.dataset.index === '40'), 'board receives focus');
  await key('Enter', 'Enter', 13);
  await wait(() => document.querySelector('[data-index="33"]').classList.contains('destination'));
  check(await page.eval(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), 'visible keyboard focus');
  await key('ArrowUp', 'ArrowUp', 38);
  check(await page.eval(() => document.activeElement.dataset.index === '33'), 'arrow navigates playable squares');
  await key('Enter', 'Enter', 13);
  await wait(() => !!document.querySelector('[data-index="33"] .green') && !document.querySelector('[data-index="40"] .counter'));
  check(await page.eval(() => document.querySelector('#turn-title').textContent.includes('အဖြူကျား')), 'keyboard move changes turn');
  const saved = await page.eval(signature);
  await click('#change-settings');
  await click('input[name="mode"][value="Reverse"]');
  await key('Escape', 'Escape', 27);
  await wait(() => !document.querySelector('#setup-dialog').open);
  check(await page.eval(signature) === saved, 'cancel leaves position');
  check(await page.eval(() => document.querySelector('#mode-title').textContent === 'ကျားနိုင်'), 'cancel leaves mode');
  await click('#new-game');
  check(await page.eval(() => document.querySelector('input[name="mode"]:checked').value === 'Normal'), 'reopen restores settings');
  await key('Escape', 'Escape', 27);
  await click('#open-rules');
  await wait(() => document.querySelector('#rules-dialog').open);
  check(await page.eval(() => document.querySelector('#rules-dialog').textContent.includes('Feed')), 'rules include Feed');
  await key('Escape', 'Escape', 27);
  await wait(() => !document.querySelector('#rules-dialog').open);

  // Reset in the middle of a real Hard search, then allow its old continuation to finish.
  await start('Normal', 'computer', 'Hard');
  const resetBoard = await page.eval(signature);
  await click('[data-index="40"]');
  await click('[data-index="33"]');
  await wait(() => document.querySelector('#turn-title').textContent.includes('စဉ်းစား'));
  check(await page.eval(() => [...document.querySelectorAll('#board button')].every(el => el.disabled)), 'thinking locks board');
  await start('Reverse', 'local');
  await sleep(1500);
  check(await page.eval(signature) === resetBoard, 'reset discards stale AI result');

  console.log('PASS: browser setup, four viewports, keyboard move, settings cancellation, rules, and reset during Hard search. Waiting for six native playouts.');
  let games = [];
  const playoutDeadline = Date.now() + 600_000;
  while (games.length < 6 && Date.now() < playoutDeadline) {
    try { games = JSON.parse(readFileSync('artifacts/playouts.json', 'utf8')); } catch { /* Writer may be replacing the file. */ }
    if (games.length < 6) await sleep(500);
  }
  assert.equal(games.length, 6, 'generate all playouts first');
  let sawChain = false, sawKing = false, sawBlocked = false, sawReverseEmpty = false;
  const play = async (game, opponent) => {
    await start(game.Mode, opponent, game.Level);
    for (let i = 0; i < game.Moves.length;) {
      const move = game.Moves[i];
      await click(`[data-index="${move.From}"]`);
      for (let hop = 0; hop < move.Landings.length; hop++) {
        const landing = move.Landings[hop];
        await wait(index => document.querySelector(`[data-index="${index}"]`)?.classList.contains('destination'), landing);
        await click(`[data-index="${landing}"]`);
        if (hop < move.Landings.length - 1) {
          sawChain = true;
          check(await page.eval(() => document.querySelectorAll('.pending-capture').length > 0), 'captured counters retained mid-chain');
        }
      }
      const target = opponent === 'computer' && i + 1 < game.Moves.length ? i + 1 : i;
      await wait(expected => [...document.querySelectorAll('#board button')].map(el => {
        const piece = el.querySelector('.counter'); if (!piece) return '.';
        const letter = piece.classList.contains('green') ? 'g' : 'w';
        return piece.querySelector('.king-letter') ? letter.toUpperCase() : letter;
      }).join('') === expected, game.Moves[target].Board, 60000);
      check(await page.eval(() => +document.querySelector('#human-count').textContent === document.querySelectorAll('#board .green').length && +document.querySelector('#opponent-count').textContent === document.querySelectorAll('#board .ivory').length), 'live counts reconcile');
      sawKing ||= /[GW]/.test(game.Moves[target].Board);
      i = target + 1;
    }
    await wait(() => document.querySelector('#result-dialog').open);
    check(await page.eval(() => [...document.querySelectorAll('#board button')].every(el => el.disabled)), 'finished board locked');
    const reason = await page.eval(() => document.querySelector('#result-reason').textContent);
    check(game.Reason === 'NoMoves' ? reason.includes('ရွှေ့စရာ') : game.Reason === 'Draw' ? reason.includes('သရေ') : reason.includes('ကျား'), 'result reason');
    sawBlocked ||= game.Reason === 'NoMoves';
    sawReverseEmpty ||= game.Mode === 'Reverse' && game.Reason === 'NoPieces';
    await page.screenshot({ path: join(output, `result-${game.Mode}-${opponent}-${game.Level}.jpg`) });
    await click('#result-dialog .close-button');
    check(await page.eval(() => !document.querySelector('#result-dialog').open && [...document.querySelectorAll('#board button')].every(el => el.disabled)), 'review board stays locked');
    await click('#show-result');
    await click('#play-again');
    check(await page.eval(() => !document.querySelector('#result-dialog').open && document.querySelectorAll('#board .green').length === 12), 'replay resets');
    console.log(`COMPLETE browser ${game.Mode}/${opponent}/${game.Level}: ${game.Moves.length} turns, ${game.Reason}`);
  };
  for (const game of games) await play(game, 'computer');
  for (const mode of ['Normal', 'Reverse']) await play(games.find(game => game.Mode === mode && game.Level === 'Easy'), 'local');
  check(sawChain, 'complete capture chain exercised');
  check(sawKing, 'king promotion/rendering exercised');
  check(sawBlocked, 'blocked-side result exercised');
  check(sawReverseEmpty, 'reverse zero-pieces result exercised');
  check(await page.eval(() => getComputedStyle(document.querySelector('#blazor-error-ui')).display === 'none'), 'no fatal Blazor error');
  assert.deepEqual(page.consoleErrors, [], 'no browser exceptions');
  console.log(`PASS: ${assertions} browser assertions, eight complete games, keyboard move, four viewports, reset during search.`);
} finally { await browser.close(); }
