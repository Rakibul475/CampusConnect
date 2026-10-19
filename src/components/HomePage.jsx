import { useState } from "react";
import { createClass, joinClass, listClasses } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { classPath, navigate } from "../lib/useHashRoute";
import { ErrorNote, Loading } from "./Status";

function JoinClassForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      navigate(classPath(await joinClass(code)));
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h3>Join a class</h3>
      <label>
        Join code from your professor
        <input
          required
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC234"
          maxLength={6}
        />
      </label>
      <ErrorNote error={error} />
      <div className="row">
        <button type="submit" disabled={busy || code.trim().length < 6}>Join class</button>
      </div>
    </form>
  );
}

function CreateClassForm({ userId }) {
  const [form, setForm] = useState({ name: "", term: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createClass({ name: form.name.trim(), term: form.term.trim(), ownerId: userId });
      navigate(classPath(created.id));
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h3>Teaching? Create a class</h3>
      <label>
        Class name
        <input required value={form.name} onChange={update("name")} placeholder="CSC 131: Software Engineering" />
      </label>
      <label>
        Term (optional)
        <input value={form.term} onChange={update("term")} placeholder="Fall 2026, Section 02" />
      </label>
      <ErrorNote error={error} />
      <div className="row">
        <button type="submit" disabled={busy}>Create class</button>
      </div>
    </form>
  );
}

function ClassList({ title, classes, empty, showOwner }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {classes.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <div className="grid">
          {classes.map((c) => (
            <a className="item class-card" key={c.id} href={classPath(c.id)}>
              <h3>{c.name}</h3>
              {c.term && <p className="meta">{c.term}</p>}
              {showOwner && c.owner && <p className="muted">Professor {c.owner.full_name}</p>}
              {!showOwner && <p className="muted">Join code {c.join_code}</p>}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function HomePage({ userId }) {
  const { data, error, loading } = useAsync(() => listClasses(userId), [userId]);

  if (loading && !data) return <Loading />;

  return (
    <div className="stack">
      <ErrorNote error={error} />
      {data && (
        <>
          <ClassList
            title="Your classes"
            classes={data.enrolled}
            showOwner
            empty="You haven't joined a class yet. Ask your professor for the join code or invite link."
          />
          {data.teaching.length > 0 && (
            <ClassList title="Classes you teach" classes={data.teaching} empty="" />
          )}
        </>
      )}
      <section className="card two-col">
        <JoinClassForm />
        <CreateClassForm userId={userId} />
      </section>
    </div>
  );
}

export default HomePage;
