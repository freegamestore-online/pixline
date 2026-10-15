import { describe, expect, it } from "vitest";
import { celebrationBursts } from "./celebrate";

describe("celebrationBursts", () => {
  it("fires three bursts inside the box", () => {
    const bursts = celebrationBursts(320, 480);
    expect(bursts).toHaveLength(3);
    for (const b of bursts) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(320);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(480);
    }
  });

  it("starts from the centre", () => {
    expect(celebrationBursts(320, 480)[0]).toMatchObject({ x: 160, y: 240 });
  });

  it("gives every burst a positive particle count and lifetime", () => {
    for (const b of celebrationBursts(320, 480)) {
      expect(b.options.count).toBeGreaterThan(0);
      expect(b.options.life).toBeGreaterThan(0);
    }
  });
});
