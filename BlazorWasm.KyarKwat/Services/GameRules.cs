using BlazorWasm.KyarKwat.Models;

namespace BlazorWasm.KyarKwat.Services;

public static class GameRules
{
    private static readonly (int Row, int Col)[] Directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)];
    public static Side Other(Side side) => side == Side.Green ? Side.Ivory : Side.Green;
    public static bool Playable(int square) => square is >= 0 and < 64 && (square / 8 + square % 8) % 2 == 1;

    public static GameState NewGame(GameMode mode = GameMode.Normal)
    {
        var board = new Piece?[64];
        for (var square = 0; square < 64; square++)
            if (Playable(square) && (square / 8 < 3 || square / 8 > 4))
                board[square] = new Piece(square / 8 < 3 ? Side.Ivory : Side.Green);
        return CreatePosition(board, Side.Green, mode);
    }

    public static GameState CreatePosition(Piece?[] board, Side turn, GameMode mode, int quietKingTurns = 0)
    {
        ArgumentNullException.ThrowIfNull(board);
        if (board.Length != 64 || !Enum.IsDefined(turn) || !Enum.IsDefined(mode) || quietKingTurns is < 0 or > 50)
            throw new ArgumentException("Invalid board, side, mode or draw counter.");
        for (var square = 0; square < 64; square++)
            if (board[square] is { } piece && (!Playable(square) || !Enum.IsDefined(piece.Side)))
                throw new ArgumentException("Pieces must occupy playable squares and belong to a valid side.");
        if (!board.Any(piece => piece is not null) || board.Count(piece => piece?.Side == Side.Green) > 12 || board.Count(piece => piece?.Side == Side.Ivory) > 12)
            throw new ArgumentException("A position must have pieces and at most twelve per side.");
        return Build((Piece?[])board.Clone(), turn, mode, quietKingTurns);
    }

    public static GameState Apply(GameState state, Move requested)
    {
        ArgumentNullException.ThrowIfNull(requested);
        var legal = state.LegalMoves.FirstOrDefault(move => move.From == requested.From && move.Landings.SequenceEqual(requested.Landings) && move.Captures.SequenceEqual(requested.Captures));
        if (state.Result is not null || legal is null)
            throw new InvalidOperationException("The requested complete turn is not legal.");
        return ApplyLegal(state, legal);
    }

    internal static GameState ApplyLegal(GameState state, Move move)
    {
        var board = state.Board.ToArray();
        var piece = board[move.From]!.Value;
        board[move.From] = null;
        foreach (var captured in move.Captures) board[captured] = null;
        var farRow = piece.Side == Side.Green ? 0 : 7;
        board[move.To] = piece with { King = piece.King || move.To / 8 == farRow };
        var quiet = piece.King && move.Captures.Count == 0 ? state.QuietKingTurns + 1 : 0;
        return Build(board, Other(state.Turn), state.Mode, quiet);
    }

    private static GameState Build(Piece?[] board, Side turn, GameMode mode, int quiet)
    {
        var state = new GameState(board, turn, mode, quiet);
        var empty = state.Count(turn) == 0;
        var moves = empty ? [] : Generate(board, turn);
        if (empty || moves.Count == 0)
            state.Result = new GameResult(mode == GameMode.Reverse ? turn : Other(turn), empty ? ResultReason.NoPieces : ResultReason.NoMoves);
        else if (quiet >= 50)
            state.Result = new GameResult(null, ResultReason.Draw);
        else
            state.LegalMoves = moves.AsReadOnly();
        return state;
    }

    private static List<Move> Generate(Piece?[] position, Side turn)
    {
        var board = (Piece?[])position.Clone();
        var captures = new List<Move>();
        var captured = new bool[64];
        var landings = new List<int>();
        var taken = new List<int>();
        for (var from = 0; from < 64; from++)
            if (board[from] is { } piece && piece.Side == turn)
                CaptureRoutes(from, from, piece);
        if (captures.Count > 0)
        {
            var maximum = captures.Max(move => move.Captures.Count);
            return captures.Where(move => move.Captures.Count == maximum).ToList();
        }

        var quiet = new List<Move>();
        for (var from = 0; from < 64; from++)
        {
            if (board[from] is not { } piece || piece.Side != turn) continue;
            foreach (var (dr, dc) in Directions)
            {
                if (!Forward(piece, dr)) continue;
                var r = from / 8 + dr;
                var c = from % 8 + dc;
                while (Inside(r, c) && board[r * 8 + c] is null)
                {
                    quiet.Add(new Move(from, Array.AsReadOnly(new[] { r * 8 + c }), Array.Empty<int>()));
                    if (!piece.King) break;
                    r += dr; c += dc;
                }
            }
        }
        return quiet;

        void CaptureRoutes(int origin, int at, Piece piece)
        {
            var continued = false;
            foreach (var (dr, dc) in Directions)
            {
                if (!Forward(piece, dr)) continue;
                var r = at / 8 + dr;
                var c = at % 8 + dc;
                if (piece.King)
                    while (Inside(r, c) && board[r * 8 + c] is null) { r += dr; c += dc; }
                if (!Inside(r, c)) continue;
                var enemy = r * 8 + c;
                // Captured counters remain blockers until the entire turn ends.
                if (board[enemy] is not { } victim || victim.Side == piece.Side || captured[enemy]) continue;
                r += dr; c += dc;
                while (Inside(r, c) && board[r * 8 + c] is null)
                {
                    continued = true;
                    var to = r * 8 + c;
                    board[at] = null; board[to] = piece; captured[enemy] = true;
                    landings.Add(to); taken.Add(enemy);
                    CaptureRoutes(origin, to, piece);
                    taken.RemoveAt(taken.Count - 1); landings.RemoveAt(landings.Count - 1);
                    captured[enemy] = false; board[to] = null; board[at] = piece;
                    if (!piece.King) break;
                    r += dr; c += dc;
                }
            }
            if (!continued && taken.Count > 0)
                captures.Add(new Move(origin, Array.AsReadOnly(landings.ToArray()), Array.AsReadOnly(taken.ToArray())));
        }
    }

    private static bool Forward(Piece piece, int rowDirection) => piece.King || rowDirection == (piece.Side == Side.Green ? -1 : 1);
    private static bool Inside(int row, int col) => row is >= 0 and < 8 && col is >= 0 and < 8;
}
