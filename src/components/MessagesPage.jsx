import { timeAgo } from "../lib/dates";
import GroupChat from "./GroupChat";
import SignInHint from "./SignInHint";

function MessagesPage({ state, dispatch, now, groupId }) {
  if (!state.user) {
    return (
      <section className="card">
        <h2>Messages</h2>
        <SignInHint action="chat with your study groups" />
      </section>
    );
  }

  const myGroups = state.groups.filter((g) => g.members.includes(state.user));
  const selected = myGroups.find((g) => g.id === groupId);

  if (selected) {
    return (
      <section className="card">
        <a className="back" href="#/messages">← All chats</a>
        <h2>{selected.name}</h2>
        <GroupChat group={selected} state={state} dispatch={dispatch} now={now} />
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Messages</h2>
      {myGroups.length === 0 ? (
        <p className="empty">
          You haven't joined any groups yet. <a href="#/groups">Find a study group</a> to start chatting.
        </p>
      ) : (
        myGroups.map((group) => {
          const last = state.messages.filter((m) => m.groupId === group.id).at(-1);
          return (
            <a className="item chat-preview" key={group.id} href={`#/messages/${group.id}`}>
              <h3>{group.name}</h3>
              <p className="muted">
                {last ? `${last.author}: ${last.text} · ${timeAgo(last.sentAt, now)}` : "No messages yet"}
              </p>
            </a>
          );
        })
      )}
    </section>
  );
}

export default MessagesPage;
