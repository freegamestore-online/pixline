import { cluesOf, type Clue, type Grid } from "./solver";

export interface Puzzle {
  id: string;
  name: string;
  size: number;
  rowClues: Clue[];
  colClues: Clue[];
  solution: Grid;
}

/** Turn a hand-drawn picture (`#` filled, `.` empty) into a solution grid. */
function picture(rows: string[]): Grid {
  return rows.map((row) => [...row].map((ch) => (ch === "#" ? 1 : 0)));
}

function puzzle(id: string, name: string, rows: string[]): Puzzle {
  const solution = picture(rows);
  return { id, name, size: solution.length, ...cluesOf(solution), solution };
}

/** The bundled hand-made puzzle pack. Every entry is verified line-solvable in solver.test.ts. */
export const PUZZLES: Puzzle[] = [
  puzzle("heart-5", "Heart", [
    ".#.#.",
    "#####",
    "#####",
    ".###.",
    "..#..",
  ]),
  puzzle("house-7", "House", [
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    ".##.##.",
    ".##.##.",
    ".##.##.",
  ]),
  puzzle("boat-10", "Boat", [
    "....#.....",
    "....##....",
    "....###...",
    "....####..",
    "##########",
    ".########.",
    "..######..",
    "...####...",
    "##########",
    ".#.#.#.#.#",
  ]),
];
