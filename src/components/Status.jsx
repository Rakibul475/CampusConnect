export function Loading({ label = "Loading..." }) {
  return <p className="empty" role="status">{label}</p>;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <p className="error" role="alert">{error.message || String(error)}</p>;
}
