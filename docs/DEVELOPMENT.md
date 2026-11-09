# KyarKwat — မြန်မာ့ရိုးရာ ကျားကွက်

Standalone .NET 10 Blazor WebAssembly implementing the approved board-first design. Play **ကျားနိုင်** or **ကျားကုန်** against another person on the same device, or against Easy / Medium / Hard computer opponents. State, rules and AI run locally in C#.

## Run

From this folder, use the SDK selected by `global.json` (10.0.302 or a compatible patch):

```powershell
dotnet run --project BlazorWasm.KyarKwat -c Release --urls http://127.0.0.1:5280
```

Open http://127.0.0.1:5280. Setup opens first. Medium is the default; difficulty is hidden for local play. Settings apply only when starting a new game; Cancel/Escape preserves the active position. Replay keeps current settings.

Select a counter and a marked destination. Continue a capture chain with the same counter. Keyboard: Tab to the board, arrow keys to navigate playable squares, Enter/Space to select/move, Home/End for the first/last playable square in a row. Native dialogs contain focus and support Escape.

## Rules

- 8×8 board, 12 counters per side, green first. Ordinary counters move and capture diagonally forward.
- Capturing is compulsory globally. Only complete routes taking the most counters are legal; equal routes remain selectable.
- Complete each capture chain. Captured counters remain blockers until turn end and cannot be captured twice.
- Promote at turn end on the far row. Flying kings move/capture diagonally in both directions, landing on any empty square beyond one enemy before the next occupied square.
- **ကျားနိုင်:** a side with no counters or legal moves loses.
- **ကျားကုန်:** a side with no counters or legal moves wins. Feed is offering a counter through an ordinary legal move; compulsory capture still applies.
- Fifty consecutive non-capturing king half-turns (25 per side) produce a draw. Any capture or ordinary-counter move resets the clock. A win takes precedence. No automatic threefold-repetition rule.

## Computer

| Level | Maximum completed turns ahead | Node budget |
|---|---:|---:|
| Easy | 1 | 500 |
| Medium | 3 | 5,000 |
| Hard | 5 | 25,000 |

Iterative minimax with alpha-beta pruning uses the shared legal engine. Terminal outcomes outrank mode-specific material/mobility scores. Budget exhaustion retains a fully evaluated legal root move, with a legal fallback. A multi-capture is one turn. Search yields to browser input/painting in batches of 128 nodes and supports cancellation; generation checks discard stale reset results.

Levels increase search effort, not guaranteed playing strength or a fixed move time. No opening book, learning service, worker dependency or server API.

## Build and static publish

```powershell
dotnet build BlazorWasm.KyarKwat -c Release
dotnet publish BlazorWasm.KyarKwat -c Release -o artifacts/publish
python -m http.server 5281 --bind 127.0.0.1 --directory artifacts/publish/wwwroot
```

Deploy `artifacts/publish/wwwroot/` over HTTP(S) at the host root. Local-file HTML cannot run WASM correctly. For subdirectory deployment, adjust `<base href="/">`. Vercel deployment uses the prebuilt output described below.

Standard WASM publish succeeds without AOT/native relinking. The SDK prints an optional `wasm-tools` optimization suggestion. Restart a running development server after rebuilding if its static asset manifest is stale.

## Vercel deployment

Prepare the tested static site using PowerShell 7:

```powershell
./scripts/Prepare-Vercel.ps1
```

This publishes the app and produces Vercel Build Output API v3 under `.vercel/output/`, with all static assets in `static/`. It verifies each copied file's hash and the Blazor bootstrap file. Only generated `.vercel/output/` is replaced; the project link in `.vercel/project.json` is preserved. `.vercel/` is ignored by source control.

After authenticating and explicitly linking the intended Vercel account/team/project, verify the link and deploy the prebuilt site:

```powershell
vercel project inspect --non-interactive
vercel deploy --prebuilt --prod
```

No .NET build is required on Vercel.

Live production site: **https://kyarkwat.vercel.app** (deployed 2026-11-09).

- Team/project: `sann-lynn-htuns-projects/kyarkwat`.
- Deployment: `dpl_6GqDBt4ZafrFxQn64Qs3Vtg8Xms4`, state `READY`, production.
- Inspector: https://vercel.com/sann-lynn-htuns-projects/kyarkwat/6GqDBt4ZafrFxQn64Qs3Vtg8Xms4.
- Anonymous HTTP verification returned the game with status 200; the native WASM runtime returned 200 with `application/wasm`. No Vercel login is required on the production alias.
- The initial production release passed all 1,100 browser assertions/eight complete games. The mobile update passed the same 1,100 regression assertions locally; current touch-specific production verification is recorded below.
- This is a local CLI deployment; no Git integration or automatic redeploy was configured.
- This machine could not reach the default API host; the authenticated CLI deployed through a temporary loopback transport to Vercel's reachable `vercel.com/api` endpoint. The adapter is not part of the deployed game, and no authentication tokens were read or printed.
- Vercel request-log inspection returned HTTP 404 through that endpoint; browser checks are the client-error verification. No paid monitoring or drains were enabled.

The Vercel app connector continued to report reauthentication even after reconnecting, so deployment used the existing authenticated CLI account.

## Checks

### Mobile layout and touch follow-up

The phone board now spans the available viewport width, with visual rank gutters removed only on phones (coordinate labels remain in each square's accessible name). Repeated introductory/first-move text is omitted above the board on phones; both mode objectives remain in setup and the rules below the board. The compact turn strip keeps play nearer the top.

| Portrait width | Previous square | Updated square |
|---|---:|---:|
| 320px | 31px | 40px |
| 360px | 36px | 45px |
| 375px | 37.875px | 46.875px |
| 390px | 39.75px | 48.75px |
| 414px | 42.75px | 51.75px |

Whole squares accept taps, not just the counter/destination dot. Touch controls and segmented choices have a 44px minimum height, including landscape/coarse-pointer devices. Counts no longer wrap. Board gestures allow vertical scrolling and pinch zoom while avoiding text selection and double-tap zoom. Open dialogs lock background scrolling and remain independently scrollable on short screens.

Run actual Chromium touch-event checks against a local or live URL:

```powershell
node tests/mobile-checks.mjs "$tasteSkill" https://kyarkwat.vercel.app
```

This covers six viewport sizes (320×568, 360×640, 375×667, 390×844, 414×896, 844×390), square-corner taps, modal/backdrop swipes, page swipes, both complete local games with capture chains, replay, and opening moves against all six mode/AI combinations. Evidence is in `.taste-skill/mobile-before/`, `.taste-skill/mobile-after/` and `.taste-skill/mobile-layout/`. This is touch emulation, not a physical iOS/Android device test.

Verified on 2026-11-09 against both the local published build and the updated live production alias: **342 mobile assertions**, two complete touch games (47/41 turns), and all six mode/AI combinations passed with no browser exceptions. The existing **1,100 regression assertions/eight games** also passed against the updated local build. Layout lint/inspection passed with no findings beyond the existing intentional modal-cover allowance.

The console runner references the actual app assembly and requires no test packages:

```powershell
dotnet run --project tests/KyarKwat.Checks -c Release
dotnet run --project tests/KyarKwat.Checks -c Release -- --playouts
```

The second command also generates six complete initial-board games in `artifacts/playouts.json`. Browser checks drive human moves through the UI and compare actual AI replies and board states with those deterministic routes.

Optional browser tooling needs Node 22+, Chrome/Edge and the existing design skill's dependency-free CDP helper. Start the app/static server and generate playouts first:

```powershell
$tasteSkill = '<path-to-design-taste-frontend>'
node tests/browser-checks.mjs "$tasteSkill" http://127.0.0.1:5281
node "$tasteSkill/scripts/lint.mjs" --app BlazorWasm.KyarKwat/Pages/Home.razor.css BlazorWasm.KyarKwat/wwwroot/css/app.css
node "$tasteSkill/scripts/inspect.mjs" --app http://127.0.0.1:5281 --out .taste-skill/blazor --widths 1440,768,390 --allow covered-text
```

The sole inspector allowance is for the native setup modal intentionally covering/inerting the background heading. No other overlaps or style checks are exempted.

## Verified on 2026-11-09

- Release build: zero warnings/errors. Static publish succeeded.
- **100 native assertions**: input validation, longest capture branches, captured-counter blockers, promotion timing, both sides' mode-specific terminal states, draw threshold/precedence, cancellation, and exact 25,000-node budget exhaustion with a legal result.
- Six complete native initial-board playouts, in addition to tactical/endgame fixtures:

| Mode | Level | Half-turns | Result |
|---|---|---:|---|
| ကျားနိုင် | Easy | 47 | Green wins; ivory has no counters |
| ကျားနိုင် | Medium | 44 | Ivory wins; green has no moves |
| ကျားနိုင် | Hard | 107 | Draw |
| ကျားကုန် | Easy | 41 | Ivory wins with no counters |
| ကျားကုန် | Medium | 57 | Ivory wins with no counters |
| ကျားကုန် | Hard | 130 | Draw |

- **1,100 browser assertions** against both the Release development server and published static site: all six computer games plus both local modes, eight full games per run.
- Browser checks exercise chains, retained captured counters, king rendering, counts, result/input locking, review/replay, keyboard movement, settings cancellation and reset during real Hard search.
- Setup fits/no horizontal overflow at 1440, 768, 390 and 360px. No browser exceptions/fatal Blazor errors.
- Style lint and rendered inspector: zero failures/warnings with the modal allowance. Screenshots: `.taste-skill/working-game/`; inspector: `.taste-skill/blazor/`.

Not tested on physical phones or with a screen reader. Real-device performance can differ from desktop viewport emulation.

## Files and attribution

`BlazorWasm.KyarKwat/Models/GameState.cs` holds immutable snapshots, moves and results. `Services/GameRules.cs` validates/generates/applies routes; `ComputerPlayer.cs` searches them. `Pages/Home.razor`, code-behind and scoped CSS implement interaction/lifecycle and the approved design. `wwwroot/game-ui.js` only handles native dialogs/focus; no JavaScript rules or prototype fixtures ship.

`specs/001-kyarkwat/` contains the implementation documents; `design/` retains the approved prototype for reference.

Rule reference: https://harryheinthant.site/checker. The supplied cheese-themed Downloads folder was reviewed for flow, with no code/assets copied into the app. The SVG mark and CSS counters are original to the approved design.

Inter and Noto Sans Myanmar are bundled locally under SIL Open Font Licenses in `wwwroot/fonts/`. Sources: [Google Fonts Inter](https://github.com/google/fonts/tree/main/ofl/inter) and [Noto Sans Myanmar](https://github.com/google/fonts/tree/main/ofl/notosansmyanmar). The production app makes no external font requests.
