using BlazorWasm.KyarKwat.Models;
using BlazorWasm.KyarKwat.Services;

var checks = 0;
void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
    checks++;
}
void Throws<T>(Action action, string message) where T : Exception
{
    try { action(); } catch (T) { checks++; return; }
    throw new Exception(message);
}
GameState Position(Side turn, GameMode mode, int quiet, params (int Square, Side Side, bool King)[] pieces)
{
    var board = new Piece?[64];
    foreach (var (square, side, king) in pieces) board[square] = new Piece(side, king);
    return GameRules.CreatePosition(board, turn, mode, quiet);
}
GameState Normal(params (int Square, Side Side, bool King)[] pieces) => Position(Side.Green, GameMode.Normal, 0, pieces);
const Side G = Side.Green, W = Side.Ivory;

var initial = GameRules.NewGame();
Check(initial.Count(G) == 12 && initial.Count(W) == 12 && initial.Turn == G, "initial board");
Check(initial.LegalMoves.Count == 7 && initial.Result is null, "seven opening turns");
Check(initial.Board.Select((piece, i) => piece is null || GameRules.Playable(i)).All(x => x), "playable starting squares");
Throws<ArgumentException>(() => GameRules.CreatePosition(new Piece?[63], G, GameMode.Normal), "board size");
Throws<ArgumentException>(() => GameRules.CreatePosition(new Piece?[64], G, GameMode.Normal), "both empty rejected");
Throws<ArgumentException>(() => Normal((0, G, false)), "light square rejected");
Throws<ArgumentException>(() => Position((Side)9, GameMode.Normal, 0, (1, G, false)), "invalid side rejected");
Throws<ArgumentException>(() => Position(G, (GameMode)9, 0, (1, G, false)), "invalid mode rejected");
Throws<ArgumentException>(() => Position(G, GameMode.Normal, 51, (1, G, false)), "invalid draw counter");
var source = initial.Board.ToArray();
var independent = GameRules.CreatePosition(source, G, GameMode.Normal);
source[40] = null;
Check(independent.Count(G) == 12, "input board copied");

var ordinary = Normal((26, G, false), (35, W, false), (1, W, false));
Check(ordinary.LegalMoves.All(m => m.Captures.Count == 0 && m.To / 8 == 2), "ordinary cannot move or capture backward");
var white = Position(W, GameMode.Normal, 0, (19, W, false), (56, G, false));
Check(white.LegalMoves.All(m => m.To is 26 or 28), "ivory forward direction");
var edge = Normal((40, G, false), (1, W, false));
Check(edge.LegalMoves.Count == 1 && edge.LegalMoves[0].To == 33, "no wraparound at board edge");
var blockedDestination = Normal((40, G, false), (33, G, false), (1, W, false));
Check(blockedDestination.LegalMoves.All(m => m.From != 40), "friendly piece obstructs move");

var maximum = Normal((40, G, false), (58, G, false), (33, W, false), (19, W, false), (51, W, false));
Check(maximum.LegalMoves.All(m => m.From == 40 && m.Captures.Count == 2), "maximum is global across pieces");
Check(maximum.LegalMoves[0].Landings.SequenceEqual(new[] { 26, 12 }), "complete forward chain");
var branched = Normal((42, G, false), (33, W, false), (17, W, false), (35, W, false));
Check(branched.LegalMoves.Count == 1 && branched.LegalMoves[0].Landings.SequenceEqual(new[] { 24, 10 }), "shorter capture branch excluded");
var ties = Normal((42, G, false), (33, W, false), (35, W, false));
Check(ties.LegalMoves.Count == 2 && ties.LegalMoves.All(m => m.Captures.Count == 1), "equal maximum branches available");
var before = maximum.Board.ToArray();
Throws<InvalidOperationException>(() => GameRules.Apply(maximum, new Move(40, new[] { 26 }, new[] { 33 })), "cannot stop chain early");
Throws<InvalidOperationException>(() => GameRules.Apply(maximum, new Move(58, new[] { 44 }, new[] { 51 })), "cannot select shorter capture");
Throws<InvalidOperationException>(() => GameRules.Apply(maximum, new Move(58, new[] { 49 }, Array.Empty<int>())), "cannot bypass compulsory capture");
Check(before.SequenceEqual(maximum.Board), "illegal requests leave state unchanged");
var afterChain = GameRules.Apply(maximum, maximum.LegalMoves[0]);
Check(afterChain.Count(W) == 1 && afterChain.Board[12]?.Side == G && afterChain.Turn == W, "atomic capture application");
Check(before.SequenceEqual(maximum.Board), "legal application also preserves old snapshot");

var king = Normal((35, G, true), (1, W, false));
Check(king.LegalMoves.Any(m => m.To == 7) && king.LegalMoves.Any(m => m.To == 56), "king flies forward and backward");
var kingCapture = Normal((42, G, true), (28, W, false), (1, W, false));
Check(kingCapture.LegalMoves.Select(m => m.To).Order().SequenceEqual(new[] { 7, 14, 21 }), "flying capture landing choices");
var obstruction = Normal((42, G, true), (35, G, false), (28, W, false));
Check(obstruction.LegalMoves.Where(m => m.From == 42).All(m => !m.Landings.Contains(21)), "king cannot cross own counter");
var adjacentEnemies = Normal((42, G, true), (35, W, false), (28, W, false));
Check(adjacentEnemies.LegalMoves.All(m => m.Captures.Count == 0), "king cannot jump two adjacent enemies");
var capturedBlockers = Normal((35, G, true), (28, W, false), (42, W, false));
Check(capturedBlockers.LegalMoves.All(m => m.Captures.Count == 1), "captured counters block reverse crossing");
Check(capturedBlockers.LegalMoves.All(m => m.Captures.Distinct().Count() == m.Captures.Count), "no recapture");
var changingDirection = Normal((49, G, true), (42, W, false), (28, W, false), (12, W, false));
Check(changingDirection.LegalMoves.All(m => m.Captures.Count == 3), "king changes direction during chain");

var promotion = Normal((10, G, false), (8, W, false));
Check(GameRules.Apply(promotion, promotion.LegalMoves.First(m => m.To == 1)).Board[1]?.King == true, "quiet promotion");
var promotionCapture = Normal((17, G, false), (10, W, false), (12, W, false));
Check(promotionCapture.LegalMoves.Count == 1 && promotionCapture.LegalMoves[0].Captures.Count == 1, "no mid-chain promotion capture backward");
Check(GameRules.Apply(promotionCapture, promotionCapture.LegalMoves[0]).Board[3]?.King == true, "promotion at capture turn end");

foreach (var mode in Enum.GetValues<GameMode>())
{
    var emptyGreen = Position(G, mode, 0, (1, W, false));
    Check(emptyGreen.Result == new GameResult(mode == GameMode.Reverse ? G : W, ResultReason.NoPieces), $"{mode} empty side outcome");
    var stuckGreen = Position(G, mode, 0, (1, G, false), (56, W, false));
    Check(stuckGreen.Result == new GameResult(mode == GameMode.Reverse ? G : W, ResultReason.NoMoves), $"{mode} blocked side outcome");
    var stuckWhite = Position(W, mode, 0, (1, G, false), (56, W, false));
    Check(stuckWhite.Result == new GameResult(mode == GameMode.Reverse ? W : G, ResultReason.NoMoves), $"{mode} ivory blocked outcome");
    var finalCapture = Position(G, mode, 0, (17, G, false), (10, W, false));
    var end = GameRules.Apply(finalCapture, finalCapture.LegalMoves[0]);
    Check(end.Result == new GameResult(mode == GameMode.Reverse ? W : G, ResultReason.NoPieces), $"{mode} final capture winner");
    Check(end.LegalMoves.Count == 0, "finished positions have no playable moves");
    Throws<InvalidOperationException>(() => GameRules.Apply(end, finalCapture.LegalMoves[0]), "finished game rejects moves");
}

var at49 = Position(G, GameMode.Normal, 49, (58, G, true), (1, W, true));
Check(at49.Result is null, "no draw before threshold");
var drawn = GameRules.Apply(at49, at49.LegalMoves.First(m => m.To == 49));
Check(drawn.Result == new GameResult(null, ResultReason.Draw) && drawn.QuietKingTurns == 50, "exact 50-turn draw");
var pawnReset = Position(G, GameMode.Normal, 49, (40, G, false), (1, W, true));
Check(GameRules.Apply(pawnReset, pawnReset.LegalMoves.First(m => m.To == 33)).QuietKingTurns == 0, "ordinary move resets draw clock");
var captureReset = Position(G, GameMode.Normal, 49, (42, G, true), (33, W, false), (7, W, true));
Check(GameRules.Apply(captureReset, captureReset.LegalMoves.First(m => m.To == 24)).QuietKingTurns == 0, "capture resets draw clock");
var winBeforeDraw = Position(G, GameMode.Normal, 49, (58, G, true), (56, W, false));
Check(GameRules.Apply(winBeforeDraw, winBeforeDraw.LegalMoves.First(m => m.To == 51)).Result == new GameResult(G, ResultReason.NoMoves), "win has precedence over draw");

Check(ComputerPlayer.Budget(Difficulty.Easy) == (1, 500), "easy budget");
Check(ComputerPlayer.Budget(Difficulty.Medium) == (3, 5_000), "medium budget");
Check(ComputerPlayer.Budget(Difficulty.Hard) == (5, 25_000), "hard budget");
var crowdedKings = Normal((56, G, true), (58, G, true), (60, G, true), (62, G, true), (1, W, true), (3, W, true), (5, W, true), (7, W, true));
var limited = await ComputerPlayer.ChooseAsync(crowdedKings, Difficulty.Hard);
Check(limited.Nodes == 25_000, "hard stops at exact exhausted node budget");
Check(limited.Move is not null && crowdedKings.LegalMoves.Contains(limited.Move), "budget exhaustion retains a legal evaluated move");
foreach (var mode in Enum.GetValues<GameMode>())
foreach (var level in Enum.GetValues<Difficulty>())
{
    var opening = GameRules.NewGame(mode);
    var watch = System.Diagnostics.Stopwatch.StartNew();
    var chosen = await ComputerPlayer.ChooseAsync(opening, level);
    Check(chosen.Move is not null && opening.LegalMoves.Contains(chosen.Move), $"{mode}/{level} legal opening");
    Check(chosen.Nodes <= ComputerPlayer.Budget(level).Nodes && chosen.Nodes > 0, "node budget enforced");
    Check(chosen.CompletedDepth > 0 && chosen.CompletedDepth <= ComputerPlayer.Budget(level).Depth, "depth bound enforced");
    Console.WriteLine($"{mode}/{level}: {chosen.Nodes} nodes, depth {chosen.CompletedDepth}, {watch.ElapsedMilliseconds}ms");
    var terminal = Position(G, mode, 0, (1, W, false));
    Check((await ComputerPlayer.ChooseAsync(terminal, level)).Move is null, "terminal search returns no move");
    var winning = Normal((17, G, false), (10, W, false));
    var immediate = await ComputerPlayer.ChooseAsync(winning, level);
    Check(GameRules.Apply(winning, immediate.Move!).Result?.Winner == G, "AI chooses immediate normal win");
    var feed = Position(G, GameMode.Reverse, 0, (24, G, false), (10, W, false));
    var fed = GameRules.Apply(feed, (await ComputerPlayer.ChooseAsync(feed, level)).Move!);
    var eaten = GameRules.Apply(fed, (await ComputerPlayer.ChooseAsync(fed, level)).Move!);
    Check(eaten.Result == new GameResult(G, ResultReason.NoPieces), "reverse feed produces green winner");
}
using (var cancelled = new CancellationTokenSource())
{
    cancelled.Cancel();
    try { await ComputerPlayer.ChooseAsync(initial, Difficulty.Hard, cancelled.Token); throw new Exception("cancel ignored"); }
    catch (OperationCanceledException) { checks++; }
}
using (var cancelled = new CancellationTokenSource())
{
    var work = ComputerPlayer.ChooseAsync(initial, Difficulty.Hard, cancelled.Token);
    cancelled.Cancel();
    try { await work; throw new Exception("in-flight cancel ignored"); }
    catch (OperationCanceledException) { checks++; }
}

// Deterministic legal playouts exercise complete games, including both objectives and every AI preset.
foreach (var mode in Enum.GetValues<GameMode>())
foreach (var level in Enum.GetValues<Difficulty>())
{
    var state = Position(G, mode, 0, (24, G, false), (10, W, false));
    var turns = 0;
    while (state.Result is null && turns++ < 20)
    {
        var move = (await ComputerPlayer.ChooseAsync(state, level)).Move!;
        state = GameRules.Apply(state, move);
    }
    Check(state.Result is not null && turns <= 20, $"complete {mode}/{level} endgame");
}
Console.WriteLine($"PASS: {checks} assertions.");

if (args.Contains("--playouts"))
{
    var games = new List<object>();
    string Signature(GameState state) => string.Concat(state.Board.Select(piece => piece is not { } p ? '.' : p.Side == G ? p.King ? 'G' : 'g' : p.King ? 'W' : 'w'));
    foreach (var mode in Enum.GetValues<GameMode>())
    foreach (var level in Enum.GetValues<Difficulty>())
    {
        var state = GameRules.NewGame(mode);
        var moves = new List<object>();
        var elapsed = System.Diagnostics.Stopwatch.StartNew();
        while (state.Result is null && moves.Count < 400)
        {
            var answer = await ComputerPlayer.ChooseAsync(state, level);
            var move = answer.Move!;
            state = GameRules.Apply(state, move);
            moves.Add(new { move.From, move.Landings, move.Captures, Board = Signature(state), Turn = state.Turn.ToString() });
            if (moves.Count % 20 == 0) Console.WriteLine($"Playout {mode}/{level}: {moves.Count} turns, {elapsed.Elapsed.TotalSeconds:F0}s");
        }
        Check(state.Result is not null, $"full initial-board game completes: {mode}/{level}");
        games.Add(new { Mode = mode.ToString(), Level = level.ToString(), Moves = moves, Winner = state.Result!.Winner?.ToString(), Reason = state.Result.Reason.ToString() });
        Directory.CreateDirectory("artifacts");
        await File.WriteAllTextAsync("artifacts/playouts.json", System.Text.Json.JsonSerializer.Serialize(games));
        Console.WriteLine($"COMPLETE {mode}/{level}: {moves.Count} turns, {state.Result}, {elapsed.Elapsed.TotalSeconds:F1}s");
    }
    Console.WriteLine($"PASS: {checks} assertions including six complete initial-board games.");
}
