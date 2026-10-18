import { useState } from "react";

function Header({ user, dispatch }) {
  const [name, setName] = useState("");

  function signIn(e) {
    e.preventDefault();
    dispatch({ type: "signIn", name });
    setName("");
  }

  return (
    <header>
      <div className="brand-row">
        <div className="logo-circle" aria-hidden="true">CS</div>

        <div>
          <h1>CampusConnect</h1>
          <p>
            Sac State inspired student hub for events, study groups,
            and collaboration.
          </p>
        </div>
      </div>

      {user ? (
        <div className="login-box signed-in">
          <p>
            Signed in as <strong>{user}</strong>
          </p>
          <button className="secondary" onClick={() => dispatch({ type: "signOut" })}>
            Sign out
          </button>
        </div>
      ) : (
        <form className="login-box" onSubmit={signIn}>
          <label className="sr-only" htmlFor="name">Your name</label>
          <input
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" disabled={!name.trim()}>
            Sign in
          </button>
        </form>
      )}
    </header>
  );
}

export default Header;
