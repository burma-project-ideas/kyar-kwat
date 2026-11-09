# Implementation plan

Status: Implemented and verified on 2026-11-09. Validation results are in `kyarkwat/README.md`.

## Architecture and constraints

Create `kyarkwat/BlazorWasm.KyarKwat/BlazorWasm.KyarKwat.csproj` targeting `net10.0` with the standard Blazor WebAssembly SDK. Use matching supported 10.0.x WebAssembly and DevServer packages, using patch 10.0.14. `global.json` selects the installed stable 10.0.302 SDK instead of the machine's .NET 11 preview default. The existing `myanmar-astro-horo` app demonstrates this workspace's .NET 10 standalone WASM pattern; do not change that app.

Use C# for the game and computer player, Razor for the UI, and CSS for the responsive board. No game framework, backend, external runtime API, or additional UI dependency. Only the app's own folder is in scope. Do not add deployment configuration until a deployment target is requested.

No `.specify` scaffolding or constitution exists at the workspace root. These feature artifacts live together under `kyarkwat/specs/001-kyarkwat/`. A formal `$speckit-analyze` run requires the missing Spec Kit prerequisites; do not claim it has run.

## Files and responsibilities

Visual handoff: `kyarkwat/design/index.html`, `style.css`, and `design/README.md` define the reviewed board-first design and setup/result flow. Carry the structure/styling into Razor; replace illustrative `prototype.js` fixtures with C# state. The preview toolbar must not ship. The cheese-themed Downloads source was reviewed as input; its rule toggles, engine, undo, hint button, sound and move log are not added to scope.

Use the flat black/neutral layout, green/white counters, Inter with Noto Sans Myanmar glyph coverage, and accessible controls/dialogs. First load opens setup over the initial board. Setup selects mode, opponent and computer level; cancelling preserves active settings. On phones, turn status/board precede secondary information. Results cover zero-piece wins, blocked-side wins and draws.

| Path relative to kyarkwat/ | Responsibility |
|---|---|
| `BlazorWasm.KyarKwat/Models/GameState.cs` | Board, piece/side/mode/difficulty types, active side, draw counter, and result. |
| `BlazorWasm.KyarKwat/Services/GameRules.cs` | Pure move generation, complete capture routes, legal move application, promotion, and result resolution. |
| `BlazorWasm.KyarKwat/Services/ComputerPlayer.cs` | Bounded, cancellable search over the shared rules. |
| `BlazorWasm.KyarKwat/Pages/Home.razor` | Settings, board input, capture-prefix selection, computer lifecycle, status, rules, and restart. |
| `BlazorWasm.KyarKwat/Pages/Home.razor.css` | Board, selection/focus, piece/king rendering, and responsive layout. |
| `BlazorWasm.KyarKwat/Program.cs`, `App.razor`, `_Imports.razor`, `wwwroot/index.html`, `wwwroot/css/app.css` | Minimal application startup, routing, bundled Inter/Noto Sans Myanmar fonts with their SIL licenses, and shell. |
| `tests/KyarKwat.Checks/` | Dependency-free console assertions referencing the game assembly. |
| `README.md` | Run, checks, publish commands, rules decisions, and reference attribution. |

`Pages/Home.razor.cs` keeps interaction/lifecycle code beside the Razor markup. `wwwroot/game-ui.js` is limited to native dialog and keyboard-focus plumbing. `wwwroot/css/fonts.css` loads local fonts; no external font service is required.

Keep small related enums/value types with the state; split only if needed for readability. No persistence DTOs, service abstraction layers, public API, or export package is required.

## Data and rules

Represent the board as 64 squares with empty/side/king state. A move is a complete route containing its start, landings, and captured squares. The UI may select route prefixes, but the engine commits a complete legal turn atomically.

Enumerate captures for every piece, retaining globally longest complete routes. Track captured squares while leaving their occupants as blockers until the route finishes. If no captures exist, generate ordinary moves. Revalidate a requested route against legal routes before applying it; UI hints are not the validation boundary.

After application: remove captured pieces, promote the mover if appropriate, update the draw counter, switch sides, resolve that side's terminal state using the selected mode, then check for a draw. Keep input state separate from committed board state.

## Computer behavior

Use minimax search with alpha-beta pruning. Map Easy / Medium / Hard directly to maximum depths of 1 / 3 / 5 complete turns and node budgets of 500 / 5,000 / 25,000. Medium is the default. Keep these three presets in ComputerPlayer.cs; no configuration subsystem is needed. Search depth counts a full multi-capture as one turn. Count visited nodes consistently and stop at the selected budget, retaining the best fully evaluated root move and a legal fallback. Terminal outcomes outrank heuristic scores. Ordinary-mode evaluation favors material/mobility; reverse-mode evaluation favors shedding material and reaching a winning blocked state. Both modes consume exactly the engine's legal routes.

Yield between bounded search batches in single-threaded WASM. Cancel on restart/disposal and check a game generation token before applying the result. Expose the three levels only for computer play in both ကျားနိုင် and ကျားကုန်. Apply changed settings on New Game. These budgets are initial tuning values and do not imply expert-strength play; adjust only if browser responsiveness checks require it, updating the spec and checks together.

## Delivery phases

1. Scaffold the minimal app and console check project.
2. Implement the shared rules and assertion fixtures before UI integration.
3. Implement computer search and checks for both objectives, all three difficulty presets, and cancellation.
4. Connect the board, settings, Burmese instructions, accessibility, and computer lifecycle.
5. Build, run checks, publish, manually exercise browser scenarios, and document commands/results.

## Validation and risk

Mobile follow-up (2026-11-09): retain the 16px phone gutter for text/controls but let the board span the viewport at widths up to 480px. Hide only visual rank gutters/repeated introductory text, keep accessible square coordinates, and enforce 44px touch-control heights on coarse pointers. CSS locks background scrolling for native dialogs while keeping board pan/pinch gestures available. `tests/mobile-checks.mjs` verifies actual emulated touch events, gestures, complete games and AI setup on local/published sites; physical phones and iOS Safari remain untested.

Rules are the main correctness risk, especially flying-king chains and reverse no-move wins. Use explicit board fixtures rather than reproducing the engine inside tests. Required scenarios are enumerated in tasks.md.

Build and publish validate packaging; browser checks validate rendering, keyboard operation, small-screen fit, and responsive computer/reset behavior. Record unavailable checks rather than treating them as passed. No production user data is stored or migrated.
