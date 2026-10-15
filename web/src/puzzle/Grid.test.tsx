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
    expect(screen.getAllByRole("button", { name: /^Row \d+, column \d+$/ })).toHaveLength(25);
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
    expect(onChange.mock.calls[0]![0].cells[0][0]).toBe(1);
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

const solutionFilled = (r: number, c: number) => puzzle.solution[r]![c] === 1;

describe("Grid undo and redo", () => {
  it("undoes and redoes a tap with the buttons", () => {
    renderGrid();
    fireEvent.click(cell(0, 0));
    expect(cell(0, 0)).toHaveAttribute("data-state", "filled");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(cell(0, 0)).toHaveAttribute("data-state", "unknown");
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(cell(0, 0)).toHaveAttribute("data-state", "filled");
  });

  it("undoes with Ctrl+Z and redoes with Ctrl+Y", () => {
    renderGrid();
    fireEvent.click(cell(0, 0));
    fireEvent.click(cell(0, 0));
    expect(cell(0, 0)).toHaveAttribute("data-state", "empty");
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(cell(0, 0)).toHaveAttribute("data-state", "filled");
    fireEvent.keyDown(window, { key: "y", ctrlKey: true });
    expect(cell(0, 0)).toHaveAttribute("data-state", "empty");
  });

  it("redoes with Ctrl+Shift+Z and Cmd+Z undoes", () => {
    renderGrid();
    fireEvent.click(cell(1, 1));
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(cell(1, 1)).toHaveAttribute("data-state", "unknown");
    fireEvent.keyDown(window, { key: "Z", ctrlKey: true, shiftKey: true });
    expect(cell(1, 1)).toHaveAttribute("data-state", "filled");
    fireEvent.keyDown(window, { key: "z", metaKey: true });
    expect(cell(1, 1)).toHaveAttribute("data-state", "unknown");
  });

  it("disables Undo until there is something to undo", () => {
    renderGrid();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    fireEvent.click(cell(0, 0));
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });

  it("reports undone boards so they can be saved", () => {
    const onChange = vi.fn();
    render(<Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} onChange={onChange} />);
    fireEvent.click(cell(0, 0));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    const last = onChange.mock.calls.at(-1)![0];
    expect(last.cells[0][0]).toBe(0);
  });
});

describe("Grid mistake check", () => {
  it("is off by default, so wrong fills look normal", () => {
    renderGrid();
    const wrong = puzzle.solution.flatMap((row, r) => row.map((v, c) => (v === 0 ? [r, c] : null))).find(Boolean)!;
    fireEvent.click(cell(wrong[0]!, wrong[1]!));
    expect(cell(wrong[0]!, wrong[1]!)).not.toHaveAttribute("data-mistake");
    expect(screen.getByRole("button", { name: "Mistakes off" })).toHaveAttribute("aria-pressed", "false");
  });

  it("marks wrong fills red when turned on, and only those", () => {
    renderGrid();
    const wrongCell = puzzle.solution.flatMap((row, r) => row.map((v, c) => (v === 0 ? [r, c] : null))).find(Boolean)!;
    fireEvent.click(cell(wrongCell[0]!, wrongCell[1]!));
    fireEvent.click(screen.getByRole("button", { name: "Mistakes off" }));
    expect(cell(wrongCell[0]!, wrongCell[1]!)).toHaveAttribute("data-mistake", "true");
    // A correct fill is not a mistake.
    const rightCell = puzzle.solution.flatMap((row, r) => row.map((v, c) => (v === 1 ? [r, c] : null))).find(Boolean)!;
    fireEvent.click(cell(rightCell[0]!, rightCell[1]!));
    expect(cell(rightCell[0]!, rightCell[1]!)).not.toHaveAttribute("data-mistake");
  });
});

describe("Grid hint", () => {
  it("highlights one cell the solution fills, and only once", () => {
    renderGrid();
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    const hinted = screen.getAllByRole("button").filter((b) => b.getAttribute("data-hint") === "true");
    expect(hinted).toHaveLength(1);
    const [r, c] = hinted[0]!.getAttribute("aria-label")!.match(/\d+/g)!.map((n) => Number(n) - 1);
    expect(solutionFilled(r!, c!)).toBe(true);
    expect(screen.getByRole("button", { name: "Hint used" })).toBeDisabled();
  });

  it("saves that the hint was used", () => {
    const onChange = vi.fn();
    render(<Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    const last = onChange.mock.calls.at(-1)![0];
    expect(last.hintUsed).toBe(true);
    expect(last.hint).not.toBeNull();
  });

  it("stays used after a reload, and does not give a second hint", () => {
    render(
      <Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} initialHintUsed />,
    );
    expect(screen.getByRole("button", { name: "Hint used" })).toBeDisabled();
  });

  it("clears the highlight once that cell is filled", () => {
    renderGrid();
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    const hinted = screen.getAllByRole("button").find((b) => b.getAttribute("data-hint") === "true")!;
    fireEvent.click(hinted);
    expect(screen.queryAllByRole("button").some((b) => b.getAttribute("data-hint") === "true")).toBe(false);
  });
});

describe("Grid completion feedback", () => {
  it("marks a solved board so the picture reveals, and sets a stagger on each cell", () => {
    const { container } = render(
      <Grid
        rowClues={puzzle.rowClues}
        colClues={puzzle.colClues}
        solution={puzzle.solution}
        initialCells={puzzle.solution.map((row) => row.map((v) => (v === 1 ? 1 : 0)))}
      />,
    );
    expect(container.querySelector(".puzzle-grid")).toHaveClass("solved");
    expect(cell(0, 0).style.getPropertyValue("--delay")).toBe("0ms");
    expect(cell(2, 2).style.getPropertyValue("--delay")).toBe("140ms");
  });

  it("is not marked solved while the picture is incomplete", () => {
    renderGrid();
    expect(document.querySelector(".puzzle-grid")).not.toHaveClass("solved");
  });

  it("sweeps a shimmer on a clue the moment it becomes satisfied", () => {
    const { container } = render(<Grid rowClues={puzzle.rowClues} colClues={puzzle.colClues} solution={puzzle.solution} />);
    // Row 2 of the heart is "#####": filling all five cells satisfies its clue.
    const rowClue = () => container.querySelectorAll(".clue")[puzzle.size + 1]!;
    for (let c = 0; c < 5; c++) fireEvent.click(cell(1, c));
    expect(rowClue()).toHaveClass("clue-done");
    expect(rowClue()).toHaveClass("clue-shimmer");
  });
});
