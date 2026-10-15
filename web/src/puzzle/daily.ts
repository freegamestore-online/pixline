import { generatePuzzle, hashSeed } from "./generate";
import type { Puzzle } from "./puzzles";

/** Sizes the daily puzzle rotates through. */
export const DAILY_SIZES = [5, 7, 10] as const;

/** Local calendar date as YYYY-MM-DD. The daily puzzle changes at local midnight. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The puzzle for a date. The same date always gives the same puzzle, on every device. */
export function dailyPuzzle(dateKey: string): Puzzle {
  const size = DAILY_SIZES[hashSeed(`pixline:daily-size:${dateKey}`) % DAILY_SIZES.length]!;
  return generatePuzzle({ id: `daily-${dateKey}`, name: `Daily · ${dateKey}`, size });
}

/** Milliseconds from `date` until the next local midnight, when the daily puzzle changes. */
export function msUntilLocalMidnight(date: Date = new Date()): number {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return next.getTime() - date.getTime();
}
