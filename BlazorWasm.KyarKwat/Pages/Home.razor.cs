using BlazorWasm.KyarKwat.Models;
using BlazorWasm.KyarKwat.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;

namespace BlazorWasm.KyarKwat.Pages;

public partial class Home : IAsyncDisposable
{
    [Inject] private IJSRuntime JS { get; set; } = default!;
    private GameState game = GameRules.NewGame();
    private bool computerOpponent = true, draftComputer = true, thinking, disposed;
    private Difficulty level = Difficulty.Medium, draftLevel = Difficulty.Medium;
    private GameMode draftMode;
    private int? origin;
    private readonly List<int> prefix = [];
    private List<Move> routes = [];
    private HashSet<int> destinations = [];
    private int focusedSquare = 40, generation;
    private string? dialog, computerError;
    private CancellationTokenSource? computerCancellation;
    private IJSObjectReference? module;
    private DotNetObjectReference<Home>? reference;
    private int? CurrentSquare => origin is null ? null : prefix.Count > 0 ? prefix[^1] : origin;
    private bool BoardLocked => thinking || game.Result is not null || computerOpponent && game.Turn == Side.Ivory;
    private bool MustCapture => game.Result is null && game.LegalMoves.Count > 0 && game.LegalMoves[0].Captures.Count > 0;
    private string TurnTitle => game.Result is not null ? ResultTitle : thinking ? "စက်က စဉ်းစားနေပါတယ်" : PlayerName(game.Turn) + " အလှည့်ပါ";
    private string TurnDescription => game.Result is not null ? ResultDescription : thinking ? $"{level} · ပြိုင်ဘက်ရဲ့ရွှေ့ကွက်ကို စောင့်ပါ။" : prefix.Count > 0 ? "ဒီကျားနဲ့ပဲ ဆက်စားပါ။ ပြထားသောကွက်ကို ရွေးပါ။" : origin is not null ? "ပြထားသောကွက်တစ်ကွက်ကို ရွေးပါ။" : MustCapture ? "စားနိုင်သောကျားတစ်ကောင်ကို ရွေးပါ။" : "ကိုယ့်ကျားတစ်ကောင်ကို ရွေးပါ။";
    private string ResultTitle => game.Result is not { } result ? "" : result.Winner is { } winner ? PlayerName(winner) + " အနိုင်ရပါတယ်။" : "သရေဖြစ်ပါတယ်။";
    private string ResultDescription => game.Result?.Reason switch
    {
        ResultReason.Draw => "ကျားမစားဘဲ ကင်းသာ တစ်ဖက်စီ ၂၅ ကြိမ်ဆက်တိုက် ရွှေ့ခဲ့လို့ သရေဖြစ်ပါတယ်။",
        ResultReason.NoPieces => game.Mode == GameMode.Reverse ? "ကိုယ့်ကျား တစ်ကောင်မှ မကျန်တော့သူက ကျားကုန်မှာ နိုင်ပါတယ်။" : "ပြိုင်ဘက်ရဲ့ ကျားအားလုံးကို စားနိုင်လို့ အနိုင်ရပါတယ်။",
        ResultReason.NoMoves => game.Mode == GameMode.Reverse ? "ကိုယ်ရွှေ့စရာ မရှိတော့သူက ကျားကုန်မှာ နိုင်ပါတယ်။" : "ပြိုင်ဘက်မှာ ရွှေ့စရာ မရှိတော့လို့ အနိုင်ရပါတယ်။",
        _ => ""
    };
    private string LevelDescription => draftLevel switch
    {
        Difficulty.Easy => "အခြေခံရွှေ့ကွက်တွေနဲ့ ပေါ့ပေါ့ပါးပါး ကစားကြည့်ပါ။",
        Difficulty.Medium => "ရှေ့ဆက်ရွှေ့ကွက်တွေကို ကြိုတွက်ပြီး ကစားပါမယ်။",
        _ => "ရွှေ့ကွက်တွေကို ပိုနက်နက် ကြိုတွက်ကစားပါမယ်။"
    };
    private static string ModeName(GameMode mode) => mode == GameMode.Normal ? "ကျားနိုင်" : "ကျားကုန်";
    private static string Objective(GameMode mode) => mode == GameMode.Normal ? "ပြိုင်ဘက်ရဲ့ ကျားတွေကို စားပြီး အနိုင်ယူပါ။" : "ကိုယ့်ကျားတွေကို စားအောင် ခင်းပေးပြီး အနိုင်ယူပါ။";
    private static string Details(GameMode mode) => mode == GameMode.Normal ? "ပြိုင်ဘက်မှာ ကျားမကျန်တော့ရင်၊ ဒါမှမဟုတ် ရွှေ့စရာ မရှိတော့ရင် သင်နိုင်ပါတယ်။" : "ကိုယ့်ကျား မကျန်တော့ရင်၊ ဒါမှမဟုတ် ကိုယ်ရွှေ့စရာ မရှိတော့ရင် ကိုယ်နိုင်ပါတယ်။";
    private static string SideClass(Side side) => side == Side.Green ? "green" : "ivory";
    private string PlayerName(Side side) => computerOpponent ? side == Side.Green ? "သင်" : "စက်ကစားသမား" : side == Side.Green ? "အစိမ်းကျား ကစားသမား" : "အဖြူကျား ကစားသမား";

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;
        module = await JS.InvokeAsync<IJSObjectReference>("import", "./game-ui.js");
        reference = DotNetObjectReference.Create(this);
        await module.InvokeVoidAsync("initialize", reference);
        await OpenSetupAsync();
    }

    private Piece? DisplayPiece(int square)
    {
        if (origin is not { } start || prefix.Count == 0) return game.Board[square];
        if (square == CurrentSquare) return game.Board[start];
        return square == start ? null : game.Board[square];
    }

    private string SquareClass(int square)
    {
        var captured = prefix.Count > 0 && routes[0].Captures.Take(prefix.Count).Contains(square);
        return $"square {(GameRules.Playable(square) ? "dark" : "light")}{(CurrentSquare == square ? " selected" : "")}{(destinations.Contains(square) ? " destination" : "")}{(captured ? " pending-capture" : "")}";
    }

    private string SquareLabel(int square)
    {
        var piece = DisplayPiece(square);
        var label = piece is { } counter ? (counter.Side == Side.Green ? "အစိမ်းကျား" : "အဖြူကျား") + (counter.King ? " ကင်း" : "") : "အလွတ်";
        return $"{(char)('a' + square % 8)}{8 - square / 8} · {label}{(destinations.Contains(square) ? " · ရွှေ့နိုင်သောကွက်" : "")}";
    }

    private async Task SelectSquareAsync(int square)
    {
        if (BoardLocked) return;
        focusedSquare = square;
        if (destinations.Contains(square))
        {
            routes = routes.Where(move => move.Landings[prefix.Count] == square).ToList();
            prefix.Add(square);
            if (routes[0].Landings.Count == prefix.Count)
            {
                game = GameRules.Apply(game, routes[0]);
                ResetSelection();
                await ShowResultIfFinishedAsync();
                await RunComputerAsync();
                return;
            }
            UpdateDestinations();
        }
        else if (prefix.Count == 0 && game.LegalMoves.Any(move => move.From == square))
        {
            origin = square;
            routes = game.LegalMoves.Where(move => move.From == square).ToList();
            UpdateDestinations();
        }
    }

    private void UpdateDestinations() => destinations = routes.Select(move => move.Landings[prefix.Count]).ToHashSet();
    private void ResetSelection() { origin = null; prefix.Clear(); routes.Clear(); destinations.Clear(); }

    private async Task BoardKeyDownAsync(KeyboardEventArgs e, int square)
    {
        var row = square / 8;
        var col = square % 8;
        switch (e.Key)
        {
            case "ArrowLeft": col -= 2; break;
            case "ArrowRight": col += 2; break;
            case "ArrowUp": row--; col += col < 7 ? 1 : -1; break;
            case "ArrowDown": row++; col += col < 7 ? 1 : -1; break;
            case "Home": col = row % 2 == 0 ? 1 : 0; break;
            case "End": col = row % 2 == 0 ? 7 : 6; break;
            default: return;
        }
        if (row is < 0 or > 7 || col is < 0 or > 7 || BoardLocked) return;
        focusedSquare = row * 8 + col;
        if (module is not null) await module.InvokeVoidAsync("focusSquare", focusedSquare);
    }

    private async Task OpenSetupAsync()
    {
        draftMode = game.Mode; draftLevel = level; draftComputer = computerOpponent;
        await OpenDialogAsync("setup");
    }

    private async Task OpenDialogAsync(string kind)
    {
        dialog = kind;
        StateHasChanged();
        if (module is not null) await module.InvokeVoidAsync("show", kind + "-dialog");
    }

    private async Task CloseDialogAsync()
    {
        if (module is not null && dialog is not null) await module.InvokeVoidAsync("close", dialog + "-dialog");
        dialog = null;
    }

    [JSInvokable]
    public async Task DismissDialog()
    {
        await CloseDialogAsync();
        StateHasChanged();
    }

    private async Task StartGameAsync()
    {
        computerCancellation?.Cancel();
        generation++;
        game = GameRules.NewGame(draftMode);
        computerOpponent = draftComputer; level = draftLevel;
        thinking = false; computerError = null;
        focusedSquare = 40;
        ResetSelection();
        await CloseDialogAsync();
        if (module is not null) await module.InvokeVoidAsync("focusSquare", focusedSquare);
    }

    private async Task ReplayAsync()
    {
        draftMode = game.Mode; draftComputer = computerOpponent; draftLevel = level;
        await StartGameAsync();
    }

    private async Task ShowResultIfFinishedAsync()
    {
        if (game.Result is not null && dialog is null) await OpenDialogAsync("result");
    }

    private async Task RunComputerAsync()
    {
        if (!computerOpponent || game.Turn != Side.Ivory || game.Result is not null || thinking || disposed) return;
        var currentGeneration = generation;
        using var cancellation = new CancellationTokenSource();
        computerCancellation = cancellation;
        thinking = true; computerError = null;
        StateHasChanged();
        try
        {
            await Task.Delay(1, cancellation.Token);
            var answer = await ComputerPlayer.ChooseAsync(game, level, cancellation.Token);
            if (disposed || currentGeneration != generation || cancellation.IsCancellationRequested) return;
            if (answer.Move is not null) game = GameRules.Apply(game, answer.Move);
            ResetSelection();
            thinking = false;
            focusedSquare = game.LegalMoves.FirstOrDefault()?.From ?? 40;
            await ShowResultIfFinishedAsync();
        }
        catch (OperationCanceledException) when (cancellation.IsCancellationRequested) { }
        catch (Exception error)
        {
            Console.Error.WriteLine(error);
            if (currentGeneration == generation && !disposed)
                computerError = "စက်ကစားသမား အမှားဖြစ်သွားပါတယ်။ ထပ်စမ်းနိုင်ပါတယ်။";
        }
        finally
        {
            if (ReferenceEquals(computerCancellation, cancellation)) computerCancellation = null;
            if (currentGeneration == generation && !disposed) { thinking = false; StateHasChanged(); }
        }
    }

    public async ValueTask DisposeAsync()
    {
        disposed = true;
        computerCancellation?.Cancel();
        if (module is not null)
        {
            await module.InvokeVoidAsync("dispose");
            await module.DisposeAsync();
        }
        reference?.Dispose();
    }
}
