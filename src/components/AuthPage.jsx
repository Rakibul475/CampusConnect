import { useState } from "react";
import { signIn, signUp } from "../lib/api";
import { ErrorNote } from "./Status";

function AuthPage({ joining }) {
  const [mode, setMode] = useState("signUp");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      if (mode === "signUp") {
        const { needsConfirmation } = await signUp({ ...form, fullName: form.fullName.trim() });
        if (needsConfirmation) {
          setNotice(`Check ${form.email} for a confirmation link, then come back and sign in.`);
          setMode("signIn");
        }
      } else {
        await signIn(form);
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card narrow">
      <h2>{mode === "signUp" ? "Create your account" : "Welcome back"}</h2>
      <p className="muted">
        {joining
          ? "Sign in or create an account to join your class."
          : "Professors create classes and groups. Students join with a code from their professor."}
      </p>

      <form className="form" onSubmit={submit}>
        {mode === "signUp" && (
          <label>
            Full name
            <input required autoComplete="name" value={form.fullName} onChange={update("fullName")} placeholder="Maya Patel" />
          </label>
        )}
        <label>
          Email
          <input required type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@csus.edu" />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            minLength={6}
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
            value={form.password}
            onChange={update("password")}
          />
        </label>
        <ErrorNote error={error} />
        {notice && <p className="hint">{notice}</p>}
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? "One moment..." : mode === "signUp" ? "Create account" : "Sign in"}
          </button>
        </div>
      </form>

      <p className="muted">
        {mode === "signUp" ? "Already have an account? " : "New here? "}
        <button className="link" onClick={() => setMode(mode === "signUp" ? "signIn" : "signUp")}>
          {mode === "signUp" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}

export default AuthPage;
