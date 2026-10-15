// Pinch and pan for the board. The math is kept pure so it can be tested
// without a touch screen.

export interface View {
  /** Zoom factor. 1 is the fitted board. */
  scale: number;
  /** Pan offset in px from the centred position. */
  x: number;
  y: number;
}

export const MIN_SCALE = 1;
export const MAX_SCALE = 3;
export const RESET_VIEW: View = { scale: 1, x: 0, y: 0 };

export interface Point {
  x: number;
  y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Keep the board on screen. At scale s the board overhangs its box by (s - 1) / 2
 * of its width on each side, so the pan may not go past that.
 */
export function clampView(view: View, width: number, height: number): View {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;
  return { scale, x: clamp(view.x, -maxX, maxX), y: clamp(view.y, -maxY, maxY) };
}

/**
 * The view during a two-finger gesture. Scale follows the change in distance
 * between the fingers. Pan follows the movement of their midpoint.
 */
export function pinchView(start: { view: View; a: Point; b: Point }, now: { a: Point; b: Point }): View {
  const d0 = distance(start.a, start.b);
  const d1 = distance(now.a, now.b);
  const scale = d0 === 0 ? start.view.scale : start.view.scale * (d1 / d0);
  const m0 = midpoint(start.a, start.b);
  const m1 = midpoint(now.a, now.b);
  return {
    scale: clamp(scale, MIN_SCALE, MAX_SCALE),
    x: start.view.x + (m1.x - m0.x),
    y: start.view.y + (m1.y - m0.y),
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
