import { describe, expect, it } from "vitest";
import { cluesOf, EMPTY, FILLED, lineSolve, propagate, runsOf, UNKNOWN } from "./solver";
import { PUZZLES } from "./puzzles";

/** Solution pictures use 0/1; solver output uses UNKNOWN/FILLED/EMPTY. */
const asCellStates = (g: number[][]) => g.map((row) => row.map((c) => (c === 1 ? FILLED : EMPTY)));

describe("bundled puzzle pack", () => {
  it.each(PUZZLES.map((p) => [p.name, p] as const))("%s is line-solvable", (_, p) => {
    expect(lineSolve([...p.rowClues, ...p.colClues], p.size)).toBe(true);
  });

  it.each(PUZZLES.map((p) => [p.name, p] as const))("%s clues match its solution", (_, p) => {
    expect(cluesOf(p.solution)).toEqual({ rowClues: p.rowClues, colClues: p.colClues });
  });

  it.each(PUZZLES.map((p) => [p.name, p] as const))("%s solver output equals its solution", (_, p) => {
    expect(propagate(p.rowClues, p.colClues, p.size)).toEqual(asCellStates(p.solution));
  });

  it("covers the 5x5, 7x7 and 10x10 sizes", () => {
    expect(PUZZLES.map((p) => p.size).sort((a, b) => a - b)).toEqual([5, 7, 10]);
  });
});

describe("line solver", () => {
  it("solves a single fully-filled row", () => {
    // 1x1 grid with clue [1] in its row and column.
    expect(lineSolve([[1], [1]], 1)).toBe(true);
  });

  it("solves a trivial all-filled 3x3 by its clues alone", () => {
    const rows = [[3], [3], [3]];
    const cols = [[3], [3], [3]];
    expect(lineSolve([...rows, ...cols], 3)).toBe(true);
    expect(propagate(rows, cols, 3)).toEqual([
      [FILLED, FILLED, FILLED],
      [FILLED, FILLED, FILLED],
      [FILLED, FILLED, FILLED],
    ]);
  });

  it("solves an empty row clue as all empty", () => {
    const rows = [[], [1], []];
    const cols = [[], [1], []];
    expect(propagate(rows, cols, 3)).toEqual([
      [EMPTY, EMPTY, EMPTY],
      [EMPTY, FILLED, EMPTY],
      [EMPTY, EMPTY, EMPTY],
    ]);
  });

  it("reports a contradiction when clues cannot fit the line", () => {
    // Row needs 4 filled cells in a 3-cell line.
    expect(propagate([[4], [], []], [[1], [], []], 3)).toBeNull();
    expect(lineSolve([[4], [], [], [1], [], []], 3)).toBe(false);
  });

  it("reports false when clues are consistent but leave cells ambiguous", () => {
    // A 2x2 with a single filled cell in each row and column has two solutions.
    const rows = [[1], [1]];
    const cols = [[1], [1]];
    expect(lineSolve([...rows, ...cols], 2)).toBe(false);
    expect(propagate(rows, cols, 2)!.flat()).toContain(UNKNOWN);
  });

  it("derives a 5x5 known puzzle by propagation alone", () => {
    // A hollow square: the border filled, the middle empty.
    const solution = [
      "#####",
      "#...#",
      "#...#",
      "#...#",
      "#####",
    ].map((row) => [...row].map((ch) => (ch === "#" ? 1 : 0)));
    const { rowClues, colClues } = cluesOf(solution);
    expect(runsOf(solution[2]!)).toEqual([1, 1]);
    expect(lineSolve([...rowClues, ...colClues], 5)).toBe(true);
    expect(propagate(rowClues, colClues, 5)).toEqual(asCellStates(solution));
  });
});
