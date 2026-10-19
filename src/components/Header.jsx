import { signOut } from "../lib/api";

function Header({ profile }) {
  return (
    <header>
      <div className="brand-row">
        <a className="logo-circle" href="#/" aria-label="CampusConnect home">CS</a>

        <div className="brand-text">
          <h1>CampusConnect</h1>
          <p>Private group chats for your classes, with your professor in the loop.</p>
        </div>

        {profile && (
          <div className="account">
            <span>
              Signed in as <strong>{profile.full_name}</strong>
            </span>
            <button className="secondary" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
