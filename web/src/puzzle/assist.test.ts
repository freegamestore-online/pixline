import { describe, expect, it } from "vitest";
import { mistakes, pickHint } from "./assist";
import { PUZZLES } from "./puzzles";
import { EMPTY, FILLED, UNKNOWN } from "./solver";

const solution = [
  [1, 0],
  [0, 1],
];

describe("pickHint", () => {
  it("picks a cell the solution fills that is not yet filled", () => {
    const cells = [
      [UNKNOWN, EMPTY],
      [EMPTY, UNKNOWN],
    ];
    expect(pickHint(solution, cells)).toEqual({ row: 0, col: 0 });
  });

  it("skips cells already filled correctly", () => {
    const cells = [
      [FILLED, EMPTY],
      [EMPTY, UNKNOWN],
    ];
    expect(pickHint(solution, cells)).toEqual({ row: 1, col: 1 });
  });

  it("never points at a cell the solution leaves empty", () => {
    const hint = pickHint(solution, [[UNKNOWN, UNKNOWN], [UNKNOWN, UNKNOWN]]);
    expect(solution[hint!.row]![hint!.col]).toBe(1);
  });

  it("returns null when every filled cell is in place", () => {
    const cells = [
      [FILLED, EMPTY],
      [EMPTY, FILLED],
    ];
    expect(pickHint(solution, cells)).toBeNull();
  });

  it("gives a usable hint on a bundled puzzle", () => {
    const p = PUZZLES[0]!;
    const hint = pickHint(p.solution, p.solution.map((row) => row.map(() => UNKNOWN)));
    expect(hint).not.toBeNull();
    expect(p.solution[hint!.row]![hint!.col]).toBe(1);
  });
});

describe("mistakes", () => {
  it("flags only filled cells the solution leaves empty", () => {
    const cells = [
      [FILLED, FILLED],
      [EMPTY, UNKNOWN],
    ];
    expect(mistakes(solution, cells)).toEqual([
      [false, true],
      [false, false],
    ]);
  });

  it("does not flag a missing fill or an X mark", () => {
    expect(mistakes(solution, [[UNKNOWN, EMPTY], [EMPTY, UNKNOWN]]).flat()).toEqual([false, false, false, false]);
  });
});
