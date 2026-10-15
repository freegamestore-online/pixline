import { describe, expect, it, vi } from "vitest";
import { DAILY_TIME_CAP_MS, GAME_ID, submitDailyTime, timeScore, type FetchLike } from "./leaderboard";

const ok = (body: unknown = { ok: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

describe("timeScore", () => {
  it("ranks faster solves higher", () => {
    expect(timeScore(30_000)).toBeGreaterThan(timeScore(90_000));
  });

  it("never goes below zero", () => {
    expect(timeScore(DAILY_TIME_CAP_MS * 2)).toBe(0);
  });
});

describe("submitDailyTime", () => {
  it("posts the score for the date", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => ok({ ok: true, rank: 3 }));
    const result = await submitDailyTime("2026-10-16", 61_000, fetchImpl);
    expect(result).toEqual({ ok: true, rank: 3 });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://leaderboard.freegamestore.online/v1/api/scores");
    expect(JSON.parse(init!.body as string)).toEqual({
      game: GAME_ID,
      score: DAILY_TIME_CAP_MS - 61_000,
      period: "2026-10-16",
    });
  });

  it("fails quietly for an unpublished game", async () => {
    const fetchImpl: FetchLike = async () => ok({ ok: false, error: "Invalid game" });
    expect(await submitDailyTime("2026-10-16", 61_000, fetchImpl)).toEqual({ ok: false });
  });

  it("fails quietly when signed out or rate limited", async () => {
    const fetchImpl: FetchLike = async () => new Response("", { status: 401 });
    expect(await submitDailyTime("2026-10-16", 61_000, fetchImpl)).toEqual({ ok: false });
  });

  it("fails quietly on a network error", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new TypeError("offline");
    };
    expect(await submitDailyTime("2026-10-16", 61_000, fetchImpl)).toEqual({ ok: false });
  });

  it("does not post an impossible time", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => ok());
    expect(await submitDailyTime("2026-10-16", -5, fetchImpl)).toEqual({ ok: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
