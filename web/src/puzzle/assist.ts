import { FILLED, type Grid as Cells } from "./solver";

/** A cell position on the board. */
export interface CellRef {
  row: number;
  col: number;
}

/**
 * A cell that the solution fills but the board does not yet. Filling it is
 * always safe, because the puzzle has exactly one solution. Null when every
 * filled cell is already in place.
 */
export function pickHint(solution: Cells, cells: Cells): CellRef | null {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution.length; c++) {
      if (solution[r]![c] === 1 && cells[r]![c] !== FILLED) return { row: r, col: c };
    }
  }
  return null;
}

/** Cells filled on the board that the solution leaves empty. */
export function mistakes(solution: Cells, cells: Cells): boolean[][] {
  return cells.map((row, r) => row.map((cell, c) => cell === FILLED && solution[r]![c] === 0));
}
