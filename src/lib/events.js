import { daysUntil, formatTime, toDateString } from "./dates";

export function sortEvents(events) {
  return [...events].sort((a, b) =>
    `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`)
  );
}

// An event stays "upcoming" for the whole day it happens on.
export function upcomingEvents(events, now) {
  const today = toDateString(now);
  return sortEvents(events.filter((event) => event.date >= today));
}

export function searchEvents(events, query) {
  const q = query.trim().toLowerCase();
  if (!q) return events;
  return events.filter((event) =>
    [event.title, event.location, event.description]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

// Reminders for events the student RSVP'd to that happen in the next two days.
export function eventReminders(events, user, now) {
  if (!user) return [];
  return upcomingEvents(events, now)
    .filter((event) => event.rsvps.includes(user))
    .map((event) => ({ event, days: daysUntil(event.date, now) }))
    .filter(({ days }) => days <= 2)
    .map(({ event, days }) => {
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : "in 2 days";
      const at = event.time ? ` at ${formatTime(event.time)}` : "";
      return {
        id: `reminder-${event.id}`,
        text: `Reminder: ${event.title} is ${when}${at} (${event.location}).`,
      };
    });
}
