import { cluesOf, lineSolve, type Grid } from "./solver";
import type { Puzzle } from "./puzzles";

/** Attempts per puzzle before giving up. Random pictures are rarely line-solvable, so this must be generous. */
const MAX_ATTEMPTS = 5000;

/** Hash a string to an unsigned 32-bit seed (FNV-1a). */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A small seeded PRNG (mulberry32). The same seed always gives the same sequence. */
export function createRng(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random picture where each cell is filled with probability `density`. */
function randomPicture(rng: () => number, size: number, density: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => (rng() < density ? 1 : 0)));
}

/**
 * Generate a puzzle from an id. The same id and size always give the same puzzle.
 *
 * Each attempt draws a random picture and keeps it only if line logic alone solves
 * it. A line-solvable picture has exactly one solution, because the clues force
 * every cell. So the result is both unique and solvable without guessing.
 */
export function generatePuzzle({ id, name, size }: { id: string; name: string; size: number }): Puzzle {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = createRng(`${id}:${size}:${attempt}`);
    // Vary the fill density per attempt. Sparse and dense pictures are the most often solvable.
    const density = 0.4 + rng() * 0.2;
    const solution = randomPicture(rng, size, density);
    const { rowClues, colClues } = cluesOf(solution);
    if (lineSolve([...rowClues, ...colClues], size)) {
      return { id, name, size, rowClues, colClues, solution };
    }
  }
  throw new RangeError(`no line-solvable ${size}x${size} puzzle found for "${id}"`);
}
