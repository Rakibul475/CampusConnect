import { useState } from "react";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import { formatDate, formatTime, toDateString } from "../lib/dates";
import { searchEvents, upcomingEvents } from "../lib/events";
import SignInHint from "./SignInHint";

const EMPTY_EVENT = { title: "", date: "", time: "", location: "", description: "" };

function EventForm({ dispatch, onDone }) {
  const [form, setForm] = useState(EMPTY_EVENT);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    dispatch({
      type: "addEvent",
      event: {
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        description: form.description.trim(),
      },
    });
    setForm(EMPTY_EVENT);
    onDone();
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Event name
        <input required value={form.title} onChange={update("title")} placeholder="Hackathon kickoff" />
      </label>
      <div className="form-row">
        <label>
          Date
          <input required type="date" min={toDateString(new Date())} value={form.date} onChange={update("date")} />
        </label>
        <label>
          Time
          <input type="time" value={form.time} onChange={update("time")} />
        </label>
      </div>
      <label>
        Location
        <input required value={form.location} onChange={update("location")} placeholder="Riverside Hall 1001" />
      </label>
      <label>
        Description
        <textarea rows={3} value={form.description} onChange={update("description")} placeholder="What should people know?" />
      </label>
      <div className="row">
        <button type="submit">Post event</button>
        <button type="button" className="secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

function EventCard({ event, user, dispatch }) {
  const going = event.rsvps.includes(user);

  return (
    <article className="item event">
      <h3>{event.title}</h3>
      <p className="meta">
        {formatDate(event.date)}
        {event.time && ` · ${formatTime(event.time)}`}
      </p>
      <p className="meta">{event.location}</p>
      {event.description && <p>{event.description}</p>}
      <p className="muted">
        {event.rsvps.length} going · posted by {event.createdBy}
      </p>

      <div className="actions">
        <button
          className={going ? "secondary" : ""}
          disabled={!user}
          onClick={() => dispatch({ type: "toggleRsvp", id: event.id })}
        >
          {going ? "Going ✓" : "RSVP"}
        </button>
        <a className="button-link" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
          Google Calendar
        </a>
        <button className="link" onClick={() => downloadIcs(event)}>.ics</button>
        {event.createdBy === user && (
          <button className="link danger" onClick={() => dispatch({ type: "deleteEvent", id: event.id })}>
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function EventsPage({ state, dispatch, now }) {
  const [search, setSearch] = useState("");
  const [posting, setPosting] = useState(false);
  const events = searchEvents(upcomingEvents(state.events, now), search);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Campus Events</h2>
        {state.user && !posting && (
          <button onClick={() => setPosting(true)}>+ Post an event</button>
        )}
      </div>

      {!state.user && <SignInHint action="post events and RSVP" />}
      {posting && <EventForm dispatch={dispatch} onDone={() => setPosting(false)} />}

      <label className="sr-only" htmlFor="event-search">Search events</label>
      <input
        id="event-search"
        className="search"
        placeholder="Search events by name, place or description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {events.length === 0 ? (
        <p className="empty">
          {search ? "No events match your search." : "No upcoming events yet. Post the first one!"}
        </p>
      ) : (
        <div className="grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} user={state.user} dispatch={dispatch} />
          ))}
        </div>
      )}
    </section>
  );
}

export default EventsPage;
