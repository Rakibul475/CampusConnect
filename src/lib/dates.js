// Dates are stored as "YYYY-MM-DD" and times as "HH:MM", both in the
// student's local time zone.

export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function parseLocal(dateString, timeString = "00:00") {
  const [y, m, d] = dateString.split("-").map(Number);
  const [hh, mm] = timeString.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export function formatDate(dateString) {
  return parseLocal(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(timeString) {
  if (!timeString) return "";
  return parseLocal("2000-01-01", timeString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysUntil(dateString, now) {
  const start = parseLocal(toDateString(now));
  const target = parseLocal(dateString);
  return Math.round((target - start) / 86400000);
}

export function timeAgo(isoString, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(isoString)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
