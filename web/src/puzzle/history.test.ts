import { describe, expect, it } from "vitest";
import { canRedo, canUndo, commit, HISTORY_LIMIT, redo, startHistory, undo } from "./history";

const board = (...cells: number[]) => [cells];

describe("history", () => {
  it("undoes and redoes a single change", () => {
    let h = startHistory(board(0, 0));
    h = commit(h, board(1, 0));
    expect(h.present).toEqual(board(1, 0));
    h = undo(h);
    expect(h.present).toEqual(board(0, 0));
    h = redo(h);
    expect(h.present).toEqual(board(1, 0));
  });

  it("steps back through several changes in order", () => {
    let h = startHistory(board(0));
    h = commit(h, board(1));
    h = commit(h, board(2));
    h = commit(h, board(0));
    h = undo(undo(h));
    expect(h.present).toEqual(board(1));
    h = undo(h);
    expect(h.present).toEqual(board(0));
    expect(canUndo(h)).toBe(false);
  });

  it("clears the redo stack on a new change", () => {
    let h = startHistory(board(0));
    h = commit(h, board(1));
    h = undo(h);
    expect(canRedo(h)).toBe(true);
    h = commit(h, board(2));
    expect(canRedo(h)).toBe(false);
  });

  it("ignores a change that leaves the board as it was", () => {
    const h = startHistory(board(1, 2));
    expect(commit(h, board(1, 2))).toBe(h);
  });

  it("does nothing to undo or redo past the ends", () => {
    const h = startHistory(board(0));
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it("keeps only the latest states", () => {
    let h = startHistory(board(0));
    for (let i = 0; i < HISTORY_LIMIT + 50; i++) h = commit(h, board(i % 2 === 0 ? 1 : 2));
    expect(h.past.length).toBe(HISTORY_LIMIT);
  });
});
