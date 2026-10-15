import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { clampView, MAX_SCALE, MIN_SCALE, pinchView, RESET_VIEW, type Point, type View } from "./zoom";

interface ZoomAreaProps {
  children: ReactNode;
}

const STEP = 0.5;

/**
 * Lets a player pinch to zoom and drag to pan a large board on a phone. Two
 * fingers zoom and pan together. The zoom buttons do the same for players who
 * cannot pinch.
 */
export function ZoomArea({ children }: ZoomAreaProps) {
  const [view, setView] = useState<View>(RESET_VIEW);
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ view: View; a: Point; b: Point } | null>(null);

  function size() {
    return { width: box.current?.clientWidth ?? 0, height: box.current?.clientHeight ?? 0 };
  }

  function apply(next: View) {
    const { width, height } = size();
    setView(clampView(next, width, height));
  }

  function startGesture() {
    const [a, b] = [...pointers.current.values()];
    gesture.current = a && b ? { view, a, b } : null;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) startGesture();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size !== 2 || !g) return;
    const [a, b] = [...pointers.current.values()];
    apply(pinchView(g, { a: a!, b: b! }));
  }

  function onPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    gesture.current = null;
    if (pointers.current.size === 2) startGesture();
  }

  function zoomBy(step: number) {
    apply({ ...view, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale + step)) });
  }

  const zoomButton = { minHeight: 44, minWidth: 44, borderRadius: 999, border: "1px solid var(--line-strong)", background: "var(--paper)", color: "var(--ink)", fontWeight: 700 } as const;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        ref={box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ width: "100%", overflow: "hidden", touchAction: "none" }}
      >
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "center",
            transition: gesture.current ? "none" : "transform 0.15s ease-out",
          }}
        >
          {children}
        </div>
      </div>
      <div className="flex items-center gap-2" role="group" aria-label="Zoom">
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-STEP)} disabled={view.scale <= MIN_SCALE} style={zoomButton} className="disabled:opacity-40">
          −
        </button>
        <button type="button" aria-label="Reset zoom" onClick={() => apply(RESET_VIEW)} disabled={view.scale === MIN_SCALE && view.x === 0 && view.y === 0} style={{ ...zoomButton, padding: "0 12px" }} className="disabled:opacity-40">
          Fit
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(STEP)} disabled={view.scale >= MAX_SCALE} style={zoomButton} className="disabled:opacity-40">
          +
        </button>
      </div>
    </div>
  );
}
