import type { Grid } from "./solver";
import type { CellRef } from "./assist";

// Progress is saved per puzzle, so a refresh resumes the same board and timer.
// Storage can be missing or full (private mode, quota), so every access is
// guarded and the game still plays without it.

const PREFIX = "pixline:progress:";

export interface SavedProgress {
  /** Cell states, as Grid uses them: 0 unknown, 1 filled, 2 X. */
  cells: Grid;
  /** When the first move was made. Null until then. */
  startedAt: number | null;
  /** Solve time in ms, set once when the puzzle is first solved. */
  solvedMs?: number;
  /** The hint cell still on screen, if any. */
  hint?: CellRef | null;
  /** True once the puzzle's one hint has been used. Kept so a refresh cannot get a second. */
  hintUsed?: boolean;
}

/** Storage key for a puzzle. */
export function progressKey(puzzleId: string): string {
  return `${PREFIX}${puzzleId}`;
}

/** Save progress. Does nothing when storage is unavailable. */
export function saveProgress(puzzleId: string, progress: SavedProgress): void {
  try {
    localStorage.setItem(progressKey(puzzleId), JSON.stringify(progress));
  } catch {
    // Quota or private mode: play on without saving.
  }
}

/**
 * Load saved progress for a puzzle of the given size. Returns null when nothing
 * is saved, the data is malformed, or it does not match the puzzle's size.
 */
export function loadProgress(puzzleId: string, size: number): SavedProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(puzzleId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isSavedProgress(parsed, size)) return parsed;
  } catch {
    // Unreadable or malformed: start the puzzle fresh.
  }
  return null;
}

function isSavedProgress(value: unknown, size: number): value is SavedProgress {
  const p = value as SavedProgress;
  return (
    typeof p === "object" &&
    p !== null &&
    Array.isArray(p.cells) &&
    p.cells.length === size &&
    p.cells.every((row) => Array.isArray(row) && row.length === size && row.every((c) => c === 0 || c === 1 || c === 2)) &&
    (p.startedAt === null || Number.isFinite(p.startedAt)) &&
    (p.solvedMs === undefined || Number.isFinite(p.solvedMs)) &&
    (p.hint === undefined || p.hint === null || isCellRef(p.hint, size)) &&
    (p.hintUsed === undefined || typeof p.hintUsed === "boolean")
  );
}

function isCellRef(value: unknown, size: number): value is CellRef {
  const ref = value as CellRef;
  return (
    typeof ref === "object" &&
    ref !== null &&
    Number.isInteger(ref.row) &&
    Number.isInteger(ref.col) &&
    ref.row >= 0 &&
    ref.row < size &&
    ref.col >= 0 &&
    ref.col < size
  );
}
