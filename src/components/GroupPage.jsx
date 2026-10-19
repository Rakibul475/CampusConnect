import { useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  getClass,
  getGroup,
  listGroupMembers,
  listMessages,
  sendMessage,
  subscribeToMessages,
} from "../lib/api";
import { timeAgo } from "../lib/dates";
import { useAsync } from "../lib/useAsync";
import { classPath } from "../lib/useHashRoute";
import { ErrorNote, Loading } from "./Status";

async function loadGroup(classId, groupId) {
  const [cls, group, members] = await Promise.all([
    getClass(classId),
    getGroup(groupId),
    listGroupMembers(classId),
  ]);
  return { cls, group, members: members.filter((m) => m.group_id === groupId) };
}

function Chat({ groupId, userId, isProfessor, professorId, groupName }) {
  const { data: messages, error, reload } = useAsync(() => listMessages(groupId), [groupId]);
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState(null);
  const bottom = useRef(null);

  useEffect(() => subscribeToMessages(groupId, reload), [groupId, reload]);

  // Backup for live updates: refresh every 15 seconds while the tab is visible.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") reload();
    }, 15000);
    return () => clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSendError(null);
    try {
      await sendMessage(groupId, body);
      setText("");
      reload();
    } catch (err) {
      setSendError(err);
    }
  }

  async function remove(id) {
    try {
      await deleteMessage(id);
      reload();
    } catch (err) {
      setSendError(err);
    }
  }

  return (
    <div className="chat">
      <ErrorNote error={error} />
      {messages && messages.length === 0 && <p className="empty">No messages yet. Start the conversation!</p>}
      {messages && messages.length > 0 && (
        <ul className="messages">
          {messages.map((m) => {
            const mine = m.user_id === userId;
            const fromProfessor = m.user_id === professorId;
            return (
              <li
                key={m.id}
                className={["message", mine && "mine", fromProfessor && "professor"].filter(Boolean).join(" ")}
              >
                <p className="muted">
                  <strong>{m.author?.full_name ?? "Former member"}</strong>
                  {fromProfessor && <span className="tag">Professor</span>}
                  {" · "}
                  {timeAgo(m.created_at)}
                  {(mine || isProfessor) && (
                    <button className="link danger" onClick={() => remove(m.id)}>Delete</button>
                  )}
                </p>
                <p className="message-body">{m.body}</p>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={bottom} />

      <form className="row" onSubmit={send}>
        <label className="sr-only" htmlFor="message">Message</label>
        <input
          id="message"
          maxLength={2000}
          placeholder={isProfessor ? `Message ${groupName} as the professor` : `Message ${groupName}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim()}>Send</button>
      </form>
      <ErrorNote error={sendError} />
    </div>
  );
}

function GroupPage({ classId, groupId, userId }) {
  const { data, error, loading } = useAsync(() => loadGroup(classId, groupId), [classId, groupId]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNote error={error} />;

  const { cls, group, members } = data;
  const isProfessor = cls?.owner_id === userId;
  const isMember = members.some((m) => m.user_id === userId);

  if (!cls || !group || (!isProfessor && !isMember)) {
    return (
      <section className="card narrow">
        <h2>You're not in this group</h2>
        <p>Only the group's students and the professor can open its chat.</p>
        <a href={cls ? classPath(classId) : "#/"}>Back</a>
      </section>
    );
  }

  return (
    <section className="card">
      <a className="back" href={classPath(classId)}>← {cls.name}</a>
      <div className="card-header">
        <div>
          <h2>{group.name}</h2>
          <p className="members">
            {members.length ? members.map((m) => m.profile?.full_name).join(", ") : "No students yet"}
          </p>
        </div>
      </div>
      <p className="hint">
        {isProfessor
          ? "You're viewing this group as the professor. Students see your messages marked Professor."
          : "This chat is private to your group and your professor."}
      </p>
      <Chat
        groupId={groupId}
        userId={userId}
        isProfessor={isProfessor}
        professorId={cls.owner_id}
        groupName={group.name}
      />
    </section>
  );
}

export default GroupPage;
