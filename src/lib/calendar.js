import { parseLocal } from "./dates";

const DEFAULT_DURATION_HOURS = 1;

function pad(n) {
  return String(n).padStart(2, "0");
}

// Floating local time (no "Z"), so calendars show it in the student's zone.
function toCalendarStamp(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

function eventRange(event) {
  const start = parseLocal(event.date, event.time || "09:00");
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 3600000);
  return { start: toCalendarStamp(start), end: toCalendarStamp(end) };
}

function escapeIcs(text = "") {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildIcs(event, now = new Date()) {
  const { start, end } = eventRange(event);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusConnect//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@campusconnect`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function googleCalendarUrl(event) {
  const { start, end } = eventRange(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: event.location || "",
    details: event.description || "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function downloadIcs(event) {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
