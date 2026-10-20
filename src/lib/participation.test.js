import { describe, expect, it } from "vitest";
import { summarizeMessages } from "./participation";

describe("summarizeMessages", () => {
  it("counts messages and keeps the latest time per group and per student", () => {
    const { byGroup, byStudent } = summarizeMessages([
      { group_id: "g1", user_id: "ana", created_at: "2026-10-19T10:00:00Z" },
      { group_id: "g1", user_id: "ben", created_at: "2026-10-19T12:00:00Z" },
      { group_id: "g2", user_id: "ana", created_at: "2026-10-19T09:00:00Z" },
    ]);
    expect(byGroup.get("g1")).toEqual({ count: 2, last: "2026-10-19T12:00:00Z" });
    expect(byGroup.get("g2")).toEqual({ count: 1, last: "2026-10-19T09:00:00Z" });
    expect(byStudent.get("ana")).toEqual({ count: 2, last: "2026-10-19T10:00:00Z" });
    expect(byStudent.has("cara")).toBe(false);
  });
});
