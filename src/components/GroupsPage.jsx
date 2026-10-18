import { useState } from "react";
import GroupChat from "./GroupChat";
import SignInHint from "./SignInHint";

const EMPTY_GROUP = { name: "", course: "", meets: "" };

function GroupForm({ dispatch }) {
  const [form, setForm] = useState(EMPTY_GROUP);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    dispatch({
      type: "addGroup",
      group: {
        name: form.name.trim(),
        course: form.course.trim().toUpperCase(),
        meets: form.meets.trim(),
      },
    });
    setForm(EMPTY_GROUP);
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-row">
        <label>
          Group name
          <input required value={form.name} onChange={update("name")} placeholder="CSC 130 Exam Prep" />
        </label>
        <label>
          Course
          <input value={form.course} onChange={update("course")} placeholder="CSC 130" />
        </label>
      </div>
      <label>
        When and where you meet
        <input value={form.meets} onChange={update("meets")} placeholder="Mondays, 5 PM, Library" />
      </label>
      <div className="row">
        <button type="submit">Create group</button>
      </div>
    </form>
  );
}

function MembershipButton({ group, user, dispatch }) {
  const isMember = group.members.includes(user);
  return (
    <button
      className={isMember ? "secondary" : ""}
      disabled={!user}
      onClick={() => dispatch({ type: "toggleMembership", id: group.id })}
    >
      {isMember ? "Leave group" : "Join group"}
    </button>
  );
}

function GroupDetail({ group, state, dispatch, now }) {
  return (
    <section className="card">
      <a className="back" href="#/groups">← All study groups</a>
      <div className="card-header">
        <div>
          <h2>{group.name}</h2>
          <p className="meta">
            {[group.course, group.meets].filter(Boolean).join(" · ")}
          </p>
          <p className="muted">
            Members: {group.members.length ? group.members.join(", ") : "nobody yet"}
          </p>
        </div>
        <MembershipButton group={group} user={state.user} dispatch={dispatch} />
      </div>
      <GroupChat group={group} state={state} dispatch={dispatch} now={now} />
    </section>
  );
}

function GroupsPage({ state, dispatch, now, groupId }) {
  const [search, setSearch] = useState("");

  if (groupId) {
    const group = state.groups.find((g) => g.id === groupId);
    if (group) return <GroupDetail group={group} state={state} dispatch={dispatch} now={now} />;
  }

  const q = search.trim().toLowerCase();
  const groups = state.groups.filter((g) =>
    `${g.name} ${g.course}`.toLowerCase().includes(q)
  );

  return (
    <section className="card">
      <h2>Study Groups</h2>

      {state.user ? <GroupForm dispatch={dispatch} /> : <SignInHint action="create and join groups" />}

      <label className="sr-only" htmlFor="group-search">Search groups</label>
      <input
        id="group-search"
        className="search"
        placeholder="Search by group name or course..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {groups.length === 0 && <p className="empty">No groups match your search.</p>}

      {groups.map((group) => (
        <article className="item group" key={group.id}>
          <div>
            <h3>
              <a href={`#/groups/${group.id}`}>{group.name}</a>
            </h3>
            <p className="meta">{[group.course, group.meets].filter(Boolean).join(" · ")}</p>
            <p className="muted">
              {group.members.length} {group.members.length === 1 ? "member" : "members"}
            </p>
          </div>
          <div className="actions">
            <MembershipButton group={group} user={state.user} dispatch={dispatch} />
            <a className="button-link" href={`#/groups/${group.id}`}>Open chat</a>
            {group.createdBy === state.user && (
              <button className="link danger" onClick={() => dispatch({ type: "deleteGroup", id: group.id })}>
                Delete
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default GroupsPage;
