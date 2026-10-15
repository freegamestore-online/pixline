// Daily leaderboard for Pixline. Calls the leaderboard endpoint directly, as
// number-match does, because the SDK's useLeaderboard hook has no `period` option.

export const GAME_ID = "pixline";
const API_BASE = "https://leaderboard.freegamestore.online/v1";

/**
 * The board ranks higher scores first, so a solve time is sent as the time left
 * before this cap. A faster solve gives a higher score. A solve over the cap is 0.
 */
export const DAILY_TIME_CAP_MS = 24 * 60 * 60 * 1000;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

/** The score posted for a solve time. Faster solves score higher. */
export function timeScore(solveMs: number): number {
  return Math.max(0, Math.round(DAILY_TIME_CAP_MS - solveMs));
}

/**
 * Post a daily solve time. Returns { ok: false } quietly on any failure: an
 * unpublished game ("Invalid game"), signed-out users (401), rate limits, or a
 * network error. The game does not show these.
 */
export async function submitDailyTime(
  date: string,
  solveMs: number,
  fetchImpl: FetchLike = defaultFetch,
): Promise<{ ok: boolean; rank?: number }> {
  if (!Number.isFinite(solveMs) || solveMs < 0) return { ok: false };
  try {
    const res = await fetchImpl(`${API_BASE}/api/scores`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: GAME_ID, score: timeScore(solveMs), period: date }),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { ok?: boolean; rank?: number };
    if (data.ok === false) return { ok: false };
    return data.rank === undefined ? { ok: true } : { ok: true, rank: data.rank };
  } catch {
    return { ok: false };
  }
}
