import { describe, expect, it } from "vitest";
import { DAILY_SIZES, dailyPuzzle, localDateKey, msUntilLocalMidnight } from "./daily";
import { lineSolve, propagate, UNKNOWN } from "./solver";

/** Dates across a few months and years, so the size rotation is covered. */
function dateKeys(count: number): string[] {
  const keys: string[] = [];
  const start = new Date(2026, 0, 1);
  for (let i = 0; i < count; i++) {
    keys.push(localDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
  }
  return keys;
}

describe("dailyPuzzle", () => {
  it("is the same for the same date", () => {
    expect(dailyPuzzle("2026-10-16")).toEqual(dailyPuzzle("2026-10-16"));
  });

  it("gives a different puzzle on different days", () => {
    const pictures = new Set(dateKeys(30).map((d) => JSON.stringify(dailyPuzzle(d).solution)));
    expect(pictures.size).toBe(30);
  });

  it("uses one of the daily sizes", () => {
    for (const d of dateKeys(30)) {
      expect(DAILY_SIZES).toContain(dailyPuzzle(d).size);
    }
  });

  it("rotates through every daily size over a month", () => {
    const sizes = new Set(dateKeys(30).map((d) => dailyPuzzle(d).size));
    expect([...sizes].sort((a, b) => a - b)).toEqual([...DAILY_SIZES]);
  });

  it("is line-solvable and unique for every day tested", () => {
    for (const d of dateKeys(60)) {
      const p = dailyPuzzle(d);
      expect(lineSolve([...p.rowClues, ...p.colClues], p.size)).toBe(true);
      const solved = propagate(p.rowClues, p.colClues, p.size);
      expect(solved!.flat()).not.toContain(UNKNOWN);
    }
  });
});

describe("localDateKey", () => {
  it("formats the local date as YYYY-MM-DD", () => {
    expect(localDateKey(new Date(2026, 9, 6, 23, 59))).toBe("2026-10-06");
  });
});

describe("msUntilLocalMidnight", () => {
  it("counts down to the next local midnight", () => {
    expect(msUntilLocalMidnight(new Date(2026, 9, 16, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
    expect(msUntilLocalMidnight(new Date(2026, 9, 16, 23, 0, 0))).toBe(60 * 60 * 1000);
  });
});
