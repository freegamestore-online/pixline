import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZoomArea } from "./ZoomArea";

function transformOf(container: HTMLElement) {
  return (container.querySelector('[style*="transform"]') as HTMLElement).style.transform;
}

describe("ZoomArea", () => {
  it("zooms in and out with the buttons", () => {
    const { container } = render(<ZoomArea><div>board</div></ZoomArea>);
    expect(transformOf(container)).toContain("scale(1)");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(transformOf(container)).toContain("scale(1.5)");
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(transformOf(container)).toContain("scale(1)");
  });

  it("disables zoom out at the fitted size", () => {
    render(<ZoomArea><div>board</div></ZoomArea>);
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  });

  it("returns to the fitted view with Fit", () => {
    const { container } = render(<ZoomArea><div>board</div></ZoomArea>);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(transformOf(container)).toContain("scale(1)");
  });

  it("keeps its children", () => {
    render(<ZoomArea><div>board</div></ZoomArea>);
    expect(screen.getByText("board")).toBeInTheDocument();
  });
});
