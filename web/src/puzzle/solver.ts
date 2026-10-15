/** A run-length clue for one row or column, e.g. [2, 1]. An empty line is [] (shown as 0). */
export type Clue = number[];

/** Cell states. 0 = unknown, 1 = filled, 2 = empty (marked X). */
export type Grid = number[][];

export const UNKNOWN = 0;
export const FILLED = 1;
export const EMPTY = 2;

/** The cell states a line can take on, as run lengths of filled cells. */
export function runsOf(line: number[]): number[] {
  const runs: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell === FILLED) {
      run++;
    } else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  return runs;
}

/** Every arrangement of `clue` across `line` that agrees with the cells already known. */
function arrangements(clue: Clue, line: number[]): number[][] {
  const n = line.length;
  const runs = clue.filter((r) => r > 0);
  const out: number[][] = [];
  const cur: number[] = new Array(n).fill(EMPTY);

  const agrees = () => line.every((cell, i) => cell === UNKNOWN || cell === cur[i]);

  function place(index: number, start: number) {
    if (index === runs.length) {
      if (agrees()) out.push(cur.slice());
      return;
    }
    const run = runs[index]!;
    // Cells still needed after this run: the runs that follow, plus one gap before each.
    const after = runs.slice(index + 1).reduce((sum, r) => sum + r + 1, 0);
    for (let s = start; s + run + after <= n; s++) {
      for (let i = s; i < s + run; i++) cur[i] = FILLED;
      place(index + 1, s + run + 1);
      for (let i = s; i < s + run; i++) cur[i] = EMPTY;
    }
  }

  place(0, 0);
  return out;
}

/** Fill in every cell that all valid arrangements of a line agree on. Returns null if none fit. */
function narrow(clue: Clue, line: number[]): number[] | null {
  const options = arrangements(clue, line);
  if (options.length === 0) return null;
  return line.map((cell, i) => {
    if (cell !== UNKNOWN) return cell;
    const first = options[0]![i];
    return options.every((o) => o[i] === first) ? first! : UNKNOWN;
  });
}

/**
 * Apply row and column constraints until nothing changes.
 * Returns the partly or fully solved grid, or null if the clues contradict each other.
 */
export function propagate(rowClues: Clue[], colClues: Clue[], size: number): Grid | null {
  const grid: Grid = Array.from({ length: size }, () => new Array(size).fill(UNKNOWN));
  let changed = true;

  while (changed) {
    changed = false;
    for (let r = 0; r < size; r++) {
      const next = narrow(rowClues[r] ?? [], grid[r]!);
      if (!next) return null;
      if (next.some((cell, c) => cell !== grid[r]![c])) {
        grid[r] = next;
        changed = true;
      }
    }
    for (let c = 0; c < size; c++) {
      const column = grid.map((row) => row[c]!);
      const next = narrow(colClues[c] ?? [], column);
      if (!next) return null;
      if (next.some((cell, r) => cell !== column[r])) {
        next.forEach((cell, r) => (grid[r]![c] = cell));
        changed = true;
      }
    }
  }
  return grid;
}

/**
 * True if the clues alone determine the whole picture, with no guessing.
 *
 * `clues` holds the row clues followed by the column clues, so its length is
 * `2 * gridSize`.
 */
export function lineSolve(clues: Clue[], gridSize: number): boolean {
  const grid = propagate(clues.slice(0, gridSize), clues.slice(gridSize), gridSize);
  return grid !== null && grid.every((row) => row.every((cell) => cell !== UNKNOWN));
}

/** Row and column clues for a picture, where 1 is filled. */
export function cluesOf(solution: Grid): { rowClues: Clue[]; colClues: Clue[] } {
  const size = solution.length;
  const rowClues = solution.map((row) => runsOf(row));
  const colClues = Array.from({ length: size }, (_, c) => runsOf(solution.map((row) => row[c]!)));
  return { rowClues, colClues };
}
