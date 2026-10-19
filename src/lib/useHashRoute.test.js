import { describe, expect, it } from "vitest";
import { groupPath, inviteLink, parseHash } from "./useHashRoute";

describe("parseHash", () => {
  it("reads class, group and join routes", () => {
    expect(parseHash("#/classes/c1")).toEqual({ name: "class", classId: "c1" });
    expect(parseHash("#/classes/c1/groups/g1")).toEqual({ name: "group", classId: "c1", groupId: "g1" });
    expect(parseHash("#/join/ABC234")).toEqual({ name: "join", code: "ABC234" });
  });

  it("falls back to home for empty or unknown hashes", () => {
    expect(parseHash("")).toEqual({ name: "home" });
    expect(parseHash("#/")).toEqual({ name: "home" });
    expect(parseHash("#/nope")).toEqual({ name: "home" });
    expect(parseHash("#/join")).toEqual({ name: "home" });
  });
});

describe("links", () => {
  it("builds group paths and invite links", () => {
    expect(groupPath("c1", "g1")).toBe("#/classes/c1/groups/g1");
    expect(inviteLink("ABC234", "https://example.app")).toBe("https://example.app/#/join/ABC234");
  });
});
