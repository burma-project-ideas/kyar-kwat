using BlazorWasm.KyarKwat.Models;

namespace BlazorWasm.KyarKwat.Services;

public sealed record SearchResult(Move? Move, int Nodes, int CompletedDepth);

public static class ComputerPlayer
{
    public static (int Depth, int Nodes) Budget(Difficulty difficulty) => difficulty switch
    {
        Difficulty.Easy => (1, 500),
        Difficulty.Medium => (3, 5_000),
        Difficulty.Hard => (5, 25_000),
        _ => throw new ArgumentOutOfRangeException(nameof(difficulty))
    };

    public static async Task<SearchResult> ChooseAsync(GameState state, Difficulty difficulty, CancellationToken cancellationToken = default)
    {
        var budget = Budget(difficulty);
        cancellationToken.ThrowIfCancellationRequested();
        if (state.Result is not null) return new SearchResult(null, 0, 0);
        var nodes = 0;
        var completedDepth = 0;
        var best = state.LegalMoves[0];
        for (var depth = 1; depth <= budget.Depth; depth++)
        {
            var score = int.MinValue;
            Move? iterationBest = null;
            foreach (var move in state.LegalMoves)
            {
                var value = await Search(GameRules.ApplyLegal(state, move), depth - 1, -2_000_000, 2_000_000, 1);
                if (value is null) return new SearchResult(iterationBest ?? best, nodes, completedDepth);
                if (value > score) { score = value.Value; iterationBest = move; }
            }
            best = iterationBest ?? best;
            completedDepth = depth;
        }
        return new SearchResult(best, nodes, completedDepth);

        async ValueTask<int?> Search(GameState position, int depth, int alpha, int beta, int ply)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (nodes >= budget.Nodes) return null;
            nodes++;
            // A timer yields to browser painting/input; Task.Yield alone can stay in the microtask queue.
            if (nodes % 128 == 0) await Task.Delay(1, cancellationToken);
            if (position.Result is { } result)
                return result.Winner is null ? 0 : result.Winner == state.Turn ? 1_000_000 - ply : -1_000_000 + ply;
            if (depth == 0) return Evaluate(position, state.Turn);
            var maximize = position.Turn == state.Turn;
            var value = maximize ? -2_000_000 : 2_000_000;
            foreach (var move in position.LegalMoves)
            {
                var child = await Search(GameRules.ApplyLegal(position, move), depth - 1, alpha, beta, ply + 1);
                if (child is null) return null;
                value = maximize ? Math.Max(value, child.Value) : Math.Min(value, child.Value);
                if (maximize) alpha = Math.Max(alpha, value); else beta = Math.Min(beta, value);
                if (beta <= alpha) break;
            }
            return value;
        }
    }

    private static int Evaluate(GameState position, Side side)
    {
        var material = 0;
        foreach (var piece in position.Board)
            if (piece is { } counter) material += (counter.Side == side ? 1 : -1) * (counter.King ? 175 : 100);
        var mobility = (position.Turn == side ? 1 : -1) * Math.Min(position.LegalMoves.Count, 30);
        return (position.Mode == GameMode.Reverse ? -1 : 1) * (material + mobility);
    }
}
