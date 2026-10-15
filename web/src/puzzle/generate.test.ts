import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generate";
import { cluesOf, lineSolve, propagate, UNKNOWN } from "./solver";

const SIZES = [5, 7, 10, 15];

describe("generatePuzzle", () => {
  it("is deterministic for the same id and size", () => {
    const a = generatePuzzle({ id: "check", name: "Check", size: 7 });
    const b = generatePuzzle({ id: "check", name: "Check", size: 7 });
    expect(a).toEqual(b);
  });

  it.each(SIZES)("makes line-solvable puzzles at %sx%s", (size) => {
    for (let i = 0; i < 10; i++) {
      const p = generatePuzzle({ id: `sample-${i}`, name: "x", size });
      expect(p.size).toBe(size);
      expect(lineSolve([...p.rowClues, ...p.colClues], size)).toBe(true);
    }
  });

  it.each(SIZES)("makes puzzles with exactly one solution at %sx%s", (size) => {
    // Line-solvable means propagation alone fixes every cell. A fully determined
    // grid cannot be a different solution, so the solution is unique.
    for (let i = 0; i < 10; i++) {
      const p = generatePuzzle({ id: `unique-${i}`, name: "x", size });
      const solved = propagate(p.rowClues, p.colClues, size);
      expect(solved).not.toBeNull();
      expect(solved!.flat()).not.toContain(UNKNOWN);
      expect(solved!.map((row) => row.map((c) => (c === 1 ? 1 : 0)))).toEqual(p.solution);
    }
  });

  it("stores clues that match its solution", () => {
    const p = generatePuzzle({ id: "clues", name: "Clues", size: 10 });
    expect(cluesOf(p.solution)).toEqual({ rowClues: p.rowClues, colClues: p.colClues });
  });

  it("gives different puzzles for different ids", () => {
    const pictures = new Set<string>();
    for (let i = 0; i < 40; i++) {
      pictures.add(JSON.stringify(generatePuzzle({ id: `distinct-${i}`, name: "x", size: 7 }).solution));
    }
    expect(pictures.size).toBe(40);
  });
});
