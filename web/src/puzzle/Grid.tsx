import { useEffect, useMemo, useRef, useState } from "react";
import { EMPTY, FILLED, runsOf, UNKNOWN, type Clue, type Grid as Cells } from "./solver";
import { canRedo, canUndo, commit, redo, startHistory, undo, type History } from "./history";
import { mistakes, pickHint, type CellRef } from "./assist";

export interface GridProps {
  rowClues: Clue[];
  colClues: Clue[];
  /** The picture to match. 1 = filled, 0 = empty. */
  solution: Cells;
  /** Called once each time the board first matches the solution. */
  onSolved?: () => void;
  /** Saved cell states to resume from. Defaults to an empty board. */
  initialCells?: Cells;
  /** The hint cell still on screen, if any. */
  initialHint?: CellRef | null;
  /** True once this puzzle's one hint has been used. */
  initialHintUsed?: boolean;
  /** Called with the full board state after every change, so it can be saved. */
  onChange?: (state: BoardState) => void;
}

export interface BoardState {
  cells: Cells;
  hint: CellRef | null;
  hintUsed: boolean;
}

/** Tap cycles a cell: empty → filled → X → empty. */
function next(state: number): number {
  if (state === UNKNOWN) return FILLED;
  if (state === FILLED) return EMPTY;
  return UNKNOWN;
}

/** Show a clue as its runs, or 0 for an empty line. */
function clueLabel(clue: Clue): number[] {
  return clue.length > 0 ? clue : [0];
}

const toolbarButton = {
  minHeight: 44,
  minWidth: 44,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid var(--line-strong)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontWeight: 600,
} as const;

export function Grid({ rowClues, colClues, solution, onSolved, initialCells, initialHint, initialHintUsed, onChange }: GridProps) {
  const size = solution.length;
  const [history, setHistory] = useState<History>(() =>
    startHistory(initialCells ?? Array.from({ length: size }, () => new Array(size).fill(UNKNOWN))),
  );
  const cells = history.present;
  const [hint, setHint] = useState<CellRef | null>(initialHint ?? null);
  const [hintUsed, setHintUsed] = useState(initialHintUsed ?? false);
  const [showMistakes, setShowMistakes] = useState(false);

  const rowDone = useMemo(
    () => cells.map((row, r) => sameRuns(runsOf(row), rowClues[r] ?? [])),
    [cells, rowClues],
  );
  const colDone = useMemo(
    () => colClues.map((clue, c) => sameRuns(runsOf(cells.map((row) => row[c]!)), clue)),
    [cells, colClues],
  );
  const solved = cells.every((row, r) => row.every((cell, c) => (cell === FILLED) === (solution[r]![c] === 1)));
  const wrong = useMemo(() => mistakes(solution, cells), [solution, cells]);

  // Fire once per transition into the solved state. A board that loads already
  // solved was solved earlier, so it does not fire again.
  const wasSolved = useRef(solved);
  useEffect(() => {
    if (solved && !wasSolved.current) onSolved?.();
    wasSolved.current = solved;
  }, [solved, onSolved]);

  /** Apply a new board, and report it. The hint and its use are saved with it. */
  function update(nextHistory: History, nextHint: CellRef | null, nextHintUsed: boolean) {
    setHistory(nextHistory);
    setHint(nextHint);
    setHintUsed(nextHintUsed);
    onChange?.({ cells: nextHistory.present, hint: nextHint, hintUsed: nextHintUsed });
  }

  function tap(r: number, c: number) {
    const updated = cells.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? next(cell) : cell)) : row));
    update(commit(history, updated), hint, hintUsed);
  }

  function doUndo() {
    if (canUndo(history)) update(undo(history), hint, hintUsed);
  }

  function doRedo() {
    if (canRedo(history)) update(redo(history), hint, hintUsed);
  }

  function useHint() {
    if (hintUsed || solved) return;
    const ref = pickHint(solution, cells);
    if (!ref) return;
    update(history, ref, true);
  }

  // Ctrl/Cmd+Z undoes; Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redoes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        doRedo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // A hint is only on screen while its cell is still unfilled.
  const hintCell = hint && cells[hint.row]![hint.col] !== FILLED ? hint : null;
  const hintDisabled = hintUsed || solved || pickHint(solution, cells) === null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2" role="toolbar" aria-label="Board tools">
        <button type="button" onClick={doUndo} disabled={!canUndo(history)} style={toolbarButton} className="disabled:opacity-40">
          Undo
        </button>
        <button type="button" onClick={doRedo} disabled={!canRedo(history)} style={toolbarButton} className="disabled:opacity-40">
          Redo
        </button>
        <button
          type="button"
          onClick={() => setShowMistakes((on) => !on)}
          aria-pressed={showMistakes}
          style={{ ...toolbarButton, ...(showMistakes ? { background: "var(--error)", color: "#ffffff", borderColor: "var(--error)" } : {}) }}
        >
          Mistakes {showMistakes ? "on" : "off"}
        </button>
        <button type="button" onClick={useHint} disabled={hintDisabled} style={toolbarButton} className="disabled:opacity-40">
          {hintUsed ? "Hint used" : "Hint"}
        </button>
      </div>

      <div
        className="puzzle-grid"
        style={{ display: "grid", gridTemplateColumns: `auto repeat(${size}, minmax(0, 1fr))`, gap: 2, userSelect: "none", width: "100%" }}
      >
        <div />
        {colClues.map((clue, c) => (
          <div
            key={`col-${c}`}
            className={`clue ${colDone[c] ? "clue-done" : ""}`}
            style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", padding: "0 2px 4px" }}
          >
            {clueLabel(clue).map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
        ))}

        {cells.map((row, r) => (
          <div key={`row-${r}`} style={{ display: "contents" }}>
            <div
              className={`clue ${rowDone[r] ? "clue-done" : ""}`}
              style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, padding: "0 4px" }}
            >
              {clueLabel(rowClues[r] ?? []).map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
            {row.map((cell, c) => {
              const mistake = showMistakes && wrong[r]![c];
              const isHint = hintCell?.row === r && hintCell?.col === c;
              return (
                <button
                  key={`cell-${r}-${c}`}
                  type="button"
                  aria-label={`Row ${r + 1}, column ${c + 1}`}
                  data-state={cell === FILLED ? "filled" : cell === EMPTY ? "empty" : "unknown"}
                  data-mistake={mistake ? "true" : undefined}
                  data-hint={isHint ? "true" : undefined}
                  onClick={() => tap(r, c)}
                  className="cell"
                  style={{
                    aspectRatio: "1 / 1",
                    minWidth: 0,
                    minHeight: 0,
                    border: "1px solid var(--line-strong)",
                    borderRadius: 4,
                    background: mistake ? "var(--error)" : cell === FILLED ? "var(--ink)" : "var(--paper)",
                    color: mistake ? "#ffffff" : "var(--muted)",
                    fontWeight: 700,
                    padding: 0,
                    outline: isHint ? "3px solid var(--accent)" : undefined,
                    outlineOffset: isHint ? -3 : undefined,
                  }}
                >
                  {mistake ? "✕" : cell === EMPTY ? "×" : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function sameRuns(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((n, i) => n === b[i]);
}
