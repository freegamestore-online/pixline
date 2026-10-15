import { useEffect, useRef, useState } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Grid, type BoardState, type Puzzle } from "./puzzle";
import { dailyPuzzle, localDateKey, msUntilLocalMidnight } from "./puzzle/daily";
import { loadProgress, saveProgress } from "./puzzle/progress";
import { submitDailyTime } from "./puzzle/leaderboard";

export default function App() {
  // Rotate the daily puzzle at local midnight, even if the page stays open.
  const [dateKey, setDateKey] = useState(() => localDateKey());
  useEffect(() => {
    const id = setTimeout(() => setDateKey(localDateKey()), msUntilLocalMidnight());
    return () => clearTimeout(id);
  }, [dateKey]);

  const puzzle = dailyPuzzle(dateKey);

  return (
    <GameShell topbar={<GameTopbar title="Pixline" score={0} actions={<GameAuth />} />}>
      <main className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>
          {puzzle.name}
        </h1>
        <div className="w-full">
          <DailyBoard key={puzzle.id} puzzle={puzzle} dateKey={dateKey} />
        </div>
      </main>
    </GameShell>
  );
}

interface DailyBoardProps {
  puzzle: Puzzle;
  dateKey: string;
}

function DailyBoard({ puzzle, dateKey }: DailyBoardProps) {
  const [saved] = useState(() => loadProgress(puzzle.id, puzzle.size));
  const [solveMs, setSolveMs] = useState<number | undefined>(saved?.solvedMs);
  // Refs, not state: they are read by the save and solve handlers, and changing them must not re-render.
  const startedAt = useRef<number | null>(saved?.startedAt ?? null);
  const latest = useRef<BoardState | undefined>(
    saved && { cells: saved.cells, hint: saved.hint ?? null, hintUsed: saved.hintUsed ?? false },
  );

  function handleChange(board: BoardState) {
    if (startedAt.current === null) startedAt.current = Date.now();
    latest.current = board;
    saveProgress(puzzle.id, { ...board, startedAt: startedAt.current, solvedMs: solveMs });
  }

  function handleSolved() {
    // Only the first solve counts. A reload of a solved board does not fire this, and solveMs guards a repeat.
    if (solveMs !== undefined || startedAt.current === null || !latest.current) return;
    const ms = Date.now() - startedAt.current;
    setSolveMs(ms);
    saveProgress(puzzle.id, { ...latest.current, startedAt: startedAt.current, solvedMs: ms });
    void submitDailyTime(dateKey, ms);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Grid
        rowClues={puzzle.rowClues}
        colClues={puzzle.colClues}
        solution={puzzle.solution}
        initialCells={saved?.cells}
        initialHint={saved?.hint ?? null}
        initialHintUsed={saved?.hintUsed ?? false}
        onChange={handleChange}
        onSolved={handleSolved}
      />
      {solveMs !== undefined && (
        <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
          Solved in {formatTime(solveMs)}
        </p>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
