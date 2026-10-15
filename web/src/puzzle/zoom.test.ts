import { describe, expect, it } from "vitest";
import { clampView, MAX_SCALE, MIN_SCALE, pinchView } from "./zoom";

const origin = { view: { scale: 1, x: 0, y: 0 }, a: { x: 100, y: 200 }, b: { x: 200, y: 200 } };

describe("clampView", () => {
  it("keeps the scale between the minimum and maximum", () => {
    expect(clampView({ scale: 0.2, x: 0, y: 0 }, 300, 300).scale).toBe(MIN_SCALE);
    expect(clampView({ scale: 9, x: 0, y: 0 }, 300, 300).scale).toBe(MAX_SCALE);
  });

  it("does not pan past the edge of the zoomed board", () => {
    // At scale 2 the board overhangs by half its width on each side: 150px for a 300px box.
    expect(clampView({ scale: 2, x: 500, y: -500 }, 300, 300)).toEqual({ scale: 2, x: 150, y: -150 });
  });

  it("does not pan at the fitted size", () => {
    expect(clampView({ scale: 1, x: 40, y: 40 }, 300, 300)).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe("pinchView", () => {
  it("zooms by the change in distance between the fingers", () => {
    // Fingers 100px apart, then 200px apart: double the scale.
    const next = pinchView(origin, { a: { x: 100, y: 200 }, b: { x: 300, y: 200 } });
    expect(next.scale).toBeCloseTo(2);
  });

  it("pans with the midpoint of the fingers", () => {
    const next = pinchView(origin, { a: { x: 120, y: 240 }, b: { x: 220, y: 240 } });
    expect(next.scale).toBeCloseTo(1);
    expect(next.x).toBeCloseTo(20);
    expect(next.y).toBeCloseTo(40);
  });

  it("clamps the scale during a pinch", () => {
    const next = pinchView(origin, { a: { x: 0, y: 200 }, b: { x: 1000, y: 200 } });
    expect(next.scale).toBe(MAX_SCALE);
  });

  it("keeps the scale when the fingers start on top of each other", () => {
    const start = { view: { scale: 1.5, x: 0, y: 0 }, a: { x: 50, y: 50 }, b: { x: 50, y: 50 } };
    expect(pinchView(start, { a: { x: 0, y: 0 }, b: { x: 80, y: 0 } }).scale).toBe(1.5);
  });
});
