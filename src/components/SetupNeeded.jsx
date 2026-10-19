function SetupNeeded() {
  return (
    <section className="card narrow">
      <h2>Almost ready</h2>
      <p>
        CampusConnect needs its Supabase project before people can sign in.
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{" "}
        to the environment, then rebuild.
      </p>
      <p className="muted">
        The steps are in{" "}
        <a href="https://github.com/Rakibul475/CampusConnect/blob/main/docs/SETUP.md">docs/SETUP.md</a>.
      </p>
    </section>
  );
}

export default SetupNeeded;
