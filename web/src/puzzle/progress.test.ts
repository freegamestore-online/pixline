import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProgress, progressKey, saveProgress, type SavedProgress } from "./progress";

const size = 5;
const cells = Array.from({ length: size }, () => new Array(size).fill(0));
const saved: SavedProgress = { cells, startedAt: 1000 };

describe("progress", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("round-trips progress per puzzle", () => {
    saveProgress("daily-a", saved);
    expect(loadProgress("daily-a", size)).toEqual(saved);
    expect(loadProgress("daily-b", size)).toBeNull();
  });

  it("keeps the solve time once saved", () => {
    saveProgress("daily-a", { ...saved, solvedMs: 4200 });
    expect(loadProgress("daily-a", size)?.solvedMs).toBe(4200);
  });

  it("ignores progress saved for a different size", () => {
    saveProgress("daily-a", saved);
    expect(loadProgress("daily-a", 7)).toBeNull();
  });

  it("ignores malformed data", () => {
    localStorage.setItem(progressKey("daily-a"), "{not json");
    expect(loadProgress("daily-a", size)).toBeNull();
    localStorage.setItem(progressKey("daily-a"), JSON.stringify({ cells: [[9]], startedAt: null }));
    expect(loadProgress("daily-a", size)).toBeNull();
  });

  it("plays on without storage when it is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => saveProgress("daily-a", saved)).not.toThrow();
    expect(loadProgress("daily-a", size)).toBeNull();
  });
});
