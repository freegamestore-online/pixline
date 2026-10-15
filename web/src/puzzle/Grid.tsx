import { useEffect, useMemo, useRef, useState } from "react";
import { EMPTY, FILLED, runsOf, UNKNOWN, type Clue, type Grid as Cells } from "./solver";

export interface GridProps {
  rowClues: Clue[];
  colClues: Clue[];
  /** The picture to match. 1 = filled, 0 = empty. */
  solution: Cells;
  /** Called once each time the board first matches the solution. */
  onSolved?: () => void;
  /** Saved cell states to resume from. Defaults to an empty board. */
  initialCells?: Cells;
  /** Called with the new cell states after every tap. */
  onChange?: (cells: Cells) => void;
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

export function Grid({ rowClues, colClues, solution, onSolved, initialCells, onChange }: GridProps) {
  const size = solution.length;
  const [cells, setCells] = useState<Cells>(
    () => initialCells ?? Array.from({ length: size }, () => new Array(size).fill(UNKNOWN)),
  );

  const rowDone = useMemo(
    () => cells.map((row, r) => sameRuns(runsOf(row), rowClues[r] ?? [])),
    [cells, rowClues],
  );
  const colDone = useMemo(
    () => colClues.map((clue, c) => sameRuns(runsOf(cells.map((row) => row[c]!)), clue)),
    [cells, colClues],
  );
  const solved = cells.every((row, r) => row.every((cell, c) => (cell === FILLED) === (solution[r]![c] === 1)));

  // Fire once per transition into the solved state. A board that loads already
  // solved was solved earlier, so it does not fire again.
  const wasSolved = useRef(solved);
  useEffect(() => {
    if (solved && !wasSolved.current) onSolved?.();
    wasSolved.current = solved;
  }, [solved, onSolved]);

  function tap(r: number, c: number) {
    const updated = cells.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? next(cell) : cell)) : row));
    setCells(updated);
    onChange?.(updated);
  }

  return (
    <div
      className="puzzle-grid"
      style={{ display: "grid", gridTemplateColumns: `auto repeat(${size}, minmax(0, 1fr))`, gap: 2, userSelect: "none" }}
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
          {row.map((cell, c) => (
            <button
              key={`cell-${r}-${c}`}
              type="button"
              aria-label={`Row ${r + 1}, column ${c + 1}`}
              data-state={cell === FILLED ? "filled" : cell === EMPTY ? "empty" : "unknown"}
              onClick={() => tap(r, c)}
              className="cell"
              style={{
                aspectRatio: "1 / 1",
                minWidth: 0,
                minHeight: 0,
                border: "1px solid var(--line-strong)",
                borderRadius: 4,
                background: cell === FILLED ? "var(--ink)" : "var(--paper)",
                color: "var(--muted)",
                fontWeight: 700,
                padding: 0,
              }}
            >
              {cell === EMPTY ? "×" : ""}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function sameRuns(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((n, i) => n === b[i]);
}
