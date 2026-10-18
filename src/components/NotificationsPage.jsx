import { useEffect } from "react";
import { timeAgo } from "../lib/dates";

function NotificationsPage({ state, dispatch, reminders, now }) {
  useEffect(() => {
    dispatch({ type: "markNotificationsRead" });
  }, [dispatch, state.notifications.length]);

  const empty = reminders.length === 0 && state.notifications.length === 0;

  return (
    <section className="card">
      <h2>Notifications</h2>

      {empty && (
        <p className="empty">
          Nothing yet. RSVP to events and join study groups, and updates will show up here.
        </p>
      )}

      {reminders.map((r) => (
        <div className="item reminder" key={r.id}>{r.text}</div>
      ))}

      {state.notifications.map((n) => (
        <div className="item" key={n.id}>
          <p>{n.text}</p>
          <p className="muted">{timeAgo(n.createdAt, now)}</p>
        </div>
      ))}
    </section>
  );
}

export default NotificationsPage;
