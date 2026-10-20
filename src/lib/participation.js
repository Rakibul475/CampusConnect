function bump(map, key, createdAt) {
  const s = map.get(key) ?? { count: 0, last: null };
  s.count += 1;
  if (!s.last || createdAt > s.last) s.last = createdAt;
  map.set(key, s);
}

// Count messages and find the latest one, per group and per author.
export function summarizeMessages(rows) {
  const byGroup = new Map();
  const byStudent = new Map();
  for (const row of rows) {
    bump(byGroup, row.group_id, row.created_at);
    bump(byStudent, row.user_id, row.created_at);
  }
  return { byGroup, byStudent };
}
