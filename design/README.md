# KyarKwat design and flow

Open `index.html` in a browser. This is a clickable flow prototype, not the Blazor game or a working AI. The separate review bar switches illustrative positions. New Game/settings work; selecting a green counter previews selection (a3 shows an opening destination). Destination clicks do not execute moves.

The supplied `Downloads/kyar_kwat_cheese_game/` folder is unchanged. No original scripts/assets or Tailwind/jQuery dependencies were copied. The production stack remains .NET 10 Blazor WASM.

## Source review

Keep the useful jobs: 8×8 board, player counts, active turn, legal destinations, compulsory-capture notice, new game, and result.

Problems found in the source and actual desktop/mobile screenshots:

- At 390px, settings/rules fill the first screen and push the board below the fold. Fixed board widths also risk overflow on smaller phones.
- Cheese names/emojis, gold frames, gradients, glowing markers, and nested shadowed cards obscure Burmese game terminology and compete with the board.
- Rule toggles allow disabling compulsory capture/flying kings mid-game, conflicting with the agreed fixed rules.
- The engine supports normal play and one heuristic computer policy, with no reverse mode or three-level selector.
- It generates individual jumps rather than globally longest complete routes, and removes captured pieces immediately rather than keeping the specified blockers. Do not port these behaviors unchecked.
- Computer callbacks are not cancelled on reset. A result opens a modal without a separate finished-state guard on board input.

The three main improvements: board-first phone layout; one setup flow explaining each objective; flat surfaces/plain counters so selection and capture states remain clear.

## Art direction

Skill: `design-taste-frontend`. **True-black flat**, seed **211818112**; chosen over Data terminal because a physical board and few settings suit flat surfaces better than a monitoring interface's line selections.

No redraws. Explicit composition adaptation: omit the dealt Ruled T-frame sidebar, which has no job in a one-destination game. Use the app-screen reference's no-sidebar shell. Retain black/grey elevation, white primary action, Inter, and 20px surfaces. Add Noto Sans Myanmar for Burmese glyph coverage and line height. Green is counter identity, not navigation chrome.

Subject inventory: Burmese name; 8×8 geometry; 12 counters per side; green first; compulsory capture; longest capture chains; stacked king counters; forward moves; opposite win objectives; feeding pieces; three computer levels; shared-device play.

Signature: the board's two-ring counter silhouette, Burmese `က` king mark, and the selected mode's exact winning objective. The initial four-square wordmark has been replaced by the shared Jump K counter from `../BlazorWasm.KyarKwat/wwwroot/branding/`; the prototype uses the same asset as the app. No stock imagery is needed.

## Screen questions and flow

| Screen/state | First question | Answer/action |
|---|---|---|
| Board | Whose turn and which game? | Dominant board, framing player counts, active turn beside it on desktop/above on phones. |
| Setup | What game do I want? | ကျားနိုင် / ကျားကုန် → computer/local → Easy/Medium/Hard for computer → Start. |
| Capture | What must I do? | Compulsory notice, selected counter ring, landing dot. |
| Thinking | Can I move now? | Computer/level status and disabled board. Local preview shows the white player's turn instead. |
| Win | Who won and why? | Explicit zero-piece or no-legal-move explanation, accurate remaining count, replay/board review. |
| Draw | Why did play end? | King-only move threshold explanation and replay. |
| Rules | How do the modes work? | Both objectives, Feed, movement, compulsory/maximum capture, kings and draw. |

Settings open with active values. Edits apply only on Start. Cancel/Escape preserves the match; reopening restores active settings. Start replaces the previous match, with that consequence written beside the action. Replay keeps settings. Closing a result returns to the locked board.

The prototype initially shows the board for visual review. Production first load should open the same setup dialog over the initial board; New Game reuses it. No separate landing screen or wizard.

Grid: 944px canvas = 520px play region + 14px gap + 410px information region. At 900px and below, turn status precedes the board; secondary settings/rules follow it. Phone margins are 16px. No navigation rail or sticky overlay covers the board.

## Accessibility and implementation handoff

Native dialogs contain focus, support Escape and return focus. Radio groups have legends; controls have visible focus; squares are labelled native buttons; status uses a polite live region. Counter identity, king mark, selected ring, and destination dot provide shape cues. No looping animation is used.

Positions are literal review fixtures, not game-engine output. All repeated counts derive from those fixtures. The preview picker must not ship. Carry structure/CSS into Razor and replace `prototype.js` with C# state and shared rules, rather than maintaining a second game engine. Production rule checks in tasks.md remain required.

Google Fonts supply Inter/Noto Sans Myanmar with system fallbacks. Decide whether to bundle fonts during production work. No image/icon package, generated media, paid assets or runtime dependency was added.

## Validation

| Check | Supplied design | Redesign |
|---|---|---|
| Browser inspector | 5 FAIL / 7 WARN at 1440, 768, 390px | 0 FAIL / 0 WARN at 1440, 768, 390, 360px |
| Source lint | Not recorded | 0 FAIL / 0 WARN |
| Flow checks | Not run | 137 assertions covering six computer mode/level combinations, local settings, counts, cancellation, previews, replay and rules |
| Additional checks | Not run | Escape, four-width setup fit/page overflow, no browser exceptions |

Visually reviewed desktop/tablet/phone, setup, capture and reverse-mode results. A second pass reduced desktop board size so both players fit at 900px height, and corrected phone margins. No inspector allowances. The inspector's 360px fold uses its fallback height; use the flow snapshots for 360×844 dialog inspection.

Sample data to replace: all `prototype.js` board fixtures, thinking/draw states and results. Levels change labels only here. Full gameplay, real AI strength/performance, a complete keyboard-play session, and screen-reader behavior have not been validated.

Run from `kyarkwat/`, using Node 22+ and Chrome/Edge:

```powershell
$tasteSkill = '<path-to-design-taste-frontend>'
node "$tasteSkill/scripts/lint.mjs" --app design
node "$tasteSkill/scripts/inspect.mjs" --app design/index.html --out .taste-skill/after --widths 1440,768,390,360
node .taste-skill/check-flow.mjs "$tasteSkill"
```

Evidence: `../.taste-skill/before/`, `../.taste-skill/after/`, and `../.taste-skill/flow/`.
