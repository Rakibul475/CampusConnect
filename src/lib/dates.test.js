import { describe, expect, it } from "vitest";
import { timeAgo } from "./dates";

describe("timeAgo", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  const ago = (ms) => new Date(now.getTime() - ms).toISOString();

  it("describes recent times", () => {
    expect(timeAgo(ago(10_000), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5m ago");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("3h ago");
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe("2d ago");
  });

  it("never goes negative for clock skew", () => {
    expect(timeAgo(new Date(now.getTime() + 5000).toISOString(), now)).toBe("just now");
  });
});
