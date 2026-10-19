import { useState } from "react";
import { joinGroup, leaveClass, leaveGroup, listGroupMembers, listGroups } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { groupPath, navigate } from "../lib/useHashRoute";
import { ErrorNote, Loading } from "./Status";

async function loadStudentView(classId) {
  const [groups, members] = await Promise.all([listGroups(classId), listGroupMembers(classId)]);
  return { groups, members };
}

function StudentClass({ cls, userId }) {
  const { data, error, loading, reload } = useAsync(() => loadStudentView(cls.id), [cls.id]);
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

  async function leave() {
    if (!window.confirm(`Leave ${cls.name}? You'll need the join code to come back.`)) return;
    try {
      await leaveClass(cls.id, userId);
      navigate("#/");
    } catch (err) {
      setActionError(err);
    }
  }

  // Students can only see the members of their own group.
  const myGroupId = data?.members.find((m) => m.user_id === userId)?.group_id;
  const myGroup = data?.groups.find((g) => g.id === myGroupId);
  const teammates = data?.members.filter((m) => m.group_id === myGroupId) ?? [];

  return (
    <div className="stack">
      <section className="card">
        <a className="back" href="#/">← Your classes</a>
        <h2>{cls.name}</h2>
        <p className="meta">
          {[cls.term, cls.owner && `Professor ${cls.owner.full_name}`].filter(Boolean).join(" · ")}
        </p>
      </section>

      <ErrorNote error={error || actionError} />
      {loading && !data && <Loading />}

      {data && myGroup && (
        <section className="card">
          <h2>Your group: {myGroup.name}</h2>
          <p className="members">{teammates.map((m) => m.profile?.full_name).join(", ")}</p>
          <p className="muted">Your professor can read this group's chat.</p>
          <div className="actions">
            <a className="button-link primary" href={groupPath(cls.id, myGroup.id)}>Open group chat</a>
            <button
              className="secondary"
              onClick={() =>
                window.confirm(`Leave ${myGroup.name}?`) && act(() => leaveGroup(myGroup.id, userId))
              }
            >
              Leave group
            </button>
          </div>
        </section>
      )}

      {data && !myGroup && (
        <section className="card">
          <h2>Pick your group</h2>
          {data.groups.length === 0 ? (
            <p className="empty">Your professor hasn't created any groups yet. Check back soon.</p>
          ) : (
            <div className="grid">
              {data.groups.map((group) => {
                const full = group.max_members && group.memberCount >= group.max_members;
                return (
                  <article className="item group-card" key={group.id}>
                    <h3>{group.name}</h3>
                    <p className="meta">
                      {group.memberCount}
                      {group.max_members ? ` / ${group.max_members}` : ""} students
                    </p>
                    <div className="actions">
                      <button disabled={full} onClick={() => act(() => joinGroup(group.id))}>
                        {full ? "Full" : "Join group"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <p className="footer-action">
        <button className="link danger" onClick={leave}>Leave this class</button>
      </p>
    </div>
  );
}

export default StudentClass;
