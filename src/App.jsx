import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("events");
  const [name, setName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [message, setMessage] = useState("");

  const events = [
    { title: "Career Fair", date: "May 20", location: "University Union" },
    { title: "AI Club Workshop", date: "May 22", location: "Riverside Hall" },
    { title: "Finals Wellness Night", date: "May 25", location: "Student Center" },
  ];

  const [groups, setGroups] = useState([
    "CSC 131 Study Group",
    "Calculus Review Group",
    "Philosophy Reading Group",
  ]);

  const [messages, setMessages] = useState([
    "Maya: Anyone want to review UML diagrams?",
    "Alex: I can meet after class.",
  ]);

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(search.toLowerCase())
  );

  function createGroup() {
    if (newGroup.trim() === "") return;
    setGroups([newGroup, ...groups]);
    setNewGroup("");
  }

  function sendMessage() {
    if (message.trim() === "") return;
    setMessages([`${name || "Student"}: ${message}`, ...messages]);
    setMessage("");
  }

  return (
    <div className="app">
      <header>
        <h1>CampusConnect</h1>
        <p>Find campus events, create study groups, and communicate with classmates.</p>

        <div className="login-box">
          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={() => setLoggedIn(!loggedIn)}>
            {loggedIn ? "Registered" : "Login / Register"}
          </button>
        </div>
      </header>

      <nav>
        <button onClick={() => setPage("events")}>Events</button>
        <button onClick={() => setPage("groups")}>Study Groups</button>
        <button onClick={() => setPage("messages")}>Messages</button>
        <button onClick={() => setPage("notifications")}>Notifications</button>
      </nav>

      <main>
        {page === "events" && (
          <section className="card">
            <h2>Campus Events</h2>
            <input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid">
              {filteredEvents.map((event, index) => (
                <div className="item" key={index}>
                  <h3>{event.title}</h3>
                  <p>{event.date}</p>
                  <p>{event.location}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === "groups" && (
          <section className="card">
            <h2>Study Groups</h2>
            <div className="row">
              <input
                placeholder="Create a study group"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              />
              <button onClick={createGroup}>Create</button>
            </div>

            {groups.map((group, index) => (
              <div className="item" key={index}>
                <h3>{group}</h3>
                <button>Join Group</button>
              </div>
            ))}
          </section>
        )}

        {page === "messages" && (
          <section className="card">
            <h2>Messages</h2>
            <div className="row">
              <input
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={sendMessage}>Send</button>
            </div>

            {messages.map((msg, index) => (
              <div className="item" key={index}>
                <p>{msg}</p>
              </div>
            ))}
          </section>
        )}

        {page === "notifications" && (
          <section className="card">
            <h2>Notifications</h2>
            <div className="item">Career Fair starts May 20.</div>
            <div className="item">You joined CSC 131 Study Group.</div>
            <div className="item">New message from Maya.</div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;