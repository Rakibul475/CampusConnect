import { describe, expect, it } from "vitest";
import { eventReminders, searchEvents, upcomingEvents } from "./events";

const now = new Date(2026, 9, 18, 12, 0); // Oct 18, 2026, noon

const events = [
  { id: "b", title: "Late", date: "2026-10-20", time: "18:00", location: "Union", description: "", rsvps: ["Raki"] },
  { id: "a", title: "Early", date: "2026-10-20", time: "09:00", location: "Library", description: "Bring snacks", rsvps: [] },
  { id: "past", title: "Past", date: "2026-10-17", time: "10:00", location: "Union", description: "", rsvps: ["Raki"] },
  { id: "today", title: "Today", date: "2026-10-18", time: "08:00", location: "Gym", description: "", rsvps: ["Raki"] },
  { id: "later", title: "Later", date: "2026-10-25", time: "", location: "Quad", description: "", rsvps: ["Raki"] },
];

describe("upcomingEvents", () => {
  it("drops past days, keeps today, and sorts by date then time", () => {
    expect(upcomingEvents(events, now).map((e) => e.id)).toEqual(["today", "a", "b", "later"]);
  });
});

describe("searchEvents", () => {
  it("matches title, location and description, ignoring case", () => {
    expect(searchEvents(events, "union").map((e) => e.id)).toEqual(["b", "past"]);
    expect(searchEvents(events, "SNACKS").map((e) => e.id)).toEqual(["a"]);
  });

  it("returns everything for an empty query", () => {
    expect(searchEvents(events, "  ")).toHaveLength(events.length);
  });
});

describe("eventReminders", () => {
  it("reminds about RSVP'd events in the next two days only", () => {
    const reminders = eventReminders(events, "Raki", now);
    expect(reminders.map((r) => r.id)).toEqual(["reminder-today", "reminder-b"]);
    expect(reminders[0].text).toContain("is today");
    expect(reminders[1].text).toContain("in 2 days");
  });

  it("returns nothing when signed out", () => {
    expect(eventReminders(events, "", now)).toEqual([]);
  });
});
