import { useState } from "react";
import { timeAgo } from "../lib/dates";

function GroupChat({ group, state, dispatch, now }) {
  const [text, setText] = useState("");
  const isMember = group.members.includes(state.user);
  const messages = state.messages.filter((m) => m.groupId === group.id);

  function send(e) {
    e.preventDefault();
    dispatch({ type: "sendMessage", groupId: group.id, text });
    setText("");
  }

  return (
    <div className="chat">
      {messages.length === 0 ? (
        <p className="empty">No messages yet. Say hi!</p>
      ) : (
        <ul className="messages">
          {messages.map((m) => (
            <li key={m.id} className={m.author === state.user ? "message mine" : "message"}>
              <p className="muted">
                <strong>{m.author}</strong> · {timeAgo(m.sentAt, now)}
                {m.author === state.user && (
                  <button
                    className="link danger"
                    onClick={() => dispatch({ type: "deleteMessage", id: m.id })}
                  >
                    Delete
                  </button>
                )}
              </p>
              <p>{m.text}</p>
            </li>
          ))}
        </ul>
      )}

      {isMember ? (
        <form className="row" onSubmit={send}>
          <label className="sr-only" htmlFor={`message-${group.id}`}>Message</label>
          <input
            id={`message-${group.id}`}
            placeholder={`Message ${group.name}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" disabled={!text.trim()}>Send</button>
        </form>
      ) : (
        <p className="hint">
          {state.user ? "Join this group to send messages." : "Sign in and join this group to send messages."}
        </p>
      )}
    </div>
  );
}

export default GroupChat;
