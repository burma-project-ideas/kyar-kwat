# Tasks

Status: Completed on 2026-11-09. Verification commands/results and remaining device-testing limitations are recorded in `kyarkwat/README.md`.

All implementation paths are relative to `kyarkwat/`. Execute phases in order. No parallel-agent work is required.

## Phase 0 — Design handoff

- [x] T000 Review the supplied design/flow and produce `design/index.html`, `style.css`, `prototype.js`, and `design/README.md` with both modes, three levels, local settings, rules, capture/thinking/result previews, and responsive layouts. Verify with browser inspection and flow assertions. This does not complete gameplay implementation tasks. [FR-001, FR-008, FR-010, FR-011]

## Phase 1 — Setup

- [x] T001 Create `BlazorWasm.KyarKwat/BlazorWasm.KyarKwat.csproj` and minimal `Program.cs`, `App.razor`, `_Imports.razor`, and `wwwroot/index.html`; target net10.0 and use matching 10.0.x packages. Remove unused template demo content. [FR-001, SC-001]
- [x] T002 Create `tests/KyarKwat.Checks/` as a console assertion runner referencing the app, with a failing assertion producing a nonzero exit code. Confirm it can execute outside the browser. [SC-002]

## Phase 2 — Rules and fixtures

- [x] T003 Add `Models/GameState.cs` with the 64-square board, piece/side/mode/difficulty types, complete move routes, active side, draw counter, and result; initialize 12 pieces per side and green first. Add initial-position and invalid-position checks. [FR-002, SC-002]
- [x] T004 Implement ordinary and flying-king quiet moves and captures in `Services/GameRules.cs`. Assert board edges, occupied destinations, backward ordinary-move/capture rejection, king obstruction, and king landing choices. [FR-003, SC-002]
- [x] T005 Enforce board-wide compulsory capture, globally maximum routes, chain completion, equal-route choices, captured-piece blockers, and no recapture. Assert competing pieces/routes, branching chains, and a king loop blocked by a previously captured piece. [FR-004, SC-002]
- [x] T006 Apply validated complete routes atomically, remove captures, promote only at turn end, and switch sides. Assert illegal routes leave state unchanged and promotion does not continue as a king in the same turn. [FR-002, FR-005, SC-002]
- [x] T007 Resolve zero-piece/zero-move outcomes for both modes before draw checks. Implement the 50-half-turn king-only draw counter/reset. Assert all four mode/terminal combinations, final-piece feeding, blocked-side reverse win, exact draw threshold, reset conditions, and win precedence. [FR-006, FR-009, SC-002]

## Phase 3 — Computer

- [x] T008 Implement `Services/ComputerPlayer.cs` with shared legal routes, bounded minimax/alpha-beta search, mode-aware evaluation, Easy / Medium / Hard depth and node presets (1/3/5 turns; 500/5,000/25,000 nodes), cancellation, periodic yielding, and legal fallback on budget exhaustion. Assert returned routes are legal for all six mode/level combinations, preset budgets/depths are distinct and enforced, immediate winning routes are selected in simple fixtures, no move is returned for terminal positions, and cancellation is honored. [FR-007, FR-011, SC-002, SC-005]

## Phase 4 — Playable interface

- [x] T009 Implement `Pages/Home.razor`: ကျားနိုင် / ကျားကုန် mode settings, opponent settings, Easy / Medium / Hard selector (Medium default; hidden for local play), board, counts, active side, route-prefix hints, results, and New Game. Keep selected settings separate from active rules until restart. Feed is explained as ordinary legal play. [FR-001, FR-002, FR-008, FR-011]
- [x] T010 Connect local turns and computer turns in `Pages/Home.razor`; lock human input during computer work, cancel on reset/disposal, and discard stale results using a game generation token. [FR-007, FR-008, SC-003, SC-005]
- [x] T011 Add Burmese instructions for both modes, king/capture/draw rules, and win reasons. Add accessible square labels, keyboard operation, visible focus, announced status/results, and responsive `Home.razor.css`/`wwwroot/css/app.css`. [FR-001, FR-010, SC-004]

## Phase 5 — Verification and documentation

- [x] T012 Run all console assertions, Release build, and static publish; fix failures and record commands/results in `README.md`. [SC-001, SC-002]
- [x] T013 In a browser, exercise both modes in local play and at each of the three computer levels, capture-chain selection, result locking, mode/level settings applied only on new-game reset, and reset during computer search. Verify no stale move appears and UI remains responsive. Record results and any unperformed checks. [FR-004, FR-006, FR-007, FR-008, FR-009, FR-011, SC-003, SC-005]
- [x] T014 Verify keyboard-only play, visible focus/status announcements, and no horizontal overflow at 360px viewport width. Fix issues and record results. [FR-010, SC-004]
- [x] T015 Finish `README.md` with project purpose, local run/check/publish commands, exact rules/defaults, difficulty presets and computer limitations, and the source reference link. Review spec/plan/task coverage before declaring implementation complete. [FR-001, SC-001, SC-002]

## Deployment follow-up — Requested 2026-11-09

- [x] T016 Prepare hash-verified Vercel Build Output API v3 artifacts with `scripts/Prepare-Vercel.ps1`, create/link the dedicated `kyarkwat` project in the verified account, deploy production, confirm anonymous HTTPS and WASM content type, and run all 1,100 browser assertions/eight complete games against https://kyarkwat.vercel.app. Record deployment and physical-device/log-inspection limits in `README.md`. [FR-001, SC-001, SC-003, SC-004]

- [x] T017 Audit live mobile layouts and touch interactions; enlarge phone cells to full width (40px at 320px, 45px at 360px), compact the header/status, prevent count wrapping, enlarge touch choices, preserve page swipes/pinch zoom, and lock modal background scrolling. Verify 342 real touch-event assertions/two full games and six AI combinations at six sizes locally and on the updated production site, plus 1,100 local regression assertions. Deploy `dpl_6GqDBt4ZafrFxQn64Qs3Vtg8Xms4` and record remaining physical-device limitations. [FR-008, FR-010, SC-003, SC-004]
