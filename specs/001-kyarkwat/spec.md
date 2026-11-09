# KyarKwat – Traditional Burmese Game

Status: Implemented and verified on 2026-11-09. See `kyarkwat/README.md` for build, native checks, browser checks and published-site results.

## Context and scope

Build a standalone .NET 10 Blazor WebAssembly game in `kyarkwat/`, following the workspace's separate-app folder convention. Reference: https://harryheinthant.site/checker. Use the reference's published playing rules as the baseline, with an original interface and assets.

The user confirmed the name **ကျားကုန် (KyaKone)** and its winning conditions: a player wins when they have no pieces left or no legal moves. “Feed” means offering one's pieces to be captured through ordinary legal moves.

Initial scope: two game modes, **ကျားနိုင်** (normal) and **ကျားကုန်** (reverse), local two-player play, a computer opponent with **Easy / Medium / Hard** levels, Burmese instructions, legal-move hints, and new game. KyarKwat (ကျားကွက်) remains the app name. No accounts, server, online multiplayer, undo, saved games, or separate Feed button.

Local play and computer play are included in the implemented first version. Green moves first; in computer play the human is green. Medium is the default computer level. Difficulty is available in both modes and hidden during local two-player play. The draw rule below makes the reference's wording precise for implementation.

## User stories and acceptance criteria

### US1 — Start and play

Choose ကျားနိုင် or ကျားကုန် and local or computer opponent, then start a game. For a computer opponent, choose Easy, Medium, or Hard.

- A new game has an 8×8 board with 12 pieces per side on playable squares in each side's nearest three rows.
- Selecting a piece shows only legal next destinations. Invalid selection or movement leaves the position unchanged.
- The interface shows the selected mode, whose turn it is, and each side's remaining pieces.
- A keyboard user can select a square and complete the same moves as a pointer user.

### US2 — Play ကျားနိုင်

- Ordinary pieces move one diagonal square forward, and capture forward by jumping an opposing piece onto an empty square.
- Capturing is compulsory across the entire board. When capture routes differ in length, only routes taking the maximum number of pieces are legal; equal routes remain selectable.
- A multi-capture must finish using the same piece before the opponent's turn.
- A piece ending its turn on the far row becomes a king. Promotion does not grant extra captures during that turn.
- Kings move any unobstructed diagonal distance in either direction. Each capture jumps exactly one opposing piece and lands on an empty square beyond it, before any further occupied square.
- A player with no pieces or legal moves loses.

### US3 — Play ကျားကုန်

- Movement, compulsory capture, maximum capture, multi-capture, and promotion follow US2.
- A player with no pieces or legal moves wins, including after the opponent captures their final piece.
- Feed uses an ordinary legal move; it never bypasses compulsory capture or maximum-capture rules.
- The computer pursues the winning objective of the selected mode.

### US4 — Finish and restart

- The result names the winner and reason, or states a draw. Further moves are disabled.
- New Game resets the board, counters, selections, and result using the chosen settings.
- Changing settings during a game requires starting a new game; active rules never change mid-turn.

### US5 — Choose computer difficulty

- Easy, Medium, and Hard are available in both modes, with Medium selected initially.
- Easy searches one completed turn ahead; Medium searches up to three; Hard searches up to five. Initial node budgets are 500 / 5,000 / 25,000 respectively. A completed multi-capture counts as one turn.
- Every level obeys the same rules and uses the selected mode's winning objective. Higher levels increase search effort; they do not guarantee a win.
- Search uses the best fully evaluated root move available when its budget is exhausted, with a legal fallback if no root evaluation finishes.
- A level change takes effect only with New Game. Local two-player games do not use difficulty.

## Functional requirements

| ID | Requirement |
|---|---|
| FR-001 | Provide the standalone .NET 10 Blazor WASM app with Burmese game names and instructions. |
| FR-002 | Initialize the board and handle alternating turns and piece counts as US1 specifies. |
| FR-003 | Generate and validate ordinary and flying-king moves as US2 specifies. |
| FR-004 | Enforce global compulsory capture, maximum capture, and complete capture chains. |
| FR-005 | Apply end-of-turn king promotion. |
| FR-006 | Resolve mode-specific wins for zero pieces and zero legal moves. |
| FR-007 | Support local two-player and human-versus-computer play using the same legal-move engine. |
| FR-008 | Provide selection hints, turn status, results, and new game/settings behavior. |
| FR-009 | Declare a draw after 50 consecutive half-turns consisting only of non-capturing king moves (25 moves each); reset the counter after any capture or ordinary-piece move. |
| FR-011 | Provide Easy / Medium / Hard computer levels in both modes with the behavior in US5. |
| FR-010 | Support keyboard input, visible focus, accessible square/piece labels, announced turns/results, and a board usable on mobile. |

## Edge cases and exact rule decisions

- Evaluate the next player's zero-piece/zero-move terminal state after every completed turn, before the draw threshold. Evaluate the same conditions for a supplied test position before offering moves.
- A capture route counts captured pieces, not kings' value. No extra king-priority tie-break applies.
- Captured pieces are removed after the complete capture turn. While enumerating a chain they remain blockers and cannot be captured again. This prevents flying kings crossing an already captured piece in the same turn.
- Capture hints retain only prefixes of globally maximum-length complete routes. Choosing one jump does not allow abandoning the remaining chain.
- An ordinary piece cannot capture backward. A king may change diagonal direction between captures.
- A blocked opponent gives a normal-mode win to the mover and a reverse-mode win to the blocked opponent.
- Computer work cannot apply a stale move after New Game. Human input is disabled during the computer's turn and after completion.
- Both sides empty is unreachable from a legal game; test-position loading rejects this state. No production position editor is needed.
- No automatic threefold-repetition rule is included in the first version.

## Success criteria

| ID | Buildable acceptance target |
|---|---|
| SC-001 | Release build and static publish succeed for net10.0. |
| SC-002 | Automated checks cover movement, captures, promotion, both modes' terminal states, draws, legal computer moves at all three levels, and distinct depth/node budgets. |
| SC-003 | Both modes can complete a local game and a computer game at each level, show the correct result, and restart without stale state. |
| SC-004 | The board fits a 360px-wide viewport without horizontal scrolling; a complete move is possible with keyboard only. |
| SC-005 | Computer search runs off the UI thread where supported or yields in bounded work batches; uses the selected level's fixed node budget, supports cancellation, and leaves the UI responsive during play/reset. |

## Review notes

User-confirmed: platform, app name, ကျားကုန် / ကျားနိုင် mode names, Easy / Medium / Hard levels, reverse objective, compulsory capture in reverse mode, and no-move win in reverse mode.

Implemented baseline decisions: local/computer scope, remaining baseline rules, captured-piece blockers, exact draw counting, and promotion timing follow this spec and the user-approved implementation plan.
