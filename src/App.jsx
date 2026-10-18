import "./App.css";
import EventsPage from "./components/EventsPage";
import GroupsPage from "./components/GroupsPage";
import Header from "./components/Header";
import MessagesPage from "./components/MessagesPage";
import Nav from "./components/Nav";
import NotificationsPage from "./components/NotificationsPage";
import Stats from "./components/Stats";
import { eventReminders, upcomingEvents } from "./lib/events";
import { useHashRoute } from "./lib/useHashRoute";
import { useCampusStore } from "./store";

function App() {
  const [state, dispatch] = useCampusStore();
  const { page, id } = useHashRoute();
  const now = new Date();

  const reminders = eventReminders(state.events, state.user, now);
  const unread = state.notifications.filter((n) => !n.read).length + reminders.length;
  const myGroups = state.groups.filter((g) => g.members.includes(state.user));

  const stats = [
    { label: "Upcoming Events", value: upcomingEvents(state.events, now).length },
    { label: "Study Groups", value: state.groups.length },
    state.user
      ? { label: "Your Groups", value: myGroups.length }
      : { label: "Messages", value: state.messages.length },
  ];

  const pageProps = { state, dispatch, now };

  return (
    <div className="app">
      <Header user={state.user} dispatch={dispatch} />
      <Nav page={page} unread={page === "notifications" ? 0 : unread} />
      <Stats items={stats} />

      <main>
        {page === "events" && <EventsPage {...pageProps} />}
        {page === "groups" && <GroupsPage {...pageProps} groupId={id} />}
        {page === "messages" && <MessagesPage {...pageProps} groupId={id} />}
        {page === "notifications" && <NotificationsPage {...pageProps} reminders={reminders} />}
      </main>

      <footer>
        <p>
          CampusConnect is an independent student project, not an official
          Sacramento State service. Your data is saved in this browser only.
        </p>
        <p>
          <a href="https://github.com/Rakibul475/CampusConnect" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
          {" · "}
          <button
            className="link"
            onClick={() => {
              if (window.confirm("Reset all events, groups and messages to the demo data?")) {
                dispatch({ type: "resetDemo" });
              }
            }}
          >
            Reset demo data
          </button>
        </p>
      </footer>
    </div>
  );
}

export default App;
