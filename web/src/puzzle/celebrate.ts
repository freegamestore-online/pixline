import type { BurstOptions } from "../feel/particles";

/** Confetti colours. Bright enough to read against both the light and dark paper. */
export const CELEBRATION_COLOURS = ["#10b981", "#2563eb", "#fbbf24", "#f472b6", "#a78bfa"] as const;

/**
 * Three bursts for a solve: one from the centre, then one from each lower
 * corner. Positions are in the pixel space of a box of the given size.
 */
export function celebrationBursts(width: number, height: number): { x: number; y: number; options: BurstOptions }[] {
  const options: BurstOptions = { count: 60, speed: [180, 480], size: [4, 9], life: 1.6 };
  return [
    { x: width / 2, y: height / 2, options: { ...options, count: 90 } },
    { x: width * 0.15, y: height * 0.85, options: { ...options, angle: -Math.PI / 3, spread: Math.PI / 2 } },
    { x: width * 0.85, y: height * 0.85, options: { ...options, angle: (-2 * Math.PI) / 3, spread: Math.PI / 2 } },
  ];
}
