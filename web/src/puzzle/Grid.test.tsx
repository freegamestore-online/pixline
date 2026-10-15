import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Grid } from "./Grid";
import { PUZZLES } from "./puzzles";

const puzzle = PUZZLES.find((p) => p.size === 5)!;

function renderGrid(onSolved = vi.fn()) {
  render(<Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} onSolved={onSolved} />);
  return onSolved;
}

const cell = (r: number, c: number) => screen.getByRole("button", { name: `Row ${r + 1}, column ${c + 1}` });

describe("Grid", () => {
  it("renders an NxN board with a clue for every row and column", () => {
    renderGrid();
    expect(screen.getAllByRole("button")).toHaveLength(25);
    expect(puzzle.rowClues.length).toBe(5);
    expect(puzzle.colClues.length).toBe(5);
  });

  it("calls onSolved when every correct cell is filled", () => {
    const onSolved = renderGrid();
    puzzle.solution.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v === 1) fireEvent.click(cell(r, c));
      }),
    );
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("does not call onSolved for a partial or wrong fill", () => {
    const onSolved = renderGrid();
    fireEvent.click(cell(0, 0));
    fireEvent.click(cell(1, 1));
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("cycles a cell empty → filled → X → empty", () => {
    renderGrid();
    const target = cell(0, 0);
    expect(target).toHaveAttribute("data-state", "unknown");
    fireEvent.click(target);
    expect(target).toHaveAttribute("data-state", "filled");
    fireEvent.click(target);
    expect(target).toHaveAttribute("data-state", "empty");
    expect(target).toHaveTextContent("×");
    fireEvent.click(target);
    expect(target).toHaveAttribute("data-state", "unknown");
  });

  it("dims a row clue once that row is satisfied", () => {
    const { container } = render(
      <Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} />,
    );
    const rowClue = () => container.querySelectorAll(".clue")[puzzle.size]!;
    expect(rowClue()).not.toHaveClass("clue-done");
    // Row 0 of the heart is ".#.#." — fill its two cells.
    fireEvent.click(cell(0, 1));
    fireEvent.click(cell(0, 3));
    expect(rowClue()).toHaveClass("clue-done");
  });
});

describe("Grid saved state", () => {
  it("resumes from saved cells and reports each change", () => {
    const onChange = vi.fn();
    const saved = puzzle.solution.map((row) => row.map((v) => (v === 1 ? 1 : 0)));
    render(
      <Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} initialCells={saved} onChange={onChange} />,
    );
    expect(cell(0, 1)).toHaveAttribute("data-state", "filled");
    fireEvent.click(cell(0, 0));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0][0][0]).toBe(1);
  });

  it("does not report solved again for a board that loads solved", () => {
    const onSolved = vi.fn();
    const saved = puzzle.solution.map((row) => row.map((v) => (v === 1 ? 1 : 0)));
    render(
      <Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} initialCells={saved} onSolved={onSolved} />,
    );
    expect(onSolved).not.toHaveBeenCalled();
  });
});
