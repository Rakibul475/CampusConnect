import { describe, expect, it } from "vitest";
import { parseHash } from "./useHashRoute";

describe("parseHash", () => {
  it("reads the page and optional id", () => {
    expect(parseHash("#/groups/csc-131")).toEqual({ page: "groups", id: "csc-131" });
    expect(parseHash("#/messages")).toEqual({ page: "messages", id: null });
  });

  it("falls back to events for empty or unknown hashes", () => {
    expect(parseHash("")).toEqual({ page: "events", id: null });
    expect(parseHash("#/nope")).toEqual({ page: "events", id: null });
  });
});
