import type { Grid as Cells } from "./solver";

// Undo/redo for the board. Each cell action pushes the previous state onto
// `past`. Undo moves the present to `future`, and redo moves it back. A new
// action clears `future`, the usual editor behaviour.

/** The most states kept for undo. Old moves beyond this are dropped. */
export const HISTORY_LIMIT = 200;

export interface History {
  past: Cells[];
  present: Cells;
  future: Cells[];
}

export function startHistory(present: Cells): History {
  return { past: [], present, future: [] };
}

function sameCells(a: Cells, b: Cells): boolean {
  return a.every((row, r) => row.every((cell, c) => cell === b[r]![c]));
}

/** Record a new board state. Returns the same history if nothing changed. */
export function commit(history: History, next: Cells): History {
  if (sameCells(history.present, next)) return history;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

export function canUndo(history: History): boolean {
  return history.past.length > 0;
}

export function canRedo(history: History): boolean {
  return history.future.length > 0;
}

export function undo(history: History): History {
  if (!canUndo(history)) return history;
  const previous = history.past[history.past.length - 1]!;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: History): History {
  if (!canRedo(history)) return history;
  const [next, ...rest] = history.future;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next!,
    future: rest,
  };
}
