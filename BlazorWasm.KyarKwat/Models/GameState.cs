namespace BlazorWasm.KyarKwat.Models;

public enum Side { Green, Ivory }
public enum GameMode { Normal, Reverse }
public enum Difficulty { Easy, Medium, Hard }
public enum ResultReason { NoPieces, NoMoves, Draw }
public readonly record struct Piece(Side Side, bool King = false);
public sealed record Move(int From, IReadOnlyList<int> Landings, IReadOnlyList<int> Captures)
{
    public int To => Landings[^1];
}
public sealed record GameResult(Side? Winner, ResultReason Reason);

public sealed class GameState
{
    public IReadOnlyList<Piece?> Board { get; }
    public Side Turn { get; }
    public GameMode Mode { get; }
    public int QuietKingTurns { get; }
    public IReadOnlyList<Move> LegalMoves { get; internal set; } = [];
    public GameResult? Result { get; internal set; }

    internal GameState(Piece?[] board, Side turn, GameMode mode, int quietKingTurns)
    {
        Board = Array.AsReadOnly(board);
        Turn = turn;
        Mode = mode;
        QuietKingTurns = quietKingTurns;
    }

    public int Count(Side side) => Board.Count(piece => piece?.Side == side);
}
