import { useState } from "react";
import {
  createGroup,
  deleteClass,
  deleteGroup,
  listGroupMembers,
  listGroups,
  listRoster,
  messageCounts,
  placeStudent,
  removeStudent,
} from "../lib/api";
import { timeAgo } from "../lib/dates";
import { useAsync } from "../lib/useAsync";
import { groupPath, inviteLink, navigate } from "../lib/useHashRoute";
import { ErrorNote, Loading } from "./Status";

async function loadClassOverview(classId) {
  const [groups, members, roster] = await Promise.all([
    listGroups(classId),
    listGroupMembers(classId),
    listRoster(classId),
  ]);
  const stats = await messageCounts(groups.map((g) => g.id));
  return { groups, members, roster, stats };
}

function InviteCard({ cls }) {
  const [copied, setCopied] = useState(false);
  const link = inviteLink(cls.join_code);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this invite link:", link);
    }
  }

  return (
    <div className="invite">
      <div>
        <p className="muted">Join code</p>
        <p className="join-code">{cls.join_code}</p>
      </div>
      <div className="invite-link">
        <p className="muted">Or share this link with your class</p>
        <div className="row">
          <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Invite link" />
          <button onClick={copy}>{copied ? "Copied!" : "Copy link"}</button>
        </div>
      </div>
    </div>
  );
}

function CreateGroupForm({ classId, onCreated }) {
  const [form, setForm] = useState({ name: "", maxMembers: "" });
  const [error, setError] = useState(null);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      await createGroup({ classId, name: form.name.trim(), maxMembers: Number(form.maxMembers) || null });
      setForm({ name: "", maxMembers: "" });
      onCreated();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-row">
        <label>
          New group name
          <input required value={form.name} onChange={update("name")} placeholder="Team 1" />
        </label>
        <label>
          Max students (optional)
          <input type="number" min={1} max={100} value={form.maxMembers} onChange={update("maxMembers")} placeholder="No limit" />
        </label>
      </div>
      <ErrorNote error={error} />
      <div className="row">
        <button type="submit">Add group</button>
      </div>
    </form>
  );
}

function ProfessorClass({ cls }) {
  const { data, error, loading, reload } = useAsync(() => loadClassOverview(cls.id), [cls.id]);
  const [actionError, setActionError] = useState(null);

  async function act(fn) {
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(err);
    }
  }

  async function removeClass() {
    if (!window.confirm(`Delete ${cls.name}? All groups and messages in it are deleted for everyone.`)) return;
    try {
      await deleteClass(cls.id);
      navigate("#/");
    } catch (err) {
      setActionError(err);
    }
  }

  const groupOf = new Map((data?.members ?? []).map((m) => [m.user_id, m.group_id]));
  const ungrouped = (data?.roster ?? []).filter((s) => !groupOf.has(s.user_id)).length;

  return (
    <div className="stack">
      <section className="card">
        <a className="back" href="#/">← Your classes</a>
        <div className="card-header">
          <div>
            <h2>{cls.name}</h2>
            <p className="meta">{[cls.term, "You're the professor"].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <InviteCard cls={cls} />
      </section>

      <ErrorNote error={error || actionError} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <section className="stats">
            <div className="stat-card"><h3>{data.roster.length}</h3><p>Students</p></div>
            <div className="stat-card"><h3>{data.groups.length}</h3><p>Groups</p></div>
            <div className="stat-card"><h3>{ungrouped}</h3><p>Without a group</p></div>
          </section>

          <section className="card">
            <h2>Groups</h2>
            <p className="muted">
              Students pick a group themselves, or you can place them from the roster below.
              Only you can see who is in each group and read every chat.
            </p>
            <CreateGroupForm classId={cls.id} onCreated={reload} />

            {data.groups.length === 0 && <p className="empty">No groups yet. Add the first one above.</p>}

            <div className="grid">
              {data.groups.map((group) => {
                const members = data.members.filter((m) => m.group_id === group.id);
                const stats = data.stats.get(group.id);
                return (
                  <article className="item group-card" key={group.id}>
                    <h3>{group.name}</h3>
                    <p className="meta">
                      {members.length}
                      {group.max_members ? ` / ${group.max_members}` : ""} students
                    </p>
                    <p className="members">
                      {members.length ? members.map((m) => m.profile?.full_name).join(", ") : "Nobody yet"}
                    </p>
                    <p className="muted">
                      {stats
                        ? `${stats.count} ${stats.count === 1 ? "message" : "messages"} · last ${timeAgo(stats.last)}`
                        : "No messages yet"}
                    </p>
                    <div className="actions">
                      <a className="button-link" href={groupPath(cls.id, group.id)}>Open chat</a>
                      <button
                        className="link danger"
                        onClick={() =>
                          window.confirm(`Delete ${group.name} and its messages?`) &&
                          act(() => deleteGroup(group.id))
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h2>Students</h2>
            {data.roster.length === 0 ? (
              <p className="empty">No students yet. Share the join code or invite link above.</p>
            ) : (
              <ul className="roster">
                {data.roster.map((student) => (
                  <li key={student.user_id}>
                    <span className="student-name">{student.profile?.full_name}</span>
                    <label className="sr-only" htmlFor={`group-${student.user_id}`}>
                      Group for {student.profile?.full_name}
                    </label>
                    <select
                      id={`group-${student.user_id}`}
                      value={groupOf.get(student.user_id) ?? ""}
                      onChange={(e) =>
                        act(() => placeStudent({ classId: cls.id, groupId: e.target.value, userId: student.user_id }))
                      }
                    >
                      <option value="">No group</option>
                      {data.groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <button
                      className="link danger"
                      onClick={() =>
                        window.confirm(`Remove ${student.profile?.full_name} from this class?`) &&
                        act(() => removeStudent(cls.id, student.user_id))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card danger-zone">
            <h2>Delete class</h2>
            <p className="muted">Deletes every group and message in {cls.name}. This can't be undone.</p>
            <button className="danger-button" onClick={removeClass}>Delete this class</button>
          </section>
        </>
      )}
    </div>
  );
}

export default ProfessorClass;
