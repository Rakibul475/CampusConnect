import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "./calendar";

const event = {
  id: "career-fair",
  title: "Career Fair",
  date: "2026-10-21",
  time: "10:00",
  location: "University Union, Ballroom",
  description: "Bring your resume; dress nicely",
};

describe("buildIcs", () => {
  it("builds a one-hour VEVENT with escaped text and CRLF line endings", () => {
    const ics = buildIcs(event, new Date(Date.UTC(2026, 9, 18, 17, 0, 0)));
    expect(ics).toContain("DTSTART:20261021T100000\r\n");
    expect(ics).toContain("DTEND:20261021T110000\r\n");
    expect(ics).toContain("DTSTAMP:20261018T170000Z\r\n");
    expect(ics).toContain("LOCATION:University Union\\, Ballroom\r\n");
    expect(ics).toContain("DESCRIPTION:Bring your resume\\; dress nicely\r\n");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  });

  it("defaults events without a time to 9 AM", () => {
    expect(buildIcs({ ...event, time: "" })).toContain("DTSTART:20261021T090000");
  });
});

describe("googleCalendarUrl", () => {
  it("encodes the title, dates and location", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get("text")).toBe("Career Fair");
    expect(url.searchParams.get("dates")).toBe("20261021T100000/20261021T110000");
    expect(url.searchParams.get("location")).toBe("University Union, Ballroom");
  });
});
