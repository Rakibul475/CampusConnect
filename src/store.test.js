import { describe, expect, it } from "vitest";
import { createSeedState, reducer } from "./store";

function signedIn(name = "Raki") {
  return reducer(createSeedState(new Date(2026, 9, 18)), { type: "signIn", name });
}

describe("reducer", () => {
  it("signs in with a trimmed name and ignores blank names", () => {
    expect(signedIn("  Raki ").user).toBe("Raki");
    expect(reducer(createSeedState(), { type: "signIn", name: "   " }).user).toBe("");
  });

  it("joins and leaves a group, with a notification for each", () => {
    let state = signedIn();
    state = reducer(state, { type: "toggleMembership", id: "calc-review" });
    expect(state.groups.find((g) => g.id === "calc-review").members).toContain("Raki");
    expect(state.notifications[0].text).toBe("You joined Calculus Review Group.");

    state = reducer(state, { type: "toggleMembership", id: "calc-review" });
    expect(state.groups.find((g) => g.id === "calc-review").members).not.toContain("Raki");
    expect(state.notifications[0].text).toBe("You left Calculus Review Group.");
  });

  it("only lets group members send messages", () => {
    let state = signedIn();
    const before = state.messages.length;
    state = reducer(state, { type: "sendMessage", groupId: "csc-131", text: "hi" });
    expect(state.messages).toHaveLength(before);

    state = reducer(state, { type: "toggleMembership", id: "csc-131" });
    state = reducer(state, { type: "sendMessage", groupId: "csc-131", text: "  hi  " });
    expect(state.messages.at(-1)).toMatchObject({ author: "Raki", text: "hi", groupId: "csc-131" });
  });

  it("toggles RSVPs", () => {
    let state = signedIn();
    state = reducer(state, { type: "toggleRsvp", id: "career-fair" });
    expect(state.events.find((e) => e.id === "career-fair").rsvps).toContain("Raki");
    state = reducer(state, { type: "toggleRsvp", id: "career-fair" });
    expect(state.events.find((e) => e.id === "career-fair").rsvps).not.toContain("Raki");
  });

  it("creates events and groups owned by the user, and only the owner can delete them", () => {
    let state = signedIn();
    state = reducer(state, {
      type: "addEvent",
      event: { title: "Hack Night", date: "2026-10-30", time: "18:00", location: "RVR", description: "" },
    });
    const event = state.events.at(-1);
    expect(event).toMatchObject({ createdBy: "Raki", rsvps: ["Raki"] });

    state = reducer(state, { type: "deleteEvent", id: "career-fair" });
    expect(state.events.some((e) => e.id === "career-fair")).toBe(true);
    state = reducer(state, { type: "deleteEvent", id: event.id });
    expect(state.events.some((e) => e.id === event.id)).toBe(false);

    state = reducer(state, { type: "addGroup", group: { name: "CSC 130 Prep", course: "CSC 130", meets: "" } });
    const group = state.groups[0];
    expect(group).toMatchObject({ createdBy: "Raki", members: ["Raki"] });
    state = reducer(state, { type: "sendMessage", groupId: group.id, text: "first" });
    state = reducer(state, { type: "deleteGroup", id: group.id });
    expect(state.groups.some((g) => g.id === group.id)).toBe(false);
    expect(state.messages.some((m) => m.groupId === group.id)).toBe(false);
  });

  it("ignores actions that need a user when signed out", () => {
    const state = createSeedState();
    expect(reducer(state, { type: "toggleMembership", id: "csc-131" })).toBe(state);
    expect(reducer(state, { type: "toggleRsvp", id: "career-fair" })).toBe(state);
  });

  it("marks notifications read", () => {
    const state = reducer(signedIn(), { type: "markNotificationsRead" });
    expect(state.notifications.every((n) => n.read)).toBe(true);
  });
});
